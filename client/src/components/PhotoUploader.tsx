import { useState, useRef } from 'react';

interface Props {
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  uploadedUrl?: string;
}

export default function PhotoUploader({ onUpload, uploading, uploadedUrl }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(uploadedUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    await onUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-primary-400 bg-primary-50'
            : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'
        }`}
      >
        {preview ? (
          <div className="space-y-3">
            <img src={preview} alt="预览" className="max-h-64 mx-auto rounded-lg shadow" />
            <p className="text-sm text-gray-500">点击或拖拽更换照片</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-5xl">📷</div>
            <p className="text-gray-600 font-medium">拖拽族谱照片到此处</p>
            <p className="text-sm text-gray-400">或点击选择文件 (支持 jpg, png)</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
      </div>
      {uploading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-primary-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600" />
          上传中...
        </div>
      )}
    </div>
  );
}
