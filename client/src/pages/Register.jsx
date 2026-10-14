import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
export default function Register() {
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const { authenticate } = useAuth();
  const nav = useNavigate();
  const submit = async (ev) => {
    ev.preventDefault();
    try { authenticate((await api.post("/auth/register", f)).data); nav("/"); } catch (x) { setErr(errMsg(x)); }
  };
  const bind = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) });
  return (
    <form className="auth-card" onSubmit={submit}>
      <div className="emoji">🎉</div>
      <h1>Create your account</h1>
      <p className="sub">Sign up to discover events and book tickets.</p>
      <label>Full name<input required autoFocus {...bind("name")} /></label>
      <label>Email<input type="email" required {...bind("email")} /></label>
      <label>Password (6+ characters)<input type="password" minLength={6} required {...bind("password")} /></label>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn" style={{ width: "100%", marginTop: 6 }}>Sign up</button>
      <p className="muted" style={{ marginTop: 14 }}>Already registered? <Link to="/login">Log in</Link></p>
    </form>
  );
}
