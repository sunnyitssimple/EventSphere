import { useEffect, useRef, useState } from "react";
import api, { errMsg } from "../api.js";

export default function CheckIn() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null); // { ok, message, booking }
  const [log, setLog] = useState([]);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);

  const submit = async (raw) => {
    const clean = (raw ?? code).trim().toUpperCase();
    if (!clean) return;
    try {
      const r = await api.put("/bookings/checkin", { code: clean });
      setResult({ ok: true, message: r.data.message, booking: r.data.booking });
      setLog((l) => [{ ok: true, code: clean, time: new Date() }, ...l].slice(0, 10));
    } catch (x) {
      setResult({ ok: false, message: errMsg(x) });
      setLog((l) => [{ ok: false, code: clean, time: new Date() }, ...l].slice(0, 10));
    }
    setCode("");
  };

  useEffect(() => {
    if (!scanning) return;
    let scanner;
    let cancelled = false;
    import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
      if (cancelled) return;
      scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 230 }, false);
      scanner.render((text) => submit(text), () => {});
      scannerRef.current = scanner;
    });
    return () => { cancelled = true; scanner?.clear().catch(() => {}); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  return (
    <div className="panel narrow">
      <h1>Ticket check-in</h1>
      <p className="muted">Scan a ticket's QR code, or type its code, to check an attendee in at the door.</p>

      <button className="btn ghost" onClick={() => setScanning((s) => !s)}>
        {scanning ? "Stop camera" : "Scan with camera"}
      </button>
      {scanning && <div id="qr-reader" style={{ margin: "14px 0" }} />}

      <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={{ marginTop: 14 }}>
        <label>Ticket code
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="EH1A2B3C" autoFocus />
        </label>
        <button className="btn">Check in</button>
      </form>

      {result && (
        <div className={`ticket ${result.ok ? "ok" : "bad"}`} role="status">
          <b>{result.ok ? "✔ " : "✕ "}{result.message}</b>
          {result.booking && (
            <p>{result.booking.user?.name} ({result.booking.user?.email}) · {result.booking.event?.title} · {result.booking.quantity} × {result.booking.tier}</p>
          )}
        </div>
      )}

      {log.length > 0 && (<>
        <h2>Recent scans this session</h2>
        {log.map((l, i) => (
          <p key={i} className={l.ok ? "muted" : "err"}>{l.code} — {l.ok ? "checked in" : "failed"} · {l.time.toLocaleTimeString("en-IN")}</p>
        ))}
      </>)}
    </div>
  );
}
