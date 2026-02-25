import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArtworkCard from '../components/ArtworkCard';
import { fetchArtworks } from '../data/artworks';

export default function Gallery() {
  const navigate = useNavigate();
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtworks()
      .then(setArtworks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <div className="gallery">
      {artworks.map((artwork) => (
        <ArtworkCard
          key={artwork.id}
          artwork={{ ...artwork, src: `/api/images/${artwork.imageKey}` }}
          onSelect={(id) => navigate(`/artwork/${id}`)}
        />
      ))}
    </div>
  );
}
