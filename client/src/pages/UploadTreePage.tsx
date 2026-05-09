import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { uploadApi, memberApi, treeApi } from '../api';
import type { FamilyTree, FamilyMember } from '../types';
import PhotoUploader from '../components/PhotoUploader';
import OcrReview, { type OcrMemberDraft } from '../components/OcrReview';

export default function UploadTreePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const treeId = Number(id);

  const [tree, setTree] = useState<FamilyTree | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoId, setPhotoId] = useState<number | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrError, setOcrError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [t, m] = await Promise.all([treeApi.get(treeId), memberApi.list(treeId)]);
      setTree(t);
      setMembers(m);
    } catch {
      navigate('/');
    }
  }, [treeId, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runOcr = async (imageUrl: string) => {
    setOcrRunning(true);
    setOcrError('');
    try {
      const Tesseract = await import('tesseract.js');
      const { data } = await Tesseract.recognize(imageUrl, 'chi_sim', {
        logger: () => {}, // silent
      });
      const text = data.text || '';
      setOcrText(text);
      // Save OCR result to backend
      if (photoId) {
        await uploadApi.updateOcr(photoId, text, 'reviewed');
      }
    } catch (err) {
      setOcrError('OCR识别失败，请检查图片质量或手动输入。');
      console.error('OCR error:', err);
    } finally {
      setOcrRunning(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadApi.treePhoto(file, treeId);
      setPhotoUrl(result.photo_url);
      setPhotoId(result.id);
      // Run OCR after upload
      await runOcr(result.photo_url);
    } catch (err: any) {
      alert(err.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveOcr = async (text: string) => {
    if (photoId) {
      await uploadApi.updateOcr(photoId, text, 'reviewed');
    }
    setOcrText(text);
  };

  const handleImport = async (drafts: OcrMemberDraft[]) => {
    for (const d of drafts) {
      await memberApi.create(treeId, {
        name: d.name,
        gender: d.gender,
        generation: d.generation,
        father_id: d.father_id,
        birth_year: d.birth_year,
      });
    }
    if (photoId) {
      await uploadApi.updateOcr(photoId, ocrText, 'imported');
    }
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/tree/${treeId}`} className="text-sm text-gray-400 hover:text-gray-600">
          ← 返回 {tree?.name || '族谱'}
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">上传族谱照片</h1>
      </div>

      {!photoUrl ? (
        <div className="max-w-xl mx-auto bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-4">
            上传现有族谱的照片或截图，系统将自动识别其中的文字信息，辅助你快速录入成员。
          </p>
          <PhotoUploader onUpload={handleUpload} uploading={uploading} />
        </div>
      ) : (
        <>
          {ocrRunning && (
            <div className="mb-4 flex items-center gap-3 bg-primary-50 text-primary-700 px-4 py-3 rounded-lg text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600" />
              正在进行OCR文字识别，请稍候...
            </div>
          )}
          {ocrError && (
            <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {ocrError}
            </div>
          )}

          <OcrReview
            photoUrl={photoUrl}
            ocrText={ocrText}
            existingMembers={members}
            onImport={handleImport}
            onSaveOcr={handleSaveOcr}
          />

          <div className="mt-6 text-center">
            <Link
              to={`/tree/${treeId}`}
              className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 font-medium transition-colors"
            >
              完成，返回族谱
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
