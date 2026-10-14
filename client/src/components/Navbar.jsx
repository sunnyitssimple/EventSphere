import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header className="nav">
      <Link to="/" className="logo">Event Sphere</Link>
      <nav>
        {user ? (<>
          <Link to="/bookings">My bookings</Link>
          {user.role === "admin" && <><Link to="/admin">Admin</Link><Link to="/checkin">Check-in</Link></>}
          <button className="link" onClick={() => { logout(); nav("/"); }}>Log out ({user.name})</button>
        </>) : (<><Link to="/login">Log in</Link><Link to="/register" className="btn sm">Sign up</Link></>)}
      </nav>
    </header>
  );
}
