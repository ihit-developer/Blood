import { Link } from "../router";
import useRequestLookup from "../components/useRequestLookup";
import { Alert, Button, EmptyState, Field, GroupChip, PageHeader, StatusBadge } from "../components/ui";
import { formatDate } from "../utils";
import { Icon } from "../icons";

export default function RequestHistory() {
  const { contact, setContact, results, loading, error, setError, run } = useRequestLookup();

  const onSubmit = (e) => {
    e.preventDefault();
    run(contact);
  };

  return (
    <>
      <PageHeader
        title="Request history"
        description="Every blood request made with your contact number, newest first."
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
            <Icon name="clock" size={18} />
            View history
          </Button>
        </form>

        {error && <Alert>{error}</Alert>}

        {results && results.length === 0 && (
          <EmptyState icon="clock" title="No history for this number">
            Nothing has been requested with this number yet. <Link to="/request-blood">Request blood</Link>.
          </EmptyState>
        )}

        {results && results.length > 0 && (
          <div className="table-wrap">
            <table className="table stack">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Age</th>
                  <th>Blood group</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r._id}>
                    <td data-label="Patient">
                      <strong>{r.patientName}</strong>
                      {r.emergency && <span className="badge badge-emergency">Emergency</span>}
                    </td>
                    <td data-label="Age">{r.age ?? "-"}</td>
                    <td data-label="Blood group">
                      <GroupChip group={r.bloodGroup} />
                    </td>
                    <td data-label="City">{r.city}</td>
                    <td data-label="Status">
                      <StatusBadge status={r.status} />
                    </td>
                    <td data-label="Date">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
