export default function Header({ user, onLogout }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div>
          <div className="college-title">ABESEC Ghaziabad</div>
          <h1 className="app-title">Lunchees - Mess Lunch Coupon &amp; QR Portal</h1>
          <p className="app-subtitle">College Cafeteria &amp; Hostel Mess Coupon Management System</p>
        </div>
        {user && (
          <div className="user-box">
            <div>
              <strong>{user.fullName}</strong> ({user.memberId})
            </div>
            <div>
              Role: <span className="role-badge">{user.role}</span>
            </div>
            <button type="button" className="btn-red small-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
