import { useState } from "react";
import { useLocation, useNavigate, Link } from "../router";
import { send } from "../api";
import { BLOOD_GROUPS, CAN_RECEIVE_FROM, fmtGroup } from "../data";
import { CONTACT_PATTERN, EMAIL_PATTERN } from "../utils";
import { Alert, Button, Field, GroupChip, GroupPicker, PageHeader } from "../components/ui";
import { useToast } from "../components/Toast";

export default function RequestBlood() {
  const navigate = useNavigate();
  const toast = useToast();
  const { query } = useLocation();
  const presetGroup = BLOOD_GROUPS.includes(query.get("group")) ? query.get("group") : "";

  const [form, setForm] = useState({
    patientName: "",
    age: "",
    email: "",
    bloodGroup: presetGroup,
    contact: "",
    city: "",
    emergency: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.patientName.trim()) er.patientName = "Enter the patient's name.";
    const age = Number(form.age);
    if (!form.age) er.age = "Enter the patient's age.";
    else if (!Number.isInteger(age) || age < 0 || age > 120) er.age = "Enter an age between 0 and 120.";
    if (!EMAIL_PATTERN.test(form.email)) er.email = "Enter a valid email address, for example name@example.com.";
    if (!form.bloodGroup) er.bloodGroup = "Choose the blood group needed.";
    if (!CONTACT_PATTERN.test(form.contact)) er.contact = "Enter an 11-digit number, for example 03001234567.";
    if (!form.city.trim()) er.city = "Enter the city.";
    return er;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length) return;

    setSubmitting(true);
    try {
      const res = await send("/requests/add", {
        patientName: form.patientName.trim(),
        age: Number(form.age),
        email: form.email.trim(),
        bloodGroup: form.bloodGroup,
        contact: form.contact,
        city: form.city.trim(),
        emergency: form.emergency,
      });
      if (res.ok) {
        toast("Request submitted. A confirmation email is on its way.");
        navigate(`/request-status?contact=${encodeURIComponent(form.contact)}`);
      } else {
        setServerError("The server could not save your request. Check your details and try again.");
      }
    } catch {
      setServerError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const compatible = form.bloodGroup ? CAN_RECEIVE_FROM[form.bloodGroup] : null;

  return (
    <>
      <PageHeader
        title="Request blood"
        description="Fill in the patient's details. You will get an email now and another when an admin decides."
      />
      <div className="container page-body split">
        <form className="panel form" onSubmit={onSubmit} noValidate>
          {serverError && <Alert>{serverError}</Alert>}

          <div className="field-row">
            <Field label="Patient name" htmlFor="patientName" error={errors.patientName}>
              <input
                id="patientName"
                className="input"
                value={form.patientName}
                onChange={set("patientName")}
                aria-invalid={!!errors.patientName}
                aria-describedby={errors.patientName ? "patientName-error" : undefined}
              />
            </Field>
            <Field label="Patient age" htmlFor="age" error={errors.age}>
              <input
                id="age"
                className="input"
                type="number"
                inputMode="numeric"
                min="0"
                max="120"
                value={form.age}
                onChange={set("age")}
                aria-invalid={!!errors.age}
                aria-describedby={errors.age ? "age-error" : undefined}
              />
            </Field>
          </div>

          <GroupPicker
            label="Blood group needed"
            value={form.bloodGroup}
            onChange={(g) => {
              setForm((f) => ({ ...f, bloodGroup: g }));
              setErrors((er) => ({ ...er, bloodGroup: undefined }));
            }}
            error={errors.bloodGroup}
          />

          <Field
            label="Your email address"
            htmlFor="email"
            error={errors.email}
            hint="Updates about this request are sent here."
          >
            <input
              id="email"
              className="input"
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </Field>

          <div className="field-row">
            <Field
              label="Contact number"
              htmlFor="contact"
              error={errors.contact}
              hint="You will use this number to track the request."
            >
              <input
                id="contact"
                className="input"
                inputMode="numeric"
                maxLength={11}
                placeholder="03XXXXXXXXX"
                value={form.contact}
                onChange={set("contact")}
                autoComplete="tel"
                aria-invalid={!!errors.contact}
                aria-describedby={errors.contact ? "contact-error" : undefined}
              />
            </Field>
            <Field label="City" htmlFor="city" error={errors.city}>
              <input
                id="city"
                className="input"
                value={form.city}
                onChange={set("city")}
                autoComplete="address-level2"
                aria-invalid={!!errors.city}
                aria-describedby={errors.city ? "city-error" : undefined}
              />
            </Field>
          </div>

          <label className={`switch${form.emergency ? " on" : ""}`}>
            <input
              type="checkbox"
              checked={form.emergency}
              onChange={(e) => setForm((f) => ({ ...f, emergency: e.target.checked }))}
            />
            <span className="switch-track" aria-hidden="true">
              <span className="switch-thumb" />
            </span>
            <span>
              <strong>This is an emergency</strong>
              <small>Emergency requests are flagged at the top of the admin queue.</small>
            </span>
          </label>

          <Button type="submit" loading={submitting} className="btn-primary btn-block btn-lg">
            Submit blood request
          </Button>
        </form>

        <aside className="aside">
          <h2>Compatible donors</h2>
          {compatible ? (
            <>
              <p>
                A patient with {fmtGroup(form.bloodGroup)} blood can receive blood from these groups:
              </p>
              <div className="chips chips-lg">
                {compatible.map((g) => (
                  <GroupChip key={g} group={g} />
                ))}
              </div>
              {form.bloodGroup === "AB+" && <p className="aside-note">AB+ patients can receive from every blood group.</p>}
            </>
          ) : (
            <p>Choose the blood group needed to see which donor groups are compatible.</p>
          )}
          <p className="aside-note">
            Already submitted one? <Link to="/request-status">Track your request</Link>
          </p>
        </aside>
      </div>
    </>
  );
}
