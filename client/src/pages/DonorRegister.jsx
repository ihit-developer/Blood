import { useState } from "react";
import { useLocation, useNavigate, Link } from "../router";
import { send } from "../api";
import { BLOOD_GROUPS, CITIES } from "../data";
import { CONTACT_PATTERN } from "../utils";
import { Alert, Button, Field, GroupPicker, PageHeader } from "../components/ui";
import { useToast } from "../components/Toast";
import { Icon } from "../icons";

export default function DonorRegister() {
  const navigate = useNavigate();
  const toast = useToast();
  const { query } = useLocation();
  const presetGroup = BLOOD_GROUPS.includes(query.get("group")) ? query.get("group") : "";

  const [form, setForm] = useState({ name: "", age: "", bloodGroup: presetGroup, contact: "", city: "", whatsappOptIn: false });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.name.trim()) er.name = "Enter your full name.";
    const age = Number(form.age);
    if (!form.age) er.age = "Enter your age.";
    else if (!Number.isInteger(age) || age < 18 || age > 65) er.age = "Donors must be between 18 and 65 years old.";
    if (!form.bloodGroup) er.bloodGroup = "Choose your blood group.";
    if (!CONTACT_PATTERN.test(form.contact)) er.contact = "Enter an 11-digit number, for example 03001234567.";
    if (!form.city.trim()) er.city = "Enter your city.";
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
      const res = await send("/donors/add", {
        name: form.name.trim(),
        age: Number(form.age),
        bloodGroup: form.bloodGroup,
        contact: form.contact,
        city: form.city.trim(),
        whatsappOptIn: form.whatsappOptIn,
      });
      if (res.ok) {
        toast("You are registered. Sign in with your contact number.");
        navigate("/login");
      } else {
        setServerError("The server could not save your registration. Check your details and try again.");
      }
    } catch {
      setServerError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Become a donor"
        description="Add your details once. Admins and patients can then find a donor with your blood group."
      />
      <div className="container page-body split">
        <form className="panel form" onSubmit={onSubmit} noValidate>
          {serverError && <Alert>{serverError}</Alert>}

          <Field label="Full name" htmlFor="name" error={errors.name}>
            <input
              id="name"
              className="input"
              value={form.name}
              onChange={set("name")}
              autoComplete="name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
          </Field>

          <div className="field-row">
            <Field label="Age" htmlFor="age" error={errors.age}>
              <input
                id="age"
                className="input"
                type="number"
                inputMode="numeric"
                min="18"
                max="65"
                value={form.age}
                onChange={set("age")}
                aria-invalid={!!errors.age}
                aria-describedby={errors.age ? "age-error" : undefined}
              />
            </Field>
            <Field label="City" htmlFor="city" error={errors.city}>
              <input
                id="city"
                className="input"
                list="city-options"
                value={form.city}
                onChange={set("city")}
                autoComplete="address-level2"
                aria-invalid={!!errors.city}
                aria-describedby={errors.city ? "city-error" : undefined}
              />
              <datalist id="city-options">
                {CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
          </div>

          <GroupPicker
            value={form.bloodGroup}
            onChange={(g) => {
              setForm((f) => ({ ...f, bloodGroup: g }));
              setErrors((er) => ({ ...er, bloodGroup: undefined }));
            }}
            error={errors.bloodGroup}
          />

          <Field
            label="Contact number"
            htmlFor="contact"
            error={errors.contact}
            hint="This is also your donor login, so use a number you keep."
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

          <label className={`switch${form.whatsappOptIn ? " on" : ""}`}>
            <input
              type="checkbox"
              checked={form.whatsappOptIn}
              onChange={(e) => setForm((f) => ({ ...f, whatsappOptIn: e.target.checked }))}
            />
            <span className="switch-track" aria-hidden="true">
              <span className="switch-thumb" />
            </span>
            <span>
              <strong>Send me WhatsApp alerts</strong>
              <small>Get a message when someone in your city needs your blood group. Reply STOP any time to stop.</small>
            </span>
          </label>

          <Button type="submit" loading={submitting} className="btn-primary btn-block btn-lg">
            Register as donor
          </Button>
        </form>

        <aside className="aside">
          <h2>What happens next</h2>
          <ul className="check-list">
            <li>
              <Icon name="check" size={18} />
              <span>Your details are saved and the admin team is told about the new donor.</span>
            </li>
            <li>
              <Icon name="check" size={18} />
              <span>You sign in with your contact number. No password to remember.</span>
            </li>
            <li>
              <Icon name="check" size={18} />
              <span>Your profile shows how many days are left until you can donate again.</span>
            </li>
          </ul>
          <p className="aside-note">
            Already registered? <Link to="/login">Donor login</Link>
          </p>
        </aside>
      </div>
    </>
  );
}
