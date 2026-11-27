import { useState } from "react";
import { apiRequest } from "../api.js";

export default function QrScannerPanel({ onRedeemed }) {
  const [codeInput, setCodeInput] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const coupon = await apiRequest("/coupons/redeem", {
        method: "POST",
        body: JSON.stringify({ qrData: codeInput })
      });
      setResult({ ok: true, text: `SERVED! ${coupon.memberName} (${coupon.code})` });
      setCodeInput("");
      if (onRedeemed) onRedeemed();
    } catch (err) {
      setResult({ ok: false, text: err.message });
    }
  }

  return (
    <div className="panel">
      <h2>Counter Redeem</h2>
      <form onSubmit={handleSubmit} className="inline-form">
        <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="LNC-XXXXXX" />
        <button type="submit" className="btn-blue">Redeem</button>
      </form>
      {result && <div className={result.ok ? "alert alert-ok" : "alert alert-bad"}>{result.text}</div>}
    </div>
  );
}