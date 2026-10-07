import { Link } from "../router";
import useRequestLookup from "../components/useRequestLookup";
import { Alert, Button, EmptyState, Field, GroupChip, PageHeader, StatusBadge } from "../components/ui";
import { formatDate } from "../utils";
import { Icon } from "../icons";

function Stepper({ status }) {
  const decided = status === "Approved" || status === "Rejected";
  return (
    <ol className="stepper" aria-label="Request progress">
      <li className="done">
        <span />
        Submitted
      </li>
      <li className={decided ? "done" : "current"}>
        <span />
        Under review
      </li>
      <li className={decided ? `done ${status.toLowerCase()}` : ""}>
        <span />
        {decided ? status : "Decision"}
      </li>
    </ol>
  );
}

export default function RequestStatus() {
  const { contact, setContact, results, loading, error, setError, run } = useRequestLookup();

  const onSubmit = (e) => {
    e.preventDefault();
    run(contact);
  };

  return (
    <>
      <PageHeader
        title="Track a blood request"
        description="Enter the contact number you used on the request to see where it stands."
      />
      <div className="container page-body">
        <form className="panel lookup" onSubmit={onSubmit} noValidate>
          <Field label="Contact number" htmlFor="contact">
            <input
              id="contact"
              className="input"
              inputMode="numeric"
              maxLength={11}
              placeholder="03XXXXXXXXX"
              value={contact}
              onChange={(e) => {
                setContact(e.target.value);
                setError("");
              }}
            />
          </Field>
          <Button type="submit" loading={loading} className="btn-primary">
            <Icon name="search" size={18} />
            Check status
          </Button>
        </form>

        {error && <Alert>{error}</Alert>}

        {results && results.length === 0 && (
          <EmptyState icon="search" title="No request found for this number">
            Check the number for typing mistakes, or <Link to="/request-blood">submit a new request</Link>.
          </EmptyState>
        )}

        {results && results.length > 0 && (
          <ul className="track-list">
            {results.map((r) => (
              <li key={r._id} className="track-item">
                <div className="track-main">
                  <div>
                    <h2>
                      {r.patientName}
                      {r.emergency && <span className="badge badge-emergency">Emergency</span>}
                    </h2>
                    <p className="track-meta">
                      Age {r.age ?? "-"}, {r.city}. Requested {formatDate(r.createdAt)}.
                    </p>
                  </div>
                  <div className="track-tags">
                    <GroupChip group={r.bloodGroup} />
                    <StatusBadge status={r.status} />
                  </div>
                </div>
                <Stepper status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
