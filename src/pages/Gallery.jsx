import ArtworkCard from '../components/ArtworkCard';
import { artworks } from '../data/artworks';

export default function Gallery({ onSelect }) {
  return (
    <div className="gallery">
      {artworks.map((artwork) => (
        <ArtworkCard key={artwork.id} artwork={artwork} onSelect={onSelect} />
      ))}
    </div>
  );
}
