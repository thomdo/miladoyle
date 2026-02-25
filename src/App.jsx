import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Gallery from './pages/Gallery';
import ArtworkDetail from './pages/ArtworkDetail';

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/artwork/:id" element={<ArtworkDetail />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
