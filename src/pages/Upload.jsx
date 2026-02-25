import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Upload() {
  const { user, loading } = useAuth();
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState(null);
  const [uploading, setUploading] = useState(false);

  if (loading) return null;

  if (!user) {
    return (
      <div className="login-page">
        <p>Sign in to upload artwork.</p>
        <a href="/api/auth/login" className="google-login-button">
          Sign in with Google
        </a>
      </div>
    );
  }

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    if (selected) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title || !year) return;

    setUploading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', title);
    formData.append('year', year);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', message: `"${data.artwork.title}" uploaded!` });
        setTitle('');
        setYear('');
        setFile(null);
        setPreview(null);
      } else {
        setStatus({ type: 'error', message: data.error || 'Upload failed' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <h2>Upload Artwork</h2>
      <form className="upload-form" onSubmit={handleSubmit}>
        <label>
          Image
          <input
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={handleFileChange}
            required
          />
        </label>
        {preview && <img className="upload-preview" src={preview} alt="Preview" />}
        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. A silly robot"
            maxLength={200}
            required
          />
        </label>
        <label>
          Year
          <input
            type="text"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g. 2024"
            maxLength={4}
            required
          />
        </label>
        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {status && (
        <p className={`upload-status ${status.type}`}>{status.message}</p>
      )}
    </div>
  );
}
