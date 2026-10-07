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
          <BrandMark light />
          <span>Blood Donation System</span>
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

          <NavLink to="/request-blood" className="nav-link">
            Request blood
          </NavLink>
          <NavLink to="/request-status" className="nav-link">
            Track request
          </NavLink>
          <NavLink to="/request-history" className="nav-link">
            History
          </NavLink>

          <Link to={isAdmin ? "/admin" : "/admin-login"} className="btn btn-light btn-sm nav-admin">
            {isAdmin ? "Dashboard" : "Admin"}
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
          <BrandMark size={28} light />
          <div>
            <strong>Blood Donation System</strong>
            <p>Every request is reviewed by an admin before it is approved.</p>
          </div>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/register">Become a donor</Link>
          <Link to="/request-blood">Request blood</Link>
          <Link to="/request-status">Track a request</Link>
          <Link to="/admin-login">Admin sign-in</Link>
        </nav>
      </div>
      <div className="container footer-note">&copy; 2026 Blood Donation System</div>
    </footer>
  );
}
