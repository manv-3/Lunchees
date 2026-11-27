import { useState } from "react";
import { apiRequest } from "../api.js";

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="panel login-box">
      <h2>Login to Lunchees Portal</h2>
      <form onSubmit={handleSubmit} className="simple-form">
        <label>Username: <input value={username} onChange={(e) => setUsername(e.target.value)} required /></label>
        <label>Password: <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <div className="alert alert-bad">{error}</div>}
        <button type="submit" className="btn-blue">Login</button>
      </form>
    </div>
  );
}