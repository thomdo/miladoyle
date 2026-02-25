import { useNavigate } from 'react-router-dom';
import ArtworkCard from '../components/ArtworkCard';
import { artworks } from '../data/artworks';

export default function Gallery() {
  const navigate = useNavigate();

  return (
    <div className="gallery">
      {artworks.map((artwork) => (
        <ArtworkCard
          key={artwork.id}
          artwork={artwork}
          onSelect={(id) => navigate(`/artwork/${id}`)}
        />
      ))}
    </div>
  );
}
