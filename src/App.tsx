import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import MergePDF from './pages/MergePDF';
import SplitPDF from './pages/SplitPDF';
import CompressPDF from './pages/CompressPDF';
import PDFToWord from './pages/PDFToWord';
import PDFToExcel from './pages/PDFToExcel';
import PDFToPowerPoint from './pages/PDFToPowerPoint';
import WordToPDF from './pages/WordToPDF';
import ExcelToPDF from './pages/ExcelToPDF';
import PowerPointToPDF from './pages/PowerPointToPDF';
import JPGToPDF from './pages/JPGToPDF';
import PDFToJPG from './pages/PDFToJPG';
import PDFEditor from './pages/PDFEditor';
import RotatePDF from './pages/RotatePDF';
import OrganizePDF from './pages/OrganizePDF';
import WatermarkPDF from './pages/WatermarkPDF';
import ProtectPDF from './pages/ProtectPDF';
import UnlockPDF from './pages/UnlockPDF';
import PDFSign from './pages/PDFSign';
import ExtractPages from './pages/ExtractPages';
import OCRPDF from './pages/OCRPDF';
import CropPDF from './pages/CropPDF';
import MetadataEditor from './pages/MetadataEditor';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Contact from './pages/Contact';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/merge-pdf" element={<MergePDF />} />
          <Route path="/split-pdf" element={<SplitPDF />} />
          <Route path="/compress-pdf" element={<CompressPDF />} />
          <Route path="/pdf-to-word" element={<PDFToWord />} />
          <Route path="/pdf-to-excel" element={<PDFToExcel />} />
          <Route path="/pdf-to-powerpoint" element={<PDFToPowerPoint />} />
          <Route path="/word-to-pdf" element={<WordToPDF />} />
          <Route path="/excel-to-pdf" element={<ExcelToPDF />} />
          <Route path="/powerpoint-to-pdf" element={<PowerPointToPDF />} />
          <Route path="/jpg-to-pdf" element={<JPGToPDF />} />
          <Route path="/pdf-to-jpg" element={<PDFToJPG />} />
          <Route path="/pdf-editor" element={<PDFEditor />} />
          <Route path="/rotate-pdf" element={<RotatePDF />} />
          <Route path="/organize-pdf" element={<OrganizePDF />} />
          <Route path="/watermark-pdf" element={<WatermarkPDF />} />
          <Route path="/protect-pdf" element={<ProtectPDF />} />
          <Route path="/unlock-pdf" element={<UnlockPDF />} />
          <Route path="/pdf-sign" element={<PDFSign />} />
          <Route path="/extract-pages" element={<ExtractPages />} />
          <Route path="/ocr-pdf" element={<OCRPDF />} />
          <Route path="/crop-pdf" element={<CropPDF />} />
          <Route path="/metadata-editor" element={<MetadataEditor />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;