import { useState } from "react";
import { Link, useNavigate } from "../router";
import { send } from "../api";
import { CONTACT_PATTERN } from "../utils";
import { Alert, Button, Field, PageHeader } from "../components/ui";

export default function DonorLogin() {
  const navigate = useNavigate();
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!CONTACT_PATTERN.test(contact)) {
      setError("Enter the 11-digit number you registered with, for example 03001234567.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await send("/donors/login", { contact });
      if (res.url.includes("donor-not-found")) navigate("/donor-not-found");
      else if (res.ok) navigate("/profile");
      else setError("Sign-in failed. Try again in a moment.");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Donor login" description="Sign in with the contact number you registered with." />
      <div className="container page-body narrow">
        <form className="panel form" onSubmit={onSubmit} noValidate>
          {error && <Alert>{error}</Alert>}
          <Field label="Registered contact number" htmlFor="contact">
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
              autoComplete="tel"
            />
          </Field>
          <Button type="submit" loading={submitting} className="btn-primary btn-block btn-lg">
            Sign in
          </Button>
          <p className="form-foot">
            Not registered yet? <Link to="/register">Become a donor</Link>
          </p>
        </form>
      </div>
    </>
  );
}
