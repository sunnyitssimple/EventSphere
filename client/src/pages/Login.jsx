import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
export default function Login() {
  const [f, setF] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const { authenticate } = useAuth();
  const nav = useNavigate();
  const submit = async (ev) => {
    ev.preventDefault();
    try { authenticate((await api.post("/auth/login", f)).data); nav("/"); } catch (x) { setErr(errMsg(x)); }
  };
  return (
    <form className="auth-card" onSubmit={submit}>
      <div className="emoji">🎟️</div>
      <h1>Welcome back</h1>
      <p className="sub">Log in to book tickets and manage your bookings.</p>
      <label>Email<input type="email" required autoFocus value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
      <label>Password<input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn" style={{ width: "100%", marginTop: 6 }}>Log in</button>
      <p className="muted" style={{ marginTop: 14 }}>New here? <Link to="/register">Create an account</Link></p>
      <p className="muted" style={{ marginTop: 8, fontSize: ".85rem" }}>Try a demo account: priya@example.com / demo1234</p>
    </form>
  );
}
