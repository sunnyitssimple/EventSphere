// Shared star-rating pieces: a read-only display and a clickable input.
export function Stars({ value = 0, count }) {
  return (
    <span className="stars" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= Math.round(value) ? "on" : ""}>★</span>)}
      {typeof count === "number" && <span className="count">{value.toFixed(1)} ({count})</span>}
    </span>
  );
}
export function StarInput({ value, onChange }) {
  return (
    <span className="stars input">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" aria-label={`${n} star${n > 1 ? "s" : ""}`} className={n <= value ? "on" : ""} onClick={() => onChange(n)}>★</button>
      ))}
    </span>
  );
}
