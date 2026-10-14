import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import api, { errMsg } from "../api.js";
import socket from "../socket.js";
import { fmtDate, inr } from "../components/EventCard.jsx";
import { Stars, StarInput } from "../components/Stars.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const formatCardNumber = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
const formatExpiry = (v) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d; };

function countdown(target, now) {
  const diff = new Date(target) - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hrs}h`;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

// Builds "add to calendar" links/files from an event + a 2-hour default duration —
// no library needed, both formats are just plain text.
const icsStamp = (dt) => dt.toISOString().replace(/[-:]|\.\d{3}/g, "");
function googleCalendarUrl(e) {
  const start = new Date(e.date), end = new Date(start.getTime() + 2 * 3600000);
  const params = new URLSearchParams({
    action: "TEMPLATE", text: e.title, dates: `${icsStamp(start)}/${icsStamp(end)}`,
    details: e.description || "", location: `${e.venue}, ${e.city}`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
function downloadIcs(e, ticketCode) {
  const start = new Date(e.date), end = new Date(start.getTime() + 2 * 3600000);
  const text = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT",
    `UID:${ticketCode}@eventsphere`, `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(end)}`,
    `SUMMARY:${e.title}`, `LOCATION:${e.venue}, ${e.city}`,
    `DESCRIPTION:${(e.description || "").replace(/\n/g, " ")}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url; a.download = `${e.title.replace(/[^\w]+/g, "-")}.ics`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [e, setE] = useState(null);
  const [qty, setQty] = useState(1);
  const [tier, setTier] = useState("Standard");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [done, setDone] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvv: "" });
  const [paying, setPaying] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [now, setNow] = useState(Date.now());

  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [revMsg, setRevMsg] = useState("");

  useEffect(() => { api.get(`/events/${id}`).then((r) => setE(r.data)).catch((x) => setMsg({ type: "err", text: errMsg(x) })); }, [id]);
  useEffect(() => { api.get(`/reviews/event/${id}`).then((r) => setReviews(r.data)).catch(() => {}); }, [id, done]);

  // Live "people here now" + live seat count for this one event.
  useEffect(() => {
    socket.emit("join-event", id);
    const onViewers = (p) => { if (p.eventId === id) setViewers(p.count); };
    const onSeats = (p) => { if (p.eventId === id) setE((cur) => (cur ? { ...cur, seatsLeft: p.seatsLeft } : cur)); };
    socket.on("viewerCount", onViewers);
    socket.on("seatsUpdated", onSeats);
    return () => {
      socket.emit("leave-event", id);
      socket.off("viewerCount", onViewers);
      socket.off("seatsUpdated", onSeats);
    };
  }, [id]);

  // If seats drop live (someone else just booked), never leave the quantity
  // stepper pointing at a number higher than what's actually left.
  useEffect(() => {
    if (!e) return;
    setQty((q) => Math.max(1, Math.min(q, Math.max(1, Math.min(6, e.seatsLeft)))));
  }, [e?.seatsLeft]);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);

  if (!e) return <p className={msg.type || "muted"}>{msg.text || "Loading…"}</p>;

  const unit = tier === "Premium" ? Math.round(e.price * 1.5) : e.price;
  const max = Math.min(6, e.seatsLeft);
  const timeLeft = countdown(e.date, now);

  const pay = async (ev) => {
    ev.preventDefault();
    setMsg({ type: "", text: "" });
    setPaying(true);
    try {
      const { data: booking } = await api.post("/bookings/pay", { eventId: e._id, quantity: qty, tier, card });
      setDone(booking);
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
    } catch (x) { setMsg({ type: "err", text: errMsg(x) }); }
    setPaying(false);
  };

  const submitReview = async (ev) => {
    ev.preventDefault();
    setRevMsg("");
    if (!myRating) return setRevMsg("Pick a star rating first.");
    try {
      await api.post("/reviews", { eventId: id, rating: myRating, comment: myComment });
      setReviews((await api.get(`/reviews/event/${id}`)).data);
      setRevMsg("Thanks for your review!");
    } catch (x) { setRevMsg(errMsg(x)); }
  };

  return (
    <div className="panel">
      {e.image && <img className="hero-img" src={e.image} alt={e.title} />}
      <h1>{e.title}</h1>
      <p className="muted">{fmtDate(e.date)} · {e.venue}, {e.city} · {e.category}</p>
      {e.reviewCount > 0 && <Stars value={e.avgRating} count={e.reviewCount} />}

      <div className="live-row">
        {timeLeft && <span className="countdown">🎬 Starts in {timeLeft}</span>}
        {viewers > 0 && <span className="live-badge"><span className="live-dot" />{viewers} {viewers === 1 ? "person" : "people"} here now</span>}
      </div>

      <p>{e.description}</p>
      <p><b>{e.seatsLeft}</b> of {e.totalSeats} seats left</p>

      {done ? (
        <div className="ticket ok">
          <h2>Booking confirmed</h2>
          <img className="qr big" src={done.qrCode} alt={`QR code for ticket ${done.ticketCode}`} />
          <p>Ticket code <b>{done.ticketCode}</b> · {done.quantity} × {done.tier} · {inr(done.totalAmount)}</p>
          <p className="muted" style={{ fontSize: ".85rem" }}>Transaction {done.transactionId}</p>
          <div className="cal-actions">
            <a className="btn ghost sm" href={googleCalendarUrl(e)} target="_blank" rel="noreferrer">Add to Google Calendar</a>
            <button className="btn ghost sm" onClick={() => downloadIcs(e, done.ticketCode)}>Download .ics</button>
          </div>
          <button className="btn" style={{ marginTop: 12 }} onClick={() => nav("/bookings")}>View my bookings</button>
        </div>
      ) : e.seatsLeft === 0 ? <p className="err">Sold out.</p> : (<>
        <div className="tiers">
          {["Standard", "Premium"].map((t) => (
            <button key={t} className="tier" aria-pressed={tier === t} onClick={() => setTier(t)}>
              <b>{t}</b><br />{inr(t === "Premium" ? Math.round(e.price * 1.5) : e.price)}{t === "Premium" && " · front zone"}
            </button>))}
        </div>
        <div className="step">
          <button aria-label="Fewer tickets" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><b>{qty}</b>
          <button aria-label="More tickets" onClick={() => setQty(Math.min(max, qty + 1))}>+</button>
          <span className="muted">Max {max} per booking</span>
        </div>

        {!showForm ? (
          <button className="btn" onClick={() => (user ? setShowForm(true) : nav("/login"))}>
            {user ? `Proceed to pay ${inr(unit * qty)}` : "Log in to book"}
          </button>
        ) : (
          <form className="card-form" onSubmit={pay}>
            <label>Name on card<input required value={card.name} onChange={(ev) => setCard({ ...card, name: ev.target.value })} /></label>
            <label>Card number<input required inputMode="numeric" placeholder="1234 5678 9012 3456" value={card.number} onChange={(ev) => setCard({ ...card, number: formatCardNumber(ev.target.value) })} /></label>
            <div className="row2">
              <label>Expiry<input required inputMode="numeric" placeholder="MM/YY" value={card.expiry} onChange={(ev) => setCard({ ...card, expiry: formatExpiry(ev.target.value) })} /></label>
              <label>CVV<input required inputMode="numeric" type="password" maxLength={4} placeholder="123" value={card.cvv} onChange={(ev) => setCard({ ...card, cvv: ev.target.value.replace(/\D/g, "").slice(0, 4) })} /></label>
            </div>
            {msg.text && <p className="err" role="alert">{msg.text}</p>}
            <button className="btn" disabled={paying}>{paying ? "Processing payment…" : `Pay ${inr(unit * qty)}`}</button>
            <p className="muted" style={{ fontSize: ".85rem", marginTop: 8 }}>Test card: 4111 1111 1111 1111 · any future date · any CVV</p>
          </form>
        )}
      </>)}

      <h2 style={{ marginTop: 32 }}>Reviews{e.reviewCount > 0 && ` (${e.reviewCount})`}</h2>
      {reviews.length === 0 && <p className="muted">No reviews yet.</p>}
      {reviews.map((r) => (
        <div key={r._id} className="review">
          <div className="review-head"><b>{r.user?.name || "Someone"}</b><Stars value={r.rating} /></div>
          {r.comment && <p>{r.comment}</p>}
          <p className="muted" style={{ fontSize: ".82rem" }}>{new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
        </div>
      ))}
      {user && (
        <form className="panel review-form" onSubmit={submitReview}>
          <label>Your rating</label>
          <StarInput value={myRating} onChange={setMyRating} />
          <label>Comment (optional)<input value={myComment} onChange={(ev) => setMyComment(ev.target.value)} placeholder="How was it?" /></label>
          {revMsg && <p className={revMsg.startsWith("Thanks") ? "muted" : "err"}>{revMsg}</p>}
          <button className="btn ghost sm">Submit review</button>
          <p className="muted" style={{ fontSize: ".82rem", marginTop: 6 }}>You'll need a confirmed booking for this event first.</p>
        </form>
      )}
    </div>
  );
}
