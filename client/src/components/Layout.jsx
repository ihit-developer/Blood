import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "../router";
import { BrandMark, Icon } from "../icons";
import { adminSession } from "../api";

export function Navbar() {
  const { path } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [donorOpen, setDonorOpen] = useState(false);
  const donorRef = useRef(null);
  const isAdmin = adminSession.get();

  useEffect(() => {
    setMenuOpen(false);
    setDonorOpen(false);
  }, [path]);

  useEffect(() => {
    const onDown = (e) => {
      if (donorRef.current && !donorRef.current.contains(e.target)) setDonorOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setDonorOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const donorActive = ["/register", "/login", "/profile"].includes(path);

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand" aria-label="Blood Donation System, home">
          <BrandMark size={32} />
          <span>Blood Donation</span>
        </Link>

        <button
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="main-menu"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <Icon name={menuOpen ? "x" : "menu"} size={22} />
        </button>

        <nav id="main-menu" className={`nav-links${menuOpen ? " open" : ""}`} aria-label="Main">
          <NavLink to="/" className="nav-link">
            Home
          </NavLink>

          <div className="dropdown" ref={donorRef}>
            <button
              className={`nav-link dropdown-toggle${donorActive ? " active" : ""}`}
              aria-expanded={donorOpen}
              aria-haspopup="true"
              onClick={() => setDonorOpen((o) => !o)}
            >
              Donor
              <Icon name="chevron" size={16} />
            </button>
            {donorOpen && (
              <div className="dropdown-menu">
                <Link to="/register">Register as donor</Link>
                <Link to="/login">Donor login</Link>
                <Link to="/profile">My profile</Link>
              </div>
            )}
          </div>

          <NavLink to="/request-status" className="nav-link">
            Track request
          </NavLink>
          <NavLink to="/request-history" className="nav-link">
            History
          </NavLink>

          <span className="nav-spacer" />

          <Link to={isAdmin ? "/admin" : "/admin-login"} className="nav-link nav-admin">
            <Icon name="shield" size={17} />
            {isAdmin ? "Dashboard" : "Admin"}
          </Link>
          <Link to="/request-blood" className="btn btn-primary">
            <Icon name="drop" size={17} />
            Request blood
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link to="/" className="brand">
            <BrandMark size={32} light />
            <span>Blood Donation</span>
          </Link>
          <p>A single place to register as a donor, request blood and follow every request until an admin decides.</p>
        </div>
        <nav className="footer-links" aria-label="Donors">
          <h3>Donors</h3>
          <Link to="/register">Become a donor</Link>
          <Link to="/login">Donor login</Link>
          <Link to="/profile">My profile</Link>
        </nav>
        <nav className="footer-links" aria-label="Patients">
          <h3>Patients</h3>
          <Link to="/request-blood">Request blood</Link>
          <Link to="/request-status">Track a request</Link>
          <Link to="/request-history">Request history</Link>
        </nav>
        <nav className="footer-links" aria-label="Team">
          <h3>Team</h3>
          <Link to="/admin-login">Admin sign-in</Link>
        </nav>
      </div>
      <div className="container">
        <div className="footer-note">
          <span>&copy; 2026 Blood Donation System</span>
          <span>Every request is reviewed by an admin before it is approved.</span>
        </div>
      </div>
    </footer>
  );
}
