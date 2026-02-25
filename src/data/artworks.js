export async function fetchArtworks() {
  const res = await fetch('/api/artworks');
  if (!res.ok) throw new Error('Failed to fetch artworks');
  return res.json();
}
