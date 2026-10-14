import { useEffect, useState } from "react";
import api, { errMsg } from "../api.js";
import { fmtDate } from "../components/EventCard.jsx";
const blank = { title: "", description: "", category: "Music", city: "", venue: "", date: "", price: "", totalSeats: "", image: "" };
export default function Admin() {
  const [events, setEvents] = useState([]);
  const [f, setF] = useState(blank);
  const [msg, setMsg] = useState("");
  const load = () => api.get("/events", { params: { limit: 100 } }).then((r) => setEvents(r.data.items));
  useEffect(() => { load(); }, []);
  const bind = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) });
  const add = async (ev) => {
    ev.preventDefault();
    try { await api.post("/events", { ...f, price: +f.price, totalSeats: +f.totalSeats }); setF(blank); setMsg("Event created."); load(); }
    catch (x) { setMsg(errMsg(x)); }
  };
  const del = async (id) => { if (confirm("Delete this event?")) { await api.delete(`/events/${id}`); load(); } };
  return (
    <>
      <h1>Admin: manage events</h1>
      <form className="panel form2" onSubmit={add}>
        <label>Title<input required {...bind("title")} /></label>
        <label>Category<select {...bind("category")}>{["Music", "Tech", "Comedy", "Sports", "Food", "Arts"].map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>City<input required {...bind("city")} /></label>
        <label>Venue<input required {...bind("venue")} /></label>
        <label>Date and time<input type="datetime-local" required {...bind("date")} /></label>
        <label>Price (₹)<input type="number" min="0" required {...bind("price")} /></label>
        <label>Total seats<input type="number" min="1" required {...bind("totalSeats")} /></label>
        <label>Image URL (optional)<input placeholder="https://picsum.photos/seed/my-event/800/500" {...bind("image")} /></label>
        <label>Description<input {...bind("description")} /></label>
        <button className="btn">Create event</button>{msg && <p className="muted">{msg}</p>}
      </form>
      {events.map((e) => (
        <div key={e._id} className="panel booking">
          {e.image && <img className="qr" src={e.image} alt="" />}
          <div className="info"><b>{e.title}</b><p className="muted">{fmtDate(e.date)} · {e.city} · {e.seatsLeft}/{e.totalSeats} seats left{e.reviewCount > 0 && ` · ★ ${e.avgRating} (${e.reviewCount})`}</p></div>
          <button className="btn ghost sm" onClick={() => del(e._id)}>Delete</button>
        </div>))}
    </>
  );
}
