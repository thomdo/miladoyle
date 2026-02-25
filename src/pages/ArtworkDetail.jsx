import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchArtworks } from '../data/artworks';

export default function ArtworkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtworks()
      .then((artworks) => {
        const found = artworks.find((a) => a.id === id);
        setArtwork(found || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return null;
  if (!artwork) return null;

  return (
    <div className="artwork-detail">
      <button className="back-button" onClick={() => navigate('/')}>← Back</button>
      <img src={`/api/images/${artwork.imageKey}`} alt={artwork.alt} />
      <p>{artwork.title}, {artwork.year}</p>
    </div>
  );
}
