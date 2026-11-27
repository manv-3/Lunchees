import { useEffect, useState } from "react";
import { apiRequest, getToken, setToken } from "./api.js";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import LoginPage from "./components/LoginPage.jsx";
import StudentDashboard from "./components/StudentDashboard.jsx";
import StaffDashboard from "./components/StaffDashboard.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCheckingAuth(false);
      return;
    }
    apiRequest("/auth/me")
      .then((u) => setUser(u))
      .catch(() => setToken(""))
      .finally(() => setCheckingAuth(false));
  }, []);

  function handleLoginSuccess(token, loggedInUser) {
    setToken(token);
    setUser(loggedInUser);
  }

  function handleLogout() {
    setToken("");
    setUser(null);
  }

  function renderMainContent() {
    if (checkingAuth) {
      return (
        <div className="panel">
          <p>Loading Lunchees portal...</p>
        </div>
      );
    }
    if (!user) {
      return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }
    if (user.role === "ADMIN") {
      return <AdminDashboard user={user} />;
    }
    if (user.role === "MESS_STAFF") {
      return <StaffDashboard user={user} />;
    }
    return <StudentDashboard user={user} onUserUpdated={setUser} />;
  }

  return (
    <div className="page-wrapper">
      <Header user={user} onLogout={handleLogout} />
      <main className="main-container">{renderMainContent()}</main>
      <Footer />
    </div>
  );
}
