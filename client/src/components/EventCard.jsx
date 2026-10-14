import { Link } from "react-router-dom";
import { Stars } from "./Stars.jsx";
export const fmtDate = (d) => new Date(d).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
export const inr = (n) => "₹" + n.toLocaleString("en-IN");
export default function EventCard({ e, tag }) {
  return (
    <Link to={`/events/${e._id}`} className={`card cat-${e.category}`}>
      <div className={`top${e.image ? " has-photo" : ""}`} style={e.image ? { backgroundImage: `url(${e.image})` } : undefined}>
        <span className="price-badge">{inr(e.price)}</span>
        {tag ? <span className="tag">{tag}</span> : <small>{e.category}</small>}
        <h3>{e.title}</h3>
      </div>
      <div className="perf" />
      <div className="bot">
        <div>
          {fmtDate(e.date)}<span className="muted d">{e.venue}, {e.city}</span>
          {e.reviewCount > 0 && <Stars value={e.avgRating} count={e.reviewCount} />}
          {e.seatsLeft === 0 ? <span className="low d">Sold out</span> : e.seatsLeft <= 20 && <span className="low d">Only {e.seatsLeft} left</span>}
        </div>
      </div>
    </Link>
  );
}
