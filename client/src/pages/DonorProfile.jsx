import { useEffect, useState } from "react";
import { useNavigate } from "../router";
import { getJSON } from "../api";
import { DONATION_GAP_DAYS, fmtGroup, groupFamily } from "../data";
import { formatDate } from "../utils";
import { Alert, Button, PageHeader, TableSkeleton } from "../components/ui";
import { useToast } from "../components/Toast";
import { Icon } from "../icons";

function eligibilityFor(lastDonationDate) {
  if (!lastDonationDate) {
    return {
      ready: true,
      title: "You are eligible to donate",
      text: "No earlier donation is recorded on your profile.",
      progress: 1,
    };
  }
  const last = new Date(lastDonationDate);
  const daysPassed = Math.max(0, Math.floor((Date.now() - last.getTime()) / 86400000));
  const remaining = DONATION_GAP_DAYS - daysPassed;
  if (remaining > 0) {
    return {
      ready: false,
      title: `You can donate again in ${remaining} ${remaining === 1 ? "day" : "days"}`,
      text: `Your last donation was on ${formatDate(lastDonationDate)}.`,
      progress: daysPassed / DONATION_GAP_DAYS,
    };
  }
  return {
    ready: true,
    title: "You are eligible to donate",
    text: `Your last donation was on ${formatDate(lastDonationDate)}.`,
    progress: 1,
  };
}

export default function DonorProfile() {
  const navigate = useNavigate();
  const toast = useToast();
  const [donor, setDonor] = useState(null);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    getJSON("/donor/me")
      .then((data) => {
        if (!active) return;
        if (!data) navigate("/login", { replace: true });
        else setDonor(data);
      })
      .catch((err) => {
        if (!active) return;
        if (err.status === 401) navigate("/login", { replace: true });
        else setError("Could not load your profile. Try again in a moment.");
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/donor/logout");
    } catch {
      /* the session cookie is cleared server-side when reachable */
    }
    toast("You are signed out.");
    navigate("/");
  };

  const elig = donor ? eligibilityFor(donor.lastDonationDate) : null;

  return (
    <>
      <PageHeader title="My donor profile" description="The details we hold about you as a donor." />
      <div className="container page-body">
        {error && <Alert>{error}</Alert>}
        {!donor && !error && <TableSkeleton rows={3} />}
        {donor && (
          <div className="profile-grid">
            <section className={`donor-card g-${groupFamily(donor.bloodGroup)}`} aria-label="Donor card">
              <div className="donor-card-top">
                <div>
                  <p className="donor-card-kicker">Donor</p>
                  <h2>{donor.name}</h2>
                </div>
                <p className="donor-card-group">{fmtGroup(donor.bloodGroup)}</p>
              </div>
              <dl className="donor-card-list">
                <div>
                  <dt>Age</dt>
                  <dd>{donor.age}</dd>
                </div>
                <div>
                  <dt>Contact</dt>
                  <dd>{donor.contact}</dd>
                </div>
                <div>
                  <dt>City</dt>
                  <dd>{donor.city}</dd>
                </div>
              </dl>
            </section>

            <section className={`panel elig${elig.ready ? " elig-ready" : ""}`} aria-label="Donation eligibility">
              <Icon name={elig.ready ? "check" : "clock"} size={26} />
              <h2>{elig.title}</h2>
              <p>{elig.text}</p>
              <div
                className="progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={DONATION_GAP_DAYS}
                aria-valuenow={Math.round(elig.progress * DONATION_GAP_DAYS)}
                aria-label="Days since last donation"
              >
                <span style={{ width: `${Math.min(100, elig.progress * 100)}%` }} />
              </div>
              <p className="hint">Donors can give again {DONATION_GAP_DAYS} days after their last donation.</p>
              <Button className="btn-ghost" onClick={signOut} loading={signingOut}>
                <Icon name="logout" size={18} />
                Sign out
              </Button>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
