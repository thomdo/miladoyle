import { useNavigate } from 'react-router-dom';
import daisyImg from '../../assets/images/pink-daisy.png';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header onClick={() => navigate('/')}>
      <img src={daisyImg} alt="A pink daisy flower." width="96" />
      <h1>Mila's<br />Meows & Crafts</h1>
    </header>
  );
}
