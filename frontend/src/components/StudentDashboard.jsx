import { useState } from "react";
import { apiRequest } from "../api.js";
import QrCouponCard from "./QrCouponCard.jsx";

export default function StudentDashboard({ user }) {
  const [coupon, setCoupon] = useState(null);
  const [msg, setMsg] = useState("");

  async function claim() {
    try {
      const res = await apiRequest("/student/coupon/claim", { method: "POST" });
      setCoupon(res.coupon);
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <div className="panel">
      <h2>Welcome {user.fullName}</h2>
      <button type="button" className="btn-green" onClick={claim}>Generate Today QR Coupon</button>
      {msg && <div className="alert alert-bad">{msg}</div>}
      {coupon && <QrCouponCard coupon={coupon} />}
    </div>
  );
}