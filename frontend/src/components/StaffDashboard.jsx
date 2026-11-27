import { useCallback, useEffect, useState } from "react";
import { apiRequest, todayStr } from "../api.js";
import QrScannerPanel from "./QrScannerPanel.jsx";

export default function StaffDashboard() {
  const [date, setDate] = useState(todayStr());
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState({ total: 0, redeemed: 0, active: 0 });
  const [msg, setMsg] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ date });
      if (status) params.append("status", status);
      if (search.trim()) params.append("search", search.trim());

      const [listRes, statsRes] = await Promise.all([
        apiRequest(`/coupons?${params.toString()}`),
        apiRequest(`/coupons/stats?date=${date}`)
      ]);
      setCoupons(listRes);
      setStats(statsRes);
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  }, [date, status, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function quickRedeem(code) {
    setMsg(null);
    try {
      const res = await apiRequest(`/coupons/redeem/${encodeURIComponent(code)}`, {
        method: "POST"
      });
      setMsg({ ok: true, text: `Served ${res.memberName || res.memberId} (${res.code})` });
      loadData();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  }

  return (
    <div>
      <QrScannerPanel onRedeemed={loadData} />

      <div className="panel">
        <h2>Mess Counter Daily Tracker</h2>

        <div className="stats-row">
          <div className="stat-box">
            <div className="stat-num">{stats.total}</div>
            <div>Total Issued</div>
          </div>
          <div className="stat-box">
            <div className="stat-num green-text">{stats.redeemed}</div>
            <div>Plates Served</div>
          </div>
          <div className="stat-box">
            <div className="stat-num blue-text">{stats.active}</div>
            <div>Waiting / Unused</div>
          </div>
        </div>

        <div className="filter-row">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="ACTIVE">Waiting (ACTIVE)</option>
            <option value="REDEEMED">Served (REDEEMED)</option>
          </select>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, roll no, or name..."
          />
          <button type="button" className="btn-gray" onClick={loadData}>Refresh</button>
        </div>

        {msg && <div className={`alert ${msg.ok ? "alert-ok" : "alert-bad"}`}>{msg.text}</div>}

        {coupons.length === 0 ? (
          <p className="hint">No coupons found for selected date/filter.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Student Name</th>
                <th>Roll No</th>
                <th>Status</th>
                <th>Redeemed Time</th>
                <th>Action</th>
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
                    {c.status === "ACTIVE" ? (
                      <button
                        type="button"
                        className="btn-green small-btn"
                        onClick={() => quickRedeem(c.code)}
                      >
                        Mark Served
                      </button>
                    ) : (
                      <span className="hint">Done ({c.redeemedBy || "staff"})</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
