export default function ArtworkCard({ artwork, onSelect }) {
  return (
    <button className="artwork-card" onClick={() => onSelect(artwork.id)}>
      <img src={artwork.src} alt={artwork.alt} />
      <p>{artwork.title}, {artwork.year}</p>
    </button>
  );
}
