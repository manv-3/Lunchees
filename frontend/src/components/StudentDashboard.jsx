import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api.js";
import QrCouponCard from "./QrCouponCard.jsx";

export default function StudentDashboard({ user, onUserUpdated }) {
  const [tab, setTab] = useState("today");
  const [todayCoupon, setTodayCoupon] = useState(null);
  const [history, setHistory] = useState([]);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [msg, setMsg] = useState(null);

  // Payment form state
  const [selectedPlan, setSelectedPlan] = useState("MONTHLY");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentRef, setPaymentRef] = useState("");
  const [latestReceipt, setLatestReceipt] = useState(null);
  const [paying, setPaying] = useState(false);

  const loadStudentData = useCallback(async () => {
    try {
      const [todayRes, historyRes, plansRes, paymentsRes] = await Promise.all([
        apiRequest("/student/coupon/today"),
        apiRequest("/student/coupons"),
        apiRequest("/payments/plans"),
        apiRequest("/payments/my")
      ]);
      setTodayCoupon(todayRes.coupon || null);
      setHistory(historyRes);
      setPlans(plansRes);
      setPayments(paymentsRes);
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  }, []);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  async function handleClaimToday() {
    setMsg(null);
    try {
      const res = await apiRequest("/student/coupon/claim", { method: "POST" });
      setTodayCoupon(res.coupon);
      setMsg({
        ok: true,
        text: res.created
          ? `Today's QR coupon generated: ${res.coupon.code}`
          : `Showing your existing coupon for today: ${res.coupon.code}`
      });
      loadStudentData();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  }

  async function handlePayment(e) {
    e.preventDefault();
    setMsg(null);
    setPaying(true);
    try {
      const res = await apiRequest("/payments/renew", {
        method: "POST",
        body: JSON.stringify({
          planCode: selectedPlan,
          paymentMethod,
          paymentReference: paymentRef
        })
      });
      setLatestReceipt(res.payment);
      if (onUserUpdated && res.user) {
        onUserUpdated(res.user);
      }
      setPaymentRef("");
      setMsg({
        ok: true,
        text: `Payment Successful! Transaction ${res.payment.transactionId}. Valid until ${res.payment.newValidUntil}.`
      });
      loadStudentData();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setPaying(false);
    }
  }

  const chosenPlanObj = plans.find((p) => p.code === selectedPlan);

  return (
    <div>
      <div className="panel status-banner no-print">
        <div>
          <strong>Student:</strong> {user.fullName} ({user.memberId}) &nbsp;|&nbsp;
          <strong>Branch:</strong> {user.branchSection || "CSE - CSE 22"} &nbsp;|&nbsp;
          <strong>Plan:</strong> {user.subscriptionPlan || "None"}
        </div>
        <div>
          <strong>Subscription Status: </strong>
          {user.subscriptionActive ? (
            <span className="status-tag tag-green">ACTIVE (Till {user.subscriptionEndDate})</span>
          ) : (
            <span className="status-tag tag-red">
              EXPIRED {user.subscriptionEndDate ? `(Ended ${user.subscriptionEndDate})` : ""}
            </span>
          )}
        </div>
      </div>

      {!user.subscriptionActive && (
        <div className="alert alert-warn no-print">
          <strong>Notice:</strong> Your mess subscription is inactive/expired. You must renew your subscription before generating today&apos;s lunch QR coupon.{" "}
          <button type="button" className="btn-blue small-btn" onClick={() => setTab("payment")}>
            Renew Now
          </button>
        </div>
      )}

      <div className="tab-row no-print">
        <button
          type="button"
          className={tab === "today" ? "tab-btn active-tab" : "tab-btn"}
          onClick={() => { setTab("today"); setMsg(null); }}
        >
          1. Today&apos;s QR Coupon
        </button>
        <button
          type="button"
          className={tab === "payment" ? "tab-btn active-tab" : "tab-btn"}
          onClick={() => { setTab("payment"); setMsg(null); }}
        >
          2. Renew Subscription (Payment)
        </button>
        <button
          type="button"
          className={tab === "history" ? "tab-btn active-tab" : "tab-btn"}
          onClick={() => { setTab("history"); setMsg(null); }}
        >
          3. My Coupon History ({history.length})
        </button>
      </div>

      {msg && (
        <div className={`alert no-print ${msg.ok ? "alert-ok" : "alert-bad"}`}>{msg.text}</div>
      )}

      {tab === "today" && (
        <div className="panel">
          <h2 className="no-print">Today&apos;s Lunch QR Coupon</h2>
          <p className="hint no-print">
            Generate your daily QR coupon below and show it to the Mess Staff at the counter to scan.
          </p>
          <div className="no-print" style={{ marginBottom: "12px" }}>
            <button type="button" className="btn-green" onClick={handleClaimToday}>
              {todayCoupon ? "Refresh Today's QR Coupon" : "Generate Today's Lunch QR Coupon"}
            </button>
          </div>
          {todayCoupon ? (
            <div className="single-ticket-wrap">
              <QrCouponCard coupon={todayCoupon} />
            </div>
          ) : (
            <p className="hint">No coupon generated for today yet. Click the button above to create one.</p>
          )}
        </div>
      )}

      {tab === "payment" && (
        <div className="panel">
          <h2>Renew Mess Subscription (Fee Payment)</h2>
          <form onSubmit={handlePayment} className="simple-form">
            <div className="plans-grid">
              {plans.map((p) => (
                <label
                  key={p.code}
                  className={`plan-card ${selectedPlan === p.code ? "plan-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={p.code}
                    checked={selectedPlan === p.code}
                    onChange={() => setSelectedPlan(p.code)}
                  />
                  <div>
                    <strong>{p.name}</strong>
                    <div className="plan-price">Rs. {p.priceInr}</div>
                    <div className="hint">{p.description}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="form-row-2">
              <label>
                Payment Mode:
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </label>

              <label>
                {paymentMethod === "UPI" ? "Enter UPI ID:" : paymentMethod === "Card" ? "Last 4 Card Digits / Name:" : "Bank Reference ID:"}
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder={paymentMethod === "UPI" ? "e.g. aarav@okaxis" : "e.g. 4321"}
                  required
                />
              </label>
            </div>

            <button type="submit" className="btn-blue" disabled={paying}>
              {paying
                ? "Processing Payment..."
                : `Pay Rs. ${chosenPlanObj ? chosenPlanObj.priceInr : ""} & Renew Subscription`}
            </button>
          </form>

          {latestReceipt && (
            <div className="receipt-box">
              <h3>Payment Receipt</h3>
              <p><b>Transaction ID:</b> {latestReceipt.transactionId}</p>
              <p><b>Student:</b> {latestReceipt.memberName} ({latestReceipt.memberId})</p>
              <p><b>Plan:</b> {latestReceipt.planName} | <b>Amount Paid:</b> Rs. {latestReceipt.amountInr}</p>
              <p><b>Mode:</b> {latestReceipt.paymentMethod} ({latestReceipt.paymentReference})</p>
              <p><b>New Subscription Valid Until:</b> {latestReceipt.newValidUntil}</p>
              <button type="button" className="btn-gray small-btn no-print" onClick={() => window.print()}>
                Print Receipt
              </button>
            </div>
          )}

          <hr />
          <h3>My Past Payments</h3>
          {payments.length === 0 ? (
            <p className="hint">No previous payment records found.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Txn ID</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Valid Until</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pay) => (
                  <tr key={pay.id}>
                    <td className="mono">{pay.transactionId}</td>
                    <td>{pay.planName}</td>
                    <td>Rs. {pay.amountInr}</td>
                    <td>{pay.paymentMethod} ({pay.paymentReference})</td>
                    <td>{pay.newValidUntil}</td>
                    <td>{pay.paidAt ? new Date(pay.paidAt).toLocaleString() : "-"}</td>
                    <td><span className="status-tag tag-green">{pay.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="panel">
          <h2>My Lunch Coupon History</h2>
          {history.length === 0 ? (
            <p className="hint">You have not generated any lunch coupons yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Valid Date</th>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Redeemed At</th>
                  <th>QR</th>
                </tr>
              </thead>
              <tbody>
                {history.map((c) => (
                  <tr key={c.id}>
                    <td>{c.validDate}</td>
                    <td className="mono">{c.code}</td>
                    <td>
                      <span className={`status-tag ${c.status === "REDEEMED" ? "tag-red" : "tag-green"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>{c.redeemedAt ? new Date(c.redeemedAt).toLocaleString() : "-"}</td>
                    <td>
                      <button type="button" className="btn-gray small-btn" onClick={() => setSelectedCoupon(c)}>
                        View QR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedCoupon && (
            <div style={{ marginTop: "16px" }}>
              <h3>Selected Coupon QR</h3>
              <QrCouponCard coupon={selectedCoupon} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
