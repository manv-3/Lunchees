import { useCallback, useEffect, useState } from "react";
import { apiRequest, todayStr } from "../api.js";
import QrCouponCard from "./QrCouponCard.jsx";
import QrScannerPanel from "./QrScannerPanel.jsx";

export default function AdminDashboard() {
  const [tab, setTab] = useState("generate");

  // Generate coupons state
  const [genDate, setGenDate] = useState(todayStr());
  const [roster, setRoster] = useState("22CSE042, Aarav Sharma\n22CSE044, Rohan Gupta");
  const [generatedCoupons, setGeneratedCoupons] = useState([]);
  const [genMsg, setGenMsg] = useState(null);

  // Tracker state
  const [trackDate, setTrackDate] = useState(todayStr());
  const [trackStatus, setTrackStatus] = useState("");
  const [search, setSearch] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState({ total: 0, redeemed: 0, active: 0 });
  const [previewCoupon, setPreviewCoupon] = useState(null);

  // Users state
  const [users, setUsers] = useState([]);
  const [userMsg, setUserMsg] = useState(null);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    fullName: "",
    role: "STUDENT",
    memberId: "",
    branchSection: "CSE - CSE 22",
    initialDays: 30
  });

  // Payments state
  const [paymentData, setPaymentData] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    payments: []
  });

  const loadTracker = useCallback(async () => {
    try {
      const params = new URLSearchParams({ date: trackDate });
      if (trackStatus) params.append("status", trackStatus);
      if (search.trim()) params.append("search", search.trim());

      const [listRes, statsRes] = await Promise.all([
        apiRequest(`/coupons?${params.toString()}`),
        apiRequest(`/coupons/stats?date=${trackDate}`)
      ]);
      setCoupons(listRes);
      setStats(statsRes);
    } catch {
      /* ignore transient error */
    }
  }, [trackDate, trackStatus, search]);

  const loadUsers = useCallback(async () => {
    try {
      setUsers(await apiRequest("/admin/users"));
    } catch {
      /* ignore */
    }
  }, []);

  const loadPayments = useCallback(async () => {
    try {
      setPaymentData(await apiRequest("/payments"));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadTracker();
    loadUsers();
    loadPayments();
  }, [loadTracker, loadUsers, loadPayments]);

  async function handleGenerateFromRoster() {
    setGenMsg(null);
    const members = roster
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const idx = line.indexOf(",");
        return idx === -1
          ? { memberId: line, memberName: "" }
          : { memberId: line.slice(0, idx).trim(), memberName: line.slice(idx + 1).trim() };
      });

    try {
      const made = await apiRequest("/coupons/generate", {
        method: "POST",
        body: JSON.stringify({ validDate: genDate, members })
      });
      setGeneratedCoupons(made);
      const skipped = members.length - made.length;
      setGenMsg({
        ok: true,
        text: `${made.length} QR coupons created` + (skipped > 0 ? ` (${skipped} skipped - already existed)` : "")
      });
      loadTracker();
    } catch (err) {
      setGenMsg({ ok: false, text: err.message });
    }
  }

  async function handleGenerateActiveStudents() {
    setGenMsg(null);
    try {
      const res = await apiRequest("/coupons/generate-active", {
        method: "POST",
        body: JSON.stringify({ validDate: genDate })
      });
      setGeneratedCoupons(res.created || []);
      setGenMsg({
        ok: true,
        text: `Generated ${(res.created || []).length} QR coupons for active students (${res.skipped} already had coupons).`
      });
      loadTracker();
    } catch (err) {
      setGenMsg({ ok: false, text: err.message });
    }
  }

  async function handleDeleteCoupon(id) {
    try {
      await apiRequest(`/coupons/${id}`, { method: "DELETE" });
      loadTracker();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setUserMsg(null);
    try {
      await apiRequest("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          ...newUser,
          initialDays: Number(newUser.initialDays) || 0
        })
      });
      setUserMsg({ ok: true, text: `User ${newUser.username} created successfully!` });
      setNewUser({
        username: "",
        password: "",
        fullName: "",
        role: "STUDENT",
        memberId: "",
        branchSection: "CSE - CSE 22",
        initialDays: 30
      });
      loadUsers();
    } catch (err) {
      setUserMsg({ ok: false, text: err.message });
    }
  }

  async function handleExtend(userId) {
    try {
      await apiRequest(`/admin/users/${userId}/extend`, {
        method: "POST",
        body: JSON.stringify({ days: 30, planName: "Admin Extended (30 Days)" })
      });
      setUserMsg({ ok: true, text: "Subscription extended by 30 days." });
      loadUsers();
    } catch (err) {
      setUserMsg({ ok: false, text: err.message });
    }
  }

  return (
    <div>
      <div className="tab-row no-print">
        <button
          type="button"
          className={tab === "generate" ? "tab-btn active-tab" : "tab-btn"}
          onClick={() => setTab("generate")}
        >
          1. Generate QR Coupons
        </button>
        <button
          type="button"
          className={tab === "tracker" ? "tab-btn active-tab" : "tab-btn"}
          onClick={() => setTab("tracker")}
        >
          2. Scan &amp; Tracker
        </button>
        <button
          type="button"
          className={tab === "users" ? "tab-btn active-tab" : "tab-btn"}
          onClick={() => setTab("users")}
        >
          3. Students &amp; Staff ({users.length})
        </button>
        <button
          type="button"
          className={tab === "payments" ? "tab-btn active-tab" : "tab-btn"}
          onClick={() => { setTab("payments"); loadPayments(); }}
        >
          4. Payment Logs ({paymentData.totalTransactions})
        </button>
      </div>

      {tab === "generate" && (
        <div className="panel">
          <h2 className="no-print">Generate Lunch Coupons with QR Code</h2>
          <div className="simple-form no-print">
            <label>
              Coupon Valid Date:
              <input type="date" value={genDate} onChange={(e) => setGenDate(e.target.value)} />
            </label>

            <div className="inline-actions">
              <button type="button" className="btn-green" onClick={handleGenerateActiveStudents}>
                Auto-Generate for All Active Subscribed Students
              </button>
            </div>

            <hr />

            <label>
              Or Enter Custom Student List (one per line as <code>RollNo, Full Name</code>):
              <textarea
                rows={4}
                value={roster}
                onChange={(e) => setRoster(e.target.value)}
                placeholder={"22CSE042, Aarav Sharma\n22CSE043, Priya Verma"}
              />
            </label>

            <div className="inline-actions">
              <button
                type="button"
                className="btn-blue"
                onClick={handleGenerateFromRoster}
                disabled={!roster.trim()}
              >
                Generate QR Coupons from List
              </button>
              {generatedCoupons.length > 0 && (
                <button type="button" className="btn-gray" onClick={() => window.print()}>
                  Print Generated QR Coupons
                </button>
              )}
            </div>
          </div>

          {genMsg && (
            <div className={`alert no-print ${genMsg.ok ? "alert-ok" : "alert-bad"}`}>
              {genMsg.text}
            </div>
          )}

          {generatedCoupons.length > 0 && (
            <div className="tickets-grid">
              {generatedCoupons.map((c) => (
                <QrCouponCard key={c.id} coupon={c} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "tracker" && (
        <div>
          <QrScannerPanel onRedeemed={loadTracker} />

          <div className="panel">
            <h2>All Coupons Tracker</h2>
            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-num">{stats.total}</div>
                <div>Total Issued</div>
              </div>
              <div className="stat-box">
                <div className="stat-num green-text">{stats.redeemed}</div>
                <div>Used / Served</div>
              </div>
              <div className="stat-box">
                <div className="stat-num blue-text">{stats.active}</div>
                <div>Waiting</div>
              </div>
            </div>

            <div className="filter-row">
              <input type="date" value={trackDate} onChange={(e) => setTrackDate(e.target.value)} />
              <select value={trackStatus} onChange={(e) => setTrackStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="REDEEMED">REDEEMED</option>
              </select>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roll no / name / code..."
              />
              <button type="button" className="btn-gray" onClick={loadTracker}>Refresh</button>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Status</th>
                  <th>Redeemed At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{c.code}</td>
                    <td>{c.memberName || "-"}</td>
                    <td>{c.memberId}</td>
                    <td>
                      <span className={`status-tag ${c.status === "REDEEMED" ? "tag-red" : "tag-green"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>{c.redeemedAt ? new Date(c.redeemedAt).toLocaleTimeString() : "-"}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-gray small-btn"
                        onClick={() => setPreviewCoupon(c)}
                      >
                        QR
                      </button>{" "}
                      {c.status === "ACTIVE" && (
                        <button
                          type="button"
                          className="btn-red small-btn"
                          onClick={() => handleDeleteCoupon(c.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {previewCoupon && (
              <div style={{ marginTop: "16px" }}>
                <h3>QR Preview ({previewCoupon.code})</h3>
                <QrCouponCard coupon={previewCoupon} />
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="panel">
          <h2>Add Student or Mess Staff</h2>
          <form onSubmit={handleCreateUser} className="simple-form">
            <div className="form-row-2">
              <label>
                Username:
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  required
                />
              </label>
              <label>
                Password:
                <input
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </label>
              <label>
                Full Name:
                <input
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  required
                />
              </label>
              <label>
                Roll No / Staff ID:
                <input
                  type="text"
                  value={newUser.memberId}
                  onChange={(e) => setNewUser({ ...newUser, memberId: e.target.value.toUpperCase() })}
                  required
                />
              </label>
              <label>
                Role:
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="MESS_STAFF">MESS_STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>
              <label>
                Branch &amp; Section:
                <input
                  type="text"
                  value={newUser.branchSection}
                  onChange={(e) => setNewUser({ ...newUser, branchSection: e.target.value })}
                />
              </label>
              {newUser.role === "STUDENT" && (
                <label>
                  Initial Subscription Days (0 for unpaid):
                  <input
                    type="number"
                    min="0"
                    value={newUser.initialDays}
                    onChange={(e) => setNewUser({ ...newUser, initialDays: e.target.value })}
                  />
                </label>
              )}
            </div>
            <button type="submit" className="btn-blue">Add User</button>
          </form>

          {userMsg && (
            <div className={`alert ${userMsg.ok ? "alert-ok" : "alert-bad"}`}>{userMsg.text}</div>
          )}

          <hr />
          <h3>Registered Users &amp; Mess Subscriptions</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>ID / Roll No</th>
                <th>Role</th>
                <th>Branch</th>
                <th>Subscription</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="mono">{u.username}</td>
                  <td>{u.fullName}</td>
                  <td>{u.memberId}</td>
                  <td><span className="role-badge">{u.role}</span></td>
                  <td>{u.branchSection}</td>
                  <td>
                    {u.role === "STUDENT" ? (
                      u.subscriptionActive ? (
                        <span className="status-tag tag-green">Valid till {u.subscriptionEndDate}</span>
                      ) : (
                        <span className="status-tag tag-red">Expired / Inactive</span>
                      )
                    ) : (
                      <span>Staff Access</span>
                    )}
                  </td>
                  <td>
                    {u.role === "STUDENT" && (
                      <button
                        type="button"
                        className="btn-green small-btn"
                        onClick={() => handleExtend(u.id)}
                      >
                        +30 Days
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "payments" && (
        <div className="panel">
          <h2>Student Mess Subscription Payments</h2>
          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-num green-text">Rs. {paymentData.totalRevenue}</div>
              <div>Total Mess Revenue</div>
            </div>
            <div className="stat-box">
              <div className="stat-num blue-text">{paymentData.totalTransactions}</div>
              <div>Total Transactions</div>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Student</th>
                <th>Roll No</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Valid Until</th>
                <th>Paid At</th>
              </tr>
            </thead>
            <tbody>
              {paymentData.payments.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{p.transactionId}</td>
                  <td>{p.memberName}</td>
                  <td>{p.memberId}</td>
                  <td>{p.planName}</td>
                  <td>Rs. {p.amountInr}</td>
                  <td>{p.paymentMethod} ({p.paymentReference})</td>
                  <td>{p.newValidUntil}</td>
                  <td>{p.paidAt ? new Date(p.paidAt).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
