import { useState } from "react";
import { apiRequest, todayStr } from "../api.js";
import QrCouponCard from "./QrCouponCard.jsx";

export default function AdminDashboard() {
  const [genDate, setGenDate] = useState(todayStr());
  const [roster, setRoster] = useState("");
  const [coupons, setCoupons] = useState([]);

  async function generate() {
    const members = roster.split("\n").filter(Boolean).map((l) => {
      const i = l.indexOf(",");
      return i === -1 ? { memberId: l.trim(), memberName: "" } : { memberId: l.slice(0, i).trim(), memberName: l.slice(i + 1).trim() };
    });
    setCoupons(await apiRequest("/coupons/generate", { method: "POST", body: JSON.stringify({ validDate: genDate, members }) }));
  }

  return (
    <div className="panel">
      <h2>Generate QR Coupons</h2>
      <input type="date" value={genDate} onChange={(e) => setGenDate(e.target.value)} />
      <textarea rows={4} value={roster} onChange={(e) => setRoster(e.target.value)} />
      <button type="button" className="btn-blue" onClick={generate}>Generate</button>
      <div className="tickets-grid">{coupons.map((c) => <QrCouponCard key={c.id} coupon={c} />)}</div>
    </div>
  );
}