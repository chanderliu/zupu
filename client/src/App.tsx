import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CreateTreePage from './pages/CreateTreePage';
import TreeDetailPage from './pages/TreeDetailPage';
import UploadTreePage from './pages/UploadTreePage';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tree/new" element={<CreateTreePage />} />
          <Route path="/tree/:id" element={<TreeDetailPage />} />
          <Route path="/tree/:id/upload" element={<UploadTreePage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
