import { BLOOD_GROUPS, fmtGroup, groupFamily } from "../data";
import { Icon } from "../icons";

export function Spinner({ size = 18 }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />;
}

export function Button({ loading, children, className = "btn-primary", disabled, ...rest }) {
  return (
    <button className={`btn ${className}`} disabled={disabled || loading} {...rest}>
      {loading && <Spinner size={16} />}
      {children}
    </button>
  );
}

export function PageHeader({ title, description, children }) {
  return (
    <header className="page-head">
      <div className="container">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {children}
      </div>
    </header>
  );
}

export function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error && <p className="hint">{hint}</p>}
      {error && (
        <p className="field-error" id={`${htmlFor}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export function GroupChip({ group }) {
  if (!group) return <span className="muted">-</span>;
  return <span className={`chip g-${groupFamily(group)}`}>{fmtGroup(group)}</span>;
}

export function GroupPicker({ value, onChange, error, label = "Blood group", name = "bloodGroup" }) {
  return (
    <fieldset className="field group-field">
      <legend>{label}</legend>
      <div className="group-grid" role="radiogroup" aria-label={label}>
        {BLOOD_GROUPS.map((g) => (
          <label key={g} className={`group-opt g-${groupFamily(g)}${value === g ? " on" : ""}`}>
            <input type="radio" name={name} value={g} checked={value === g} onChange={() => onChange(g)} />
            <span>{fmtGroup(g)}</span>
          </label>
        ))}
      </div>
      {error && <p className="field-error">{error}</p>}
    </fieldset>
  );
}

export function StatusBadge({ status = "Pending" }) {
  const key = status.toLowerCase();
  return <span className={`badge badge-${key}`}>{status}</span>;
}

export function Alert({ tone = "error", children }) {
  return (
    <div className={`alert alert-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <Icon name={tone === "error" ? "alert" : "info"} size={18} />
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({ icon = "inbox", title, children }) {
  return (
    <div className="empty">
      <Icon name={icon} size={30} />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

export function TableSkeleton({ rows = 4 }) {
  return (
    <div className="skeleton-list" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}
