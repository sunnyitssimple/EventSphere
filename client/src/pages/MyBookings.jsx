import { useEffect, useState } from "react";
import api, { errMsg } from "../api.js";
import { fmtDate, inr } from "../components/EventCard.jsx";
export default function MyBookings() {
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");
  const load = () => api.get("/bookings/mine").then((r) => setList(r.data)).catch((x) => setErr(errMsg(x)));
  useEffect(() => { load(); }, []);
  const cancel = async (id) => {
    if (!confirm("Cancel this booking? Your seats will be released.")) return;
    try { await api.put(`/bookings/${id}/cancel`); load(); } catch (x) { setErr(errMsg(x)); }
  };
  if (!list) return <p className="muted">{err || "Loading…"}</p>;
  return (
    <>
      <h1>My bookings</h1>
      {err && <p className="err">{err}</p>}
      {list.length === 0 && <p className="muted">No bookings yet. Pick an event on the home page.</p>}
      {list.map((b) => (
        <div key={b._id} className={`panel booking ${b.status}`}>
          {b.status === "confirmed" && <img className="qr" src={b.qrCode} alt={`QR code for ticket ${b.ticketCode}`} />}
          <div className="info"><h3>{b.event?.title || "Event removed"}</h3>
            <p className="muted">{b.event && `${fmtDate(b.event.date)} · ${b.event.venue}`}</p>
            <p>{b.quantity} × {b.tier} · {inr(b.totalAmount)} · <b>{b.ticketCode}</b> · {b.status}{b.checkedIn && " · checked in"}</p></div>
          {b.status === "confirmed" && <button className="btn ghost sm" onClick={() => cancel(b._id)}>Cancel booking</button>}
        </div>))}
    </>
  );
}
