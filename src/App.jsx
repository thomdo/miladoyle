import { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Gallery from './pages/Gallery';
import ArtworkDetail from './pages/ArtworkDetail';

export default function App() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <>
      <Header onHome={() => setSelectedId(null)} />
      <main>
        {selectedId === null
          ? <Gallery onSelect={setSelectedId} />
          : <ArtworkDetail id={selectedId} onBack={() => setSelectedId(null)} />
        }
      </main>
      <Footer />
    </>
  );
}
