import { artworks } from '../data/artworks';

export default function ArtworkDetail({ id, onBack }) {
  const artwork = artworks.find((a) => a.id === id);

  if (!artwork) return null;

  return (
    <div className="artwork-detail">
      <button className="back-button" onClick={onBack}>← Back</button>
      <img src={artwork.src} alt={artwork.alt} />
      <p>{artwork.title}, {artwork.year}</p>
    </div>
  );
}
