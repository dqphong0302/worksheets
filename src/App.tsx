import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { EditorPage } from './pages/EditorPage';
import './vendor/pdui/pdui.css';
import './i18n';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor/:type" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
