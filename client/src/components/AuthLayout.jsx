import { Link } from "../router";
import { BrandMark, Icon } from "../icons";

/* Split-screen sign-in layout shared by the donor and admin login pages. */
export default function AuthLayout({ title, description, headline, text, points = [], standalone = false, children }) {
  return (
    <div className={`auth${standalone ? " standalone" : ""}`}>
      <aside className="auth-side">
        <Link to="/" className="brand" aria-label="Blood Donation System, home">
          <BrandMark size={34} light />
          <span>Blood Donation</span>
        </Link>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2>{headline}</h2>
          <p>{text}</p>
        </div>
        <ul className="auth-points">
          {points.map(([icon, label]) => (
            <li key={label}>
              <Icon name={icon} size={18} />
              {label}
            </li>
          ))}
        </ul>
      </aside>
      <section className="auth-main">
        <div className="auth-card">
          {standalone && (
            <Link to="/" className="auth-back">
              <Icon name="left" size={16} />
              Back to website
            </Link>
          )}
          <div>
            <h1>{title}</h1>
            <p className="lead">{description}</p>
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}
