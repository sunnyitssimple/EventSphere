import { useEffect, useState } from "react";
import api, { errMsg } from "../api.js";
import socket from "../socket.js";
import EventCard from "../components/EventCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
const CATS = ["Music", "Tech", "Comedy", "Sports", "Food", "Arts"];
const CITIES = ["Chennai", "Bengaluru", "Hyderabad", "Mumbai", "Delhi", "Pune"];
const BACKDROP_SEEDS = ["marquee-a", "marquee-b", "marquee-c", "marquee-d", "marquee-e"];

export default function Home() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ q: "", category: "", city: "", sort: "date", page: 1 });
  const [data, setData] = useState({ items: [], pages: 1 });
  const [recs, setRecs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      api.get("/events", { params: f }).then((r) => { setData(r.data); setError(""); }).catch((e) => setError(errMsg(e)));
    }, 250); // debounce typing
    return () => clearTimeout(t);
  }, [f]);
  useEffect(() => {
    if (user) api.get("/events/recommended").then((r) => setRecs(r.data)).catch(() => {});
    else setRecs([]);
  }, [user]);

  // Live seat counts: when anyone books or cancels anywhere, patch the
  // matching card here too, so the list never shows stale numbers.
  useEffect(() => {
    const onSeats = ({ eventId, seatsLeft }) => {
      setData((d) => ({ ...d, items: d.items.map((it) => (it._id === eventId ? { ...it, seatsLeft } : it)) }));
      setRecs((r) => r.map((it) => (it._id === eventId ? { ...it, seatsLeft } : it)));
    };
    socket.on("seatsUpdated", onSeats);
    return () => socket.off("seatsUpdated", onSeats);
  }, []);

  const toggleInterest = async (c) => {
    const cur = user.interests || [];
    const next = cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c];
    const r = await api.put("/auth/interests", { interests: next });
    setUser(r.data);
    setRecs((await api.get("/events/recommended")).data);
  };
  const set = (k, v) => setF({ ...f, [k]: v, page: k === "page" ? v : 1 });

  return (
    <>
      <section className="hero-wrap">
        <div className="hero-backdrop" aria-hidden="true">
          {BACKDROP_SEEDS.map((s) => <img key={s} src={`https://picsum.photos/seed/${s}/500/700`} alt="" loading="lazy" />)}
        </div>
        <div className="marquee-strip" aria-hidden="true" />
        <h1 className="hero">Find your next night out.</h1>
        <p className="hero-sub">Live seats, real tickets, zero hassle.</p>
      </section>

      {user && (<section>
        <div className="chips"><span className="muted">I like:</span>
          {CATS.map((c) => <button key={c} className="chip" aria-pressed={user.interests?.includes(c)} onClick={() => toggleInterest(c)}>{c}</button>)}
        </div>
        {recs.length > 0 && <><h2>Recommended for you</h2><div className="grid">{recs.map((e) => <EventCard key={e._id} e={e} tag="Picked for you" />)}</div></>}
      </section>)}
      <h2>All events</h2>
      <div className="bar">
        <input placeholder="Search events, venues or cities" aria-label="Search" value={f.q} onChange={(e) => set("q", e.target.value)} />
        <select aria-label="Category" value={f.category} onChange={(e) => set("category", e.target.value)}><option value="">All categories</option>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
        <select aria-label="City" value={f.city} onChange={(e) => set("city", e.target.value)}><option value="">All cities</option>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
        <select aria-label="Sort" value={f.sort} onChange={(e) => set("sort", e.target.value)}><option value="date">Soonest</option><option value="price">Lowest price</option><option value="popular">Most popular</option><option value="rating">Top rated</option></select>
      </div>
      {error && <p className="err">{error}</p>}
      <div className="grid">{data.items.map((e) => <EventCard key={e._id} e={e} />)}</div>
      {!error && data.items.length === 0 && <p className="muted">No events match. Clear the search or change the filters.</p>}
      {data.pages > 1 && <div className="pager">
        <button className="btn ghost sm" disabled={f.page <= 1} onClick={() => set("page", f.page - 1)}>Previous</button>
        <span className="muted">Page {f.page} of {data.pages}</span>
        <button className="btn ghost sm" disabled={f.page >= data.pages} onClick={() => set("page", f.page + 1)}>Next</button>
      </div>}
    </>
  );
}
