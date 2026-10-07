import { useState } from "react";
import { useNavigate } from "../router";
import { adminSession, send } from "../api";
import { Alert, Button, Field } from "../components/ui";
import AuthLayout from "../components/AuthLayout";
import { Icon } from "../icons";
import { useToast } from "../components/Toast";

export default function AdminLogin() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [show, setShow] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      setError("Enter your username and password.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await send("/admin/login", { username: form.username.trim(), password: form.password });
      /* The server redirects to the dashboard on success and answers with plain text otherwise. */
      if (res.redirected) {
        adminSession.set();
        toast("Signed in as admin.");
        navigate("/admin");
      } else {
        setError("Wrong username or password.");
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      standalone
      title="Admin sign-in"
      description="For the team that reviews requests and manages donors."
      headline="Review requests. Keep donors ready."
      text="One console for every blood request, every donor and the alerts that connect them."
      points={[
        ["inbox", "Approve or reject requests, emergencies first"],
        ["users", "Keep the donor list accurate and up to date"],
        ["pulse", "Live numbers on demand and supply"],
      ]}
    >
      <form className="panel form" onSubmit={onSubmit} noValidate>
        {error && <Alert>{error}</Alert>}
        <Field label="Username" htmlFor="username">
          <input
            id="username"
            className="input"
            value={form.username}
            onChange={set("username")}
            autoComplete="username"
            autoFocus
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <div className="input-wrap">
            <input
              id="password"
              className="input"
              type={show ? "text" : "password"}
              value={form.password}
              onChange={set("password")}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              aria-pressed={show}
            >
              <Icon name={show ? "eyeOff" : "eye"} size={18} />
            </button>
          </div>
        </Field>
        <Button type="submit" loading={submitting} className="btn-primary btn-block btn-lg">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
