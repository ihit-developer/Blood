import { useEffect, useState } from "react";
import { Link } from "../router";
import { getJSON } from "../api";
import BloodTag from "../components/BloodTag";
import { Icon } from "../icons";

const steps = [
  { icon: "edit", title: "Submit the request", text: "Enter the patient's details and the blood group needed. Mark it as an emergency if it cannot wait." },
  { icon: "mail", title: "Get a confirmation email", text: "You receive an email straight away saying the request is pending." },
  { icon: "shield", title: "An admin reviews it", text: "The admin team approves or rejects the request after checking the details." },
  { icon: "check", title: "Hear the decision", text: "A second email tells you the outcome. Track it any time with your contact number." },
];

const ways = [
  {
    icon: "heart",
    title: "I want to donate",
    text: "Register once, then sign in with your contact number to see your details and when you can give again.",
    links: [["/register", "Register as a donor"], ["/login", "Donor login"]],
  },
  {
    icon: "inbox",
    title: "I need blood",
    text: "Send a request for a patient and follow it from pending to approved or rejected.",
    links: [["/request-blood", "Request blood"], ["/request-status", "Track a request"], ["/request-history", "Request history"]],
  },
  {
    icon: "shield",
    title: "I manage requests",
    text: "Review incoming requests, keep the donor list up to date and watch the numbers.",
    links: [["/admin-login", "Admin sign-in"]],
  },
];

export default function Home() {
  const [live, setLive] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([getJSON("/donors/count"), getJSON("/requests/stats")])
      .then(([donors, requests]) => {
        if (active) setLive({ donors: donors.totalDonors, total: requests.total, approved: requests.approved });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const stats = [
    { icon: "users", value: live ? live.donors : "-", label: "Registered donors" },
    { icon: "inbox", value: live ? live.total : "-", label: "Blood requests" },
    { icon: "check", value: live ? live.approved : "-", label: "Requests approved" },
    { icon: "drop", value: "8", label: "Blood groups covered" },
  ];

  return (
    <>
      <section className="hero">
        <div className="hero-bg" aria-hidden="true" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-pill">
              <span className="pulse" aria-hidden="true" />
              Every request is reviewed by an admin
            </span>
            <h1>Donate blood. Give someone another tomorrow.</h1>
            <p className="hero-lead">
              Register as a donor in a minute, or post a blood request and get an email the moment it is approved.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-light btn-lg">
                <Icon name="heart" size={20} />
                Become a donor
              </Link>
              <Link to="/request-blood" className="btn btn-outline-light btn-lg">
                Request blood
              </Link>
            </div>
            <p className="hero-link">
              <Link to="/request-status">Already asked for blood? Track your request</Link>
            </p>
          </div>
          <BloodTag />
        </div>
      </section>

      <div className="container">
        <section className="statbar" aria-label="Live numbers">
          {stats.map((s) => (
            <div key={s.label} className="statbar-item">
              <span className="tile">
                <Icon name={s.icon} size={22} />
              </span>
              <div>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            </div>
          ))}
        </section>
      </div>

      <section className="section">
        <div className="container">
          <div className="section-head center">
            <h2>How a request moves through the system</h2>
            <p>No phone calls and no waiting without news. You always know where your request stands.</p>
          </div>
          <ol className="steps">
            {steps.map((step, i) => (
              <li key={step.title} className="step">
                <span className="tile tile-solid">
                  <Icon name={step.icon} size={24} />
                </span>
                <span className="step-num">Step {i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <div className="section-head center">
            <h2>Where would you like to start?</h2>
          </div>
          <div className="ways">
            {ways.map((w) => (
              <div key={w.title} className="way">
                <span className="tile">
                  <Icon name={w.icon} size={26} />
                </span>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
                <div className="way-links">
                  {w.links.map(([to, label]) => (
                    <Link key={to} to={to}>
                      {label}
                      <Icon name="arrow" size={16} />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="container band-inner">
          <div>
            <h2>Already a donor? See when you can give again.</h2>
            <p>Donors can give again 90 days after their last donation. Your profile counts the days for you.</p>
          </div>
          <Link to="/profile" className="btn btn-light btn-lg">
            Open my profile
          </Link>
        </div>
      </section>
    </>
  );
}
