import { useState } from "react";
import { apiRequest } from "../api.js";

export default function LoginPage({ onLoginSuccess }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [branchSection, setBranchSection] = useState("CSE - CSE 22");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload = mode === "login"
        ? { username, password }
        : { username, password, fullName, memberId, branchSection };
      const data = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(u, p) {
    setMode("login");
    setUsername(u);
    setPassword(p);
    setError("");
  }

  return (
    <div className="login-layout">
      <div className="panel login-box">
        <div className="tab-row">
          <button
            type="button"
            className={mode === "login" ? "tab-btn active-tab" : "tab-btn"}
            onClick={() => { setMode("login"); setError(""); }}
          >
            User Login
          </button>
          <button
            type="button"
            className={mode === "register" ? "tab-btn active-tab" : "tab-btn"}
            onClick={() => { setMode("register"); setError(""); }}
          >
            New Student Sign Up
          </button>
        </div>

        <h2>{mode === "login" ? "Login to Lunchees Portal" : "Student Registration"}</h2>

        <form onSubmit={handleSubmit} className="simple-form">
          <label>
            Username:
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </label>

          <label>
            Password:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </label>

          {mode === "register" && (
            <>
              <label>
                Full Name:
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ankit Tiwari"
                  required
                />
              </label>
              <label>
                College Roll No / Member ID:
                <input
                  type="text"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value.toUpperCase())}
                  placeholder="e.g. 22CSE099"
                  required
                />
              </label>
              <label>
                Branch &amp; Section:
                <input
                  type="text"
                  value={branchSection}
                  onChange={(e) => setBranchSection(e.target.value)}
                  placeholder="CSE - CSE 22"
                />
              </label>
            </>
          )}

          {error && <div className="alert alert-bad">{error}</div>}

          <button type="submit" className="btn-blue" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Student Account"}
          </button>
        </form>
      </div>

      <div className="panel demo-box">
        <h2>Demo Login Credentials (All Roles)</h2>
        <p className="hint">Click &quot;Use&quot; to auto-fill login details for testing any role:</p>
        <table className="data-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Username</th>
              <th>Password</th>
              <th>Notes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Admin</b></td>
              <td className="mono">admin</td>
              <td className="mono">admin123</td>
              <td>Generate QR coupons, manage users &amp; payments</td>
              <td>
                <button type="button" className="btn-gray small-btn" onClick={() => fillDemo("admin", "admin123")}>
                  Use
                </button>
              </td>
            </tr>
            <tr>
              <td><b>Mess Staff</b></td>
              <td className="mono">staff</td>
              <td className="mono">staff123</td>
              <td>Scan student QR code at mess counter</td>
              <td>
                <button type="button" className="btn-gray small-btn" onClick={() => fillDemo("staff", "staff123")}>
                  Use
                </button>
              </td>
            </tr>
            <tr>
              <td><b>Student (Active)</b></td>
              <td className="mono">student</td>
              <td className="mono">student123</td>
              <td>Has active monthly subscription + QR coupon</td>
              <td>
                <button type="button" className="btn-gray small-btn" onClick={() => fillDemo("student", "student123")}>
                  Use
                </button>
              </td>
            </tr>
            <tr>
              <td><b>Student (Expired)</b></td>
              <td className="mono">student2</td>
              <td className="mono">student123</td>
              <td>Expired plan (for testing Payment Renewal)</td>
              <td>
                <button type="button" className="btn-gray small-btn" onClick={() => fillDemo("student2", "student123")}>
                  Use
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <hr />
        <h3>How Lunchees Mess System Works:</h3>
        <ul className="plain-list">
          <li><b>Students:</b> Renew mess subscription online via UPI/Card and generate daily QR lunch coupon.</li>
          <li><b>Mess Staff:</b> Scan student&apos;s QR code at the lunch counter to serve and mark coupon as used.</li>
          <li><b>Admin:</b> Bulk generate QR coupons, monitor daily lunch tracker, manage students, and check payment logs.</li>
        </ul>
      </div>
    </div>
  );
}
