import { useParams, useNavigate } from 'react-router-dom';
import { artworks } from '../data/artworks';

export default function ArtworkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const artwork = artworks.find((a) => a.id === id);

  if (!artwork) return null;

  return (
    <div className="artwork-detail">
      <button className="back-button" onClick={() => navigate('/')}>← Back</button>
      <img src={artwork.src} alt={artwork.alt} />
      <p>{artwork.title}, {artwork.year}</p>
    </div>
  );
}
