import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import daisyImg from '../../assets/images/pink-daisy.png';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <header>
      <div className="header-main" onClick={() => navigate('/')}>
        <img src={daisyImg} alt="A pink daisy flower." width="96" />
        <h1>Mila's<br />Meows & Crafts</h1>
      </div>
      {user && (
        <nav className="header-nav">
          <button onClick={() => navigate('/upload')}>Upload</button>
          <button onClick={logout}>Sign out</button>
        </nav>
      )}
    </header>
  );
}
