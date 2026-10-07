import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "../router";
import { adminSession, getJSON, send, sendJSON } from "../api";
import { BLOOD_GROUPS, CITIES, DONATION_GAP_DAYS, fmtGroup } from "../data";
import { CONTACT_PATTERN, formatDate } from "../utils";
import { Alert, Button, EmptyState, Field, GroupChip, GroupPicker, StatusBadge, TableSkeleton } from "../components/ui";
import Modal from "../components/Modal";
import DonutChart from "../components/DonutChart";
import { useToast } from "../components/Toast";
import { BrandMark, Icon } from "../icons";

/* ---------- helpers ---------- */

const statusOf = (r) => r.status || "Pending";
const isPending = (r) => statusOf(r) === "Pending";

/* Pending first, emergencies first within pending, then newest first. */
function triage(a, b) {
  const rank = (r) => (isPending(r) ? 0 : 1);
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  if (isPending(a) && !!a.emergency !== !!b.emergency) return a.emergency ? -1 : 1;
  return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
}

/* ---------- notification bell ---------- */

function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const wrapRef = useRef(null);

  const refreshCount = useCallback(() => {
    if (document.hidden) return;
    getJSON("/notifications/count")
      .then((d) => setCount(d.count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshCount();
    const timer = setInterval(refreshCount, 5000);
    return () => clearInterval(timer);
  }, [refreshCount]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (!next) return;
    try {
      setItems(await getJSON("/notifications"));
      await send("/notifications/read");
      setCount(0);
    } catch {
      setItems([]);
    }
  };

  return (
    <div className="bell-wrap" ref={wrapRef}>
      <button
        className="icon-btn bell"
        onClick={toggle}
        aria-expanded={open}
        aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      >
        <Icon name="bell" size={22} />
        {count > 0 && <span className="bell-count">{count > 99 ? "99+" : count}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <h3>Notifications</h3>
          {items === null && <p className="muted pad">Loading...</p>}
          {items && items.length === 0 && <p className="muted pad">Nothing new yet.</p>}
          {items && items.length > 0 && (
            <ul>
              {items.slice(0, 30).map((n) => (
                <li key={n._id} className={n.read ? "" : "unread"}>
                  <span>{n.message}</span>
                  <time>{formatDate(n.createdAt)}</time>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- edit donor ---------- */

function EditDonorModal({ donor, busy, onSave, onClose }) {
  const [form, setForm] = useState({
    name: donor.name || "",
    age: donor.age ?? "",
    bloodGroup: donor.bloodGroup || "",
    contact: donor.contact || "",
    city: donor.city || "",
    lastDonationDate: donor.lastDonationDate ? String(donor.lastDonationDate).slice(0, 10) : "",
  });
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!form.name.trim()) er.name = "Enter a name.";
    if (!form.age || Number(form.age) < 1) er.age = "Enter an age.";
    if (!form.bloodGroup) er.bloodGroup = "Choose a blood group.";
    if (!CONTACT_PATTERN.test(form.contact)) er.contact = "Enter an 11-digit number.";
    if (!form.city.trim()) er.city = "Enter a city.";
    setErrors(er);
    if (Object.keys(er).length) return;
    onSave({
      name: form.name.trim(),
      age: Number(form.age),
      bloodGroup: form.bloodGroup,
      contact: form.contact,
      city: form.city.trim(),
      lastDonationDate: form.lastDonationDate || null,
    });
  };

  return (
    <Modal
      title="Edit donor"
      onClose={onClose}
      footer={
        <>
          <Button className="btn-ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button className="btn-primary" type="submit" form="edit-donor-form" loading={busy}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-donor-form" className="form" onSubmit={submit} noValidate>
        <Field label="Full name" htmlFor="e-name" error={errors.name}>
          <input id="e-name" className="input" value={form.name} onChange={set("name")} />
        </Field>
        <div className="field-row">
          <Field label="Age" htmlFor="e-age" error={errors.age}>
            <input id="e-age" className="input" type="number" min="1" value={form.age} onChange={set("age")} />
          </Field>
          <Field label="City" htmlFor="e-city" error={errors.city}>
            <input id="e-city" className="input" list="e-cities" value={form.city} onChange={set("city")} />
            <datalist id="e-cities">
              {CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
        </div>
        <GroupPicker
          value={form.bloodGroup}
          name="editBloodGroup"
          onChange={(g) => {
            setForm((f) => ({ ...f, bloodGroup: g }));
            setErrors((er) => ({ ...er, bloodGroup: undefined }));
          }}
          error={errors.bloodGroup}
        />
        <div className="field-row">
          <Field label="Contact number" htmlFor="e-contact" error={errors.contact}>
            <input
              id="e-contact"
              className="input"
              inputMode="numeric"
              maxLength={11}
              value={form.contact}
              onChange={set("contact")}
            />
          </Field>
          <Field
            label="Last donation"
            htmlFor="e-last"
            hint="Optional. Drives the donor's eligibility countdown."
          >
            <input id="e-last" className="input" type="date" value={form.lastDonationDate} onChange={set("lastDonationDate")} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- dashboard helpers ---------- */

const PAGE_SIZE = 8;
const TABS = [
  { id: "overview", label: "Overview", icon: "dash", title: "Overview", hint: "Live numbers, demand against supply, and what needs a decision." },
  { id: "requests", label: "Requests", icon: "inbox", title: "Blood requests", hint: "Search, filter, review and decide. Emergencies come first." },
  { id: "donors", label: "Donors", icon: "users", title: "Donors", hint: "Find donors by group, city or availability." },
];

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function lastDays(requests, n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ key: dayKey(d), label: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }), pending: 0, approved: 0, rejected: 0 });
  }
  const map = Object.fromEntries(days.map((d) => [d.key, d]));
  requests.forEach((r) => {
    const slot = map[dayKey(new Date(r.createdAt || 0))];
    if (slot) slot[statusOf(r).toLowerCase()] += 1;
  });
  return days.map((d) => ({ ...d, total: d.pending + d.approved + d.rejected }));
}

function eligibility(d) {
  if (!d.lastDonationDate) return { ok: true, label: "Eligible" };
  const left = DONATION_GAP_DAYS - Math.floor((Date.now() - new Date(d.lastDonationDate).getTime()) / 86400000);
  return left <= 0 ? { ok: true, label: "Eligible" } : { ok: false, label: `In ${left} days` };
}

function CountUp({ value }) {
  const [shown, setShown] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (typeof value !== "number") return undefined;
    const from = prev.current;
    const t0 = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / 650);
      setShown(Math.round(from + (value - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{typeof value === "number" ? shown : "-"}</>;
}

function Sparkline({ values }) {
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - (v / max) * 24}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="spark" aria-hidden="true">
      <polyline points={`0,30 ${pts} 100,30`} className="spark-fill" />
      <polyline points={pts} className="spark-line" />
    </svg>
  );
}

function usePaged(list) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil((list?.length || 0) / PAGE_SIZE));
  const current = Math.min(page, pages);
  const slice = list ? list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE) : [];
  return { page: current, setPage, pages, slice, total: list?.length || 0 };
}

function Pager({ pg }) {
  if (pg.total <= PAGE_SIZE) return null;
  const from = (pg.page - 1) * PAGE_SIZE + 1;
  return (
    <div className="pager">
      <span>
        {from}-{Math.min(pg.total, pg.page * PAGE_SIZE)} of {pg.total}
      </span>
      <div>
        <button className="icon-btn" disabled={pg.page === 1} onClick={() => pg.setPage(pg.page - 1)} aria-label="Previous page">
          <Icon name="left" size={18} />
        </button>
        <b>
          {pg.page} / {pg.pages}
        </b>
        <button className="icon-btn" disabled={pg.page === pg.pages} onClick={() => pg.setPage(pg.page + 1)} aria-label="Next page">
          <Icon name="right" size={18} />
        </button>
      </div>
    </div>
  );
}

function downloadCSV(rows, name) {
  if (!rows.length) return;
  const head = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [head.join(","), ...rows.map((r) => head.map((h) => esc(r[h])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- dashboard ---------- */

function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [donors, setDonors] = useState(null);
  const [requests, setRequests] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [now, setNow] = useState(Date.now());

  const [rq, setRq] = useState({ q: "", status: "All", emergency: false });
  const [dq, setDq] = useState({ q: "", group: "All", city: "", sort: "name", ready: false });
  const [selected, setSelected] = useState(() => new Set());
  const [expanded, setExpanded] = useState(null);
  const [hot, setHot] = useState(null);
  const [palette, setPalette] = useState(false);
  const [paletteQ, setPaletteQ] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (manual) => {
    if (manual) setRefreshing(true);
    try {
      const [d, r] = await Promise.all([getJSON("/donors"), getJSON("/requests")]);
      setDonors(d);
      setRequests(r);
      setUpdatedAt(Date.now());
      setLoadError("");
    } catch {
      setLoadError("Could not load the dashboard data. Check that the server is running, then press refresh.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(() => !document.hidden && load(), 20000);
    const tick = setInterval(() => setNow(Date.now()), 10000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [load]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* ----- derived data ----- */
  const all = requests || [];
  const counts = useMemo(() => {
    const c = { total: all.length, Pending: 0, Approved: 0, Rejected: 0 };
    all.forEach((r) => (c[statusOf(r)] += 1));
    return c;
  }, [all]);
  const days14 = useMemo(() => lastDays(all, 14), [all]);
  const days7 = days14.slice(-7);
  const eligibleCount = donors ? donors.filter((d) => eligibility(d).ok).length : undefined;
  const maxDay = Math.max(1, ...days14.map((d) => d.total));

  const supply = useMemo(
    () =>
      BLOOD_GROUPS.map((g) => ({
        group: g,
        donors: donors ? donors.filter((d) => d.bloodGroup === g && eligibility(d).ok).length : 0,
        demand: all.filter((r) => r.bloodGroup === g && isPending(r)).length,
      })),
    [donors, all]
  );
  const maxSupply = Math.max(1, ...supply.map((s) => Math.max(s.donors, s.demand)));
  const shortages = supply.filter((s) => s.demand > s.donors).length;

  const queue = useMemo(() => [...all].filter(isPending).sort(triage).slice(0, 5), [all]);

  const reqList = useMemo(() => {
    const q = rq.q.trim().toLowerCase();
    return [...all]
      .sort(triage)
      .filter((r) => (rq.status === "All" || statusOf(r) === rq.status) && (!rq.emergency || r.emergency))
      .filter((r) => !q || [r.patientName, r.contact, r.city, r.email, r.bloodGroup].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [all, rq]);

  const donorList = useMemo(() => {
    if (!donors) return null;
    const q = dq.q.trim().toLowerCase();
    const list = donors
      .filter((d) => dq.group === "All" || d.bloodGroup === dq.group)
      .filter((d) => !dq.city || d.city === dq.city)
      .filter((d) => !dq.ready || eligibility(d).ok)
      .filter((d) => !q || [d.name, d.contact, d.city].some((v) => String(v || "").toLowerCase().includes(q)));
    const by = { name: (a, b) => a.name.localeCompare(b.name), age: (a, b) => a.age - b.age, group: (a, b) => a.bloodGroup.localeCompare(b.bloodGroup), city: (a, b) => a.city.localeCompare(b.city) };
    return list.sort(by[dq.sort]);
  }, [donors, dq]);
  const cityOptions = useMemo(() => [...new Set((donors || []).map((d) => d.city).filter(Boolean))].sort(), [donors]);

  const reqPg = usePaged(reqList);
  const donorPg = usePaged(donorList);

  /* ----- actions ----- */
  const finish = async () => {
    await load();
    setBusy(false);
    setConfirm(null);
    setEditing(null);
    setSelected(new Set());
  };

  const runAction = async (url, doneMessage, body) => {
    setBusy(true);
    try {
      const res = await send(url, body);
      if (res.ok) toast(doneMessage);
      else toast("The server could not complete that action. The lists were refreshed.", "error");
    } catch {
      toast("Could not reach the server.", "error");
    }
    await finish();
  };

  const runBulk = async (action, ids) => {
    setBusy(true);
    let failed = 0;
    for (const id of ids) {
      try {
        const res = await send(`/requests/${action}/${id}`);
        if (!res.ok) failed += 1;
      } catch {
        failed += 1;
      }
    }
    if (failed) toast(`${ids.length - failed} done, ${failed} failed.`, "error");
    else toast(`${ids.length} ${ids.length === 1 ? "request" : "requests"} updated.`);
    await finish();
  };

  const COPY = {
    approve: { verb: "Approve", tone: "primary", done: "Request approved." },
    reject: { verb: "Reject", tone: "danger", done: "Request rejected." },
    delete: { verb: "Delete", tone: "danger", done: "Request deleted." },
  };

  const askRequest = (r, action) => {
    const c = COPY[action];
    setConfirm({
      title: `${c.verb} this request?`,
      message:
        action === "delete"
          ? `The request for ${r.patientName} is removed permanently. This cannot be undone.`
          : `${r.patientName} (${fmtGroup(r.bloodGroup)}) will be marked ${action === "approve" ? "approved" : "rejected"} and an email is sent to ${r.email || "the requester"}.`,
      confirmLabel: `${c.verb} request`,
      tone: c.tone,
      run: () => runAction(`/requests/${action}/${r._id}`, c.done),
    });
  };

  const askBulk = (action) => {
    const ids = [...selected];
    const c = COPY[action];
    setConfirm({
      title: `${c.verb} ${ids.length} ${ids.length === 1 ? "request" : "requests"}?`,
      message: action === "delete" ? "The selected requests are removed permanently." : `Each selected request is marked ${action === "approve" ? "approved" : "rejected"} and its requester is emailed.`,
      confirmLabel: `${c.verb} ${ids.length}`,
      tone: c.tone,
      run: () => runBulk(action, ids),
    });
  };

  const askAlert = (r) =>
    setConfirm({
      title: "Alert matching donors on WhatsApp?",
      message: `A short message goes to eligible donors in ${r.city} who can give to ${fmtGroup(r.bloodGroup)} patients and agreed to alerts. Patient details are not shared, and replies reach this dashboard as notifications.`,
      confirmLabel: "Send alert",
      tone: "primary",
      run: async () => {
        setBusy(true);
        try {
          const res = await sendJSON(`/whatsapp/alert/${r._id}`);
          if (res.ok) toast(res.data.matched ? `Alert sent to ${res.data.sent} of ${res.data.matched} matching donors.` : "No eligible donors matched. Nobody was messaged.");
          else toast(res.data?.error || "Could not send the alert.", "error");
        } catch {
          toast("Could not reach the server.", "error");
        }
        setBusy(false);
        setConfirm(null);
      },
    });

  const askDeleteDonor = (d) =>
    setConfirm({
      title: "Delete this donor?",
      message: `${d.name} is removed from the donor list permanently. This cannot be undone.`,
      confirmLabel: "Delete donor",
      tone: "danger",
      run: () => runAction(`/donors/delete/${d._id}`, "Donor deleted."),
    });

  const signOut = async () => {
    try {
      await fetch("/admin/logout");
    } catch {
      /* ignore */
    }
    adminSession.clear();
    toast("You are signed out.");
    navigate("/admin-login");
  };

  const jump = (nextTab, patch) => {
    if (nextTab === "requests") setRq((s) => ({ ...s, q: "", status: "All", emergency: false, ...patch }));
    if (nextTab === "donors") setDq((s) => ({ ...s, q: "", group: "All", city: "", ready: false, ...patch }));
    setTab(nextTab);
    setPalette(false);
    setPaletteQ("");
  };

  const requestActions = (r) => (
    <div className="row-actions">
      {isPending(r) && (
        <>
          <button className="btn btn-sm btn-ok" onClick={() => askRequest(r, "approve")}>
            <Icon name="check" size={16} />
            Approve
          </button>
          <button className="btn btn-sm btn-danger-outline" onClick={() => askRequest(r, "reject")}>
            <Icon name="x" size={16} />
            Reject
          </button>
        </>
      )}
      {statusOf(r) === "Approved" && (
        <button className="btn btn-sm btn-ghost" onClick={() => askAlert(r)} title="Message matching donors on WhatsApp">
          <Icon name="bell" size={16} />
          Alert donors
        </button>
      )}
      <button className="icon-btn" onClick={() => askRequest(r, "delete")} aria-label={`Delete request for ${r.patientName}`}>
        <Icon name="trash" size={18} />
      </button>
    </div>
  );

  const hour = new Date(now).getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const ago = updatedAt ? Math.max(0, Math.round((now - updatedAt) / 1000)) : null;
  const meta = TABS.find((t) => t.id === tab);
  const loading = !requests || !donors;

  const paletteHits = useMemo(() => {
    const q = paletteQ.trim().toLowerCase();
    if (!q) return { r: [], d: [] };
    const has = (...v) => v.some((x) => String(x || "").toLowerCase().includes(q));
    return {
      r: all.filter((r) => has(r.patientName, r.contact, r.city, r.bloodGroup)).slice(0, 5),
      d: (donors || []).filter((d) => has(d.name, d.contact, d.city, d.bloodGroup)).slice(0, 5),
    };
  }, [paletteQ, all, donors]);

  const allVisibleSelected = reqPg.slice.length > 0 && reqPg.slice.every((r) => selected.has(r._id));
  const toggleAll = () =>
    setSelected((s) => {
      const next = new Set(s);
      reqPg.slice.forEach((r) => (allVisibleSelected ? next.delete(r._id) : next.add(r._id)));
      return next;
    });
  const toggleOne = (id) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const kpis = [
    { label: "Donors", value: donors?.length, icon: "users", tone: "red", note: eligibleCount === undefined ? "" : `${eligibleCount} eligible now`, go: () => jump("donors") },
    { label: "Requests", value: loading ? undefined : counts.total, icon: "inbox", tone: "dark", note: "Last 7 days", spark: days7.map((d) => d.total), go: () => jump("requests") },
    { label: "Pending", value: loading ? undefined : counts.Pending, icon: "clock", tone: "amber", note: "Waiting for you", spark: days7.map((d) => d.pending), go: () => jump("requests", { status: "Pending" }) },
    { label: "Approved", value: loading ? undefined : counts.Approved, icon: "check", tone: "green", note: "Last 7 days", spark: days7.map((d) => d.approved), go: () => jump("requests", { status: "Approved" }) },
    { label: "Rejected", value: loading ? undefined : counts.Rejected, icon: "x", tone: "red", note: "Last 7 days", spark: days7.map((d) => d.rejected), go: () => jump("requests", { status: "Rejected" }) },
  ];

  return (
    <>
      <div className={`admin-shell${collapsed ? " is-collapsed" : ""}`}>
        <aside className="side">
          <div className="side-brand">
            <BrandMark size={32} light />
            <div className="side-text">
              <strong>Blood Donation</strong>
              <span>Admin console</span>
            </div>
          </div>
          <nav className="side-nav" role="tablist" aria-label="Admin sections">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} title={t.label} className={`side-link${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>
                <Icon name={t.icon} size={20} />
                <span className="side-text">{t.label}</span>
                {t.id === "requests" && counts.Pending > 0 && <span className="tab-count">{counts.Pending}</span>}
              </button>
            ))}
          </nav>
          <div className="side-foot">
            <a className="side-link" href="#/" title="View website">
              <Icon name="arrow" size={20} />
              <span className="side-text">View website</span>
            </a>
            <button className="side-link" onClick={signOut} title="Sign out">
              <Icon name="logout" size={20} />
              <span className="side-text">Sign out</span>
            </button>
            <button className="side-link side-collapse" onClick={() => setCollapsed((c) => !c)} aria-label="Collapse sidebar" title="Collapse sidebar">
              <Icon name="sidebar" size={20} />
              <span className="side-text">Collapse</span>
            </button>
          </div>
        </aside>

        <div className="admin-main">
          <div className="admin-top">
            <div className="admin-title">
              <h1>{meta.title}</h1>
              <p>{meta.hint}</p>
            </div>
            <button className="searchbox" onClick={() => setPalette(true)} aria-label="Quick search">
              <Icon name="search" size={18} />
              <span>Search donors and requests</span>
              <kbd>Ctrl K</kbd>
            </button>
            <div className="admin-top-actions">
              <span className="live" title={updatedAt ? `Updated ${ago}s ago` : ""}>
                <i /> Live{ago !== null && <small>{ago < 5 ? "just now" : `${ago}s ago`}</small>}
              </span>
              <button className={`icon-btn bordered${refreshing ? " spinning" : ""}`} onClick={() => load(true)} aria-label="Refresh data">
                <Icon name="refresh" size={19} />
              </button>
              <NotificationBell />
            </div>
          </div>

          <div className="admin-content">
            {loadError && <Alert>{loadError}</Alert>}

            {tab === "overview" && (
              <>
                <section className="welcome">
                  <div>
                    <p className="welcome-date">{new Date(now).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
                    <h2>{greeting}, admin.</h2>
                    <p>
                      {loading
                        ? "Loading the latest numbers..."
                        : counts.Pending > 0
                        ? `${counts.Pending} ${counts.Pending === 1 ? "request is" : "requests are"} waiting for a decision${shortages ? `, and ${shortages} blood ${shortages === 1 ? "group has" : "groups have"} more demand than eligible donors.` : "."}`
                        : "Nothing is waiting. Every request has been decided."}
                    </p>
                  </div>
                  <div className="welcome-actions">
                    <button className="btn btn-light btn-lg" onClick={() => jump("requests", { status: "Pending" })}>
                      Review pending
                    </button>
                    <button className="btn btn-outline-light btn-lg" onClick={() => downloadCSV(all.map((r) => ({ patient: r.patientName, age: r.age, group: r.bloodGroup, city: r.city, contact: r.contact, email: r.email, emergency: r.emergency ? "yes" : "no", status: statusOf(r), requested: r.createdAt })), "requests.csv")}>
                      <Icon name="download" size={18} />
                      Export requests
                    </button>
                  </div>
                </section>

                <section className="kpi-grid" aria-label="Key numbers">
                  {kpis.map((k) => (
                    <button key={k.label} className="kpi" onClick={k.go}>
                      <span className={`stat-icon tone-${k.tone}`}>
                        <Icon name={k.icon} size={22} />
                      </span>
                      <span className="stat-value">
                        <CountUp value={k.value} />
                      </span>
                      <span className="stat-label">{k.label}</span>
                      <span className="kpi-note">{k.note}</span>
                      {k.spark && <Sparkline values={k.spark} />}
                    </button>
                  ))}
                </section>

                <div className="grid-2">
                  <section className="panel">
                    <div className="panel-head">
                      <h2 className="panel-title">Requests, last 14 days</h2>
                      <ul className="legend inline">
                        <li><i style={{ background: "var(--plasma)" }} />Pending</li>
                        <li><i style={{ background: "var(--ok)" }} />Approved</li>
                        <li><i style={{ background: "var(--blood)" }} />Rejected</li>
                      </ul>
                    </div>
                    {loading ? (
                      <TableSkeleton rows={3} />
                    ) : (
                      <div className="bars" role="img" aria-label="Requests per day for the last 14 days">
                        {days14.map((d) => (
                          <div key={d.key} className="bar-col">
                            <div className="bar-tip">
                              <b>{d.label}</b>
                              {d.total} {d.total === 1 ? "request" : "requests"}
                              <small>{d.approved} approved, {d.rejected} rejected, {d.pending} pending</small>
                            </div>
                            <div className="bar-track">
                              <div className="bar" style={{ height: `${(d.total / maxDay) * 100}%` }}>
                                <span style={{ flex: d.rejected, background: "var(--blood)" }} />
                                <span style={{ flex: d.approved, background: "var(--ok)" }} />
                                <span style={{ flex: d.pending, background: "var(--plasma)" }} />
                              </div>
                            </div>
                            <span className="bar-label">{d.label.split(" ")[0]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="panel">
                    <h2 className="panel-title">Request status</h2>
                    {loading ? (
                      <TableSkeleton rows={2} />
                    ) : (
                      <div className="donut-wrap">
                        <DonutChart
                          active={hot}
                          centerValue={counts.total}
                          centerLabel={counts.total === 1 ? "request" : "requests"}
                          segments={[
                            { label: "Approved", value: counts.Approved, color: "var(--ok)" },
                            { label: "Rejected", value: counts.Rejected, color: "var(--blood)" },
                            { label: "Pending", value: counts.Pending, color: "var(--plasma)" },
                          ]}
                        />
                        <ul className="legend">
                          {[["Approved", "var(--ok)"], ["Rejected", "var(--blood)"], ["Pending", "var(--plasma)"]].map(([name, color]) => (
                            <li key={name} onMouseEnter={() => setHot(name)} onMouseLeave={() => setHot(null)} onFocus={() => setHot(name)} onBlur={() => setHot(null)} tabIndex={0}>
                              <i style={{ background: color }} />
                              {name}
                              <b>{counts[name]}</b>
                              <em>{counts.total ? Math.round((counts[name] / counts.total) * 100) : 0}%</em>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </section>
                </div>

                <div className="grid-2 wide-left">
                  <section className="panel">
                    <div className="panel-head">
                      <h2 className="panel-title">Supply and demand by blood group</h2>
                      <ul className="legend inline">
                        <li><i style={{ background: "var(--blood)" }} />Eligible donors</li>
                        <li><i style={{ background: "var(--plasma)" }} />Pending requests</li>
                      </ul>
                    </div>
                    {loading ? (
                      <TableSkeleton rows={4} />
                    ) : (
                      <ul className="supply">
                        {supply.map((s) => (
                          <li key={s.group}>
                            <button onClick={() => jump("donors", { group: s.group, ready: true })} title={`Show eligible ${fmtGroup(s.group)} donors`}>
                              <GroupChip group={s.group} />
                              <span className="supply-bars">
                                <span className="sb sb-supply" style={{ width: `${(s.donors / maxSupply) * 100}%` }} />
                                <span className="sb sb-demand" style={{ width: `${(s.demand / maxSupply) * 100}%` }} />
                              </span>
                              <span className="supply-nums">
                                {s.donors} / {s.demand}
                              </span>
                              {s.demand > s.donors ? <span className="badge badge-rejected">Shortage</span> : s.demand > 0 ? <span className="badge badge-approved">Covered</span> : <span className="badge badge-none">No demand</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="hint">Matches the same blood group only. Click a row to see those donors.</p>
                  </section>

                  <section className="panel">
                    <div className="panel-head">
                      <h2 className="panel-title">Needs a decision</h2>
                      <button className="link-btn" onClick={() => jump("requests", { status: "Pending" })}>See all</button>
                    </div>
                    {loading && <TableSkeleton rows={3} />}
                    {!loading && queue.length === 0 && <EmptyState icon="check" title="You are all caught up">There are no pending requests right now.</EmptyState>}
                    {queue.length > 0 && (
                      <ul className="queue">
                        {queue.map((r) => (
                          <li key={r._id} className={r.emergency ? "emergency" : ""}>
                            <div>
                              <strong>{r.patientName}</strong>
                              {r.emergency && <span className="badge badge-emergency">Emergency</span>}
                              {r.source === "whatsapp" && <span className="badge badge-wa">WhatsApp</span>}
                              <p>{r.city}, age {r.age ?? "-"}. {formatDate(r.createdAt)}</p>
                            </div>
                            <GroupChip group={r.bloodGroup} />
                            {requestActions(r)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              </>
            )}

            {tab === "requests" && (
              <section>
                <div className="toolbar">
                  <label className="search-in">
                    <Icon name="search" size={18} />
                    <input className="input" placeholder="Search patient, contact, city, group" value={rq.q} onChange={(e) => setRq((s) => ({ ...s, q: e.target.value }))} aria-label="Search requests" />
                  </label>
                  <div className="seg" role="group" aria-label="Filter requests">
                    {["All", "Pending", "Approved", "Rejected"].map((f) => (
                      <button key={f} className={rq.status === f ? "on" : ""} onClick={() => setRq((s) => ({ ...s, status: f }))}>
                        {f}
                        <span>{f === "All" ? counts.total : counts[f]}</span>
                      </button>
                    ))}
                  </div>
                  <button className={`chip-toggle${rq.emergency ? " on" : ""}`} aria-pressed={rq.emergency} onClick={() => setRq((s) => ({ ...s, emergency: !s.emergency }))}>
                    <Icon name="alert" size={16} />
                    Emergency only
                  </button>
                </div>

                {selected.size > 0 && (
                  <div className="bulk" role="region" aria-label="Bulk actions">
                    <strong>{selected.size} selected</strong>
                    <button className="btn btn-sm btn-ok" onClick={() => askBulk("approve")}>Approve</button>
                    <button className="btn btn-sm btn-light" onClick={() => askBulk("reject")}>Reject</button>
                    <button className="btn btn-sm btn-outline-light" onClick={() => askBulk("delete")}>Delete</button>
                    <button className="link-btn" onClick={() => setSelected(new Set())}>Clear</button>
                  </div>
                )}

                {loading && <TableSkeleton rows={6} />}
                {!loading && reqList.length === 0 && <EmptyState title="No requests match">Try a different search or filter.</EmptyState>}
                {!loading && reqList.length > 0 && (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th className="th-check"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label="Select all on this page" /></th>
                          <th>Patient</th>
                          <th>Blood group</th>
                          <th>City</th>
                          <th>Status</th>
                          <th>Requested</th>
                          <th className="th-actions">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reqPg.slice.map((r) => (
                          <Fragment key={r._id}>
                            <tr className={`${r.emergency && isPending(r) ? "row-emergency" : ""}${selected.has(r._id) ? " row-selected" : ""}`}>
                              <td className="th-check"><input type="checkbox" checked={selected.has(r._id)} onChange={() => toggleOne(r._id)} aria-label={`Select ${r.patientName}`} /></td>
                              <td>
                                <button className="cell-link" onClick={() => setExpanded(expanded === r._id ? null : r._id)} aria-expanded={expanded === r._id}>
                                  <Icon name="chevron" size={16} className={expanded === r._id ? "flip" : ""} />
                                  <strong>{r.patientName}</strong>
                                </button>
                                {r.emergency && <span className="badge badge-emergency">Emergency</span>}
                                {r.source === "whatsapp" && <span className="badge badge-wa">WhatsApp</span>}
                              </td>
                              <td><GroupChip group={r.bloodGroup} /></td>
                              <td>{r.city}</td>
                              <td><StatusBadge status={statusOf(r)} /></td>
                              <td>{formatDate(r.createdAt)}</td>
                              <td>{requestActions(r)}</td>
                            </tr>
                            {expanded === r._id && (
                              <tr className="row-detail">
                                <td />
                                <td colSpan={6}>
                                  <dl>
                                    <div><dt>Patient age</dt><dd>{r.age ?? "-"}</dd></div>
                                    <div><dt>Contact</dt><dd>{r.contact}</dd></div>
                                    <div><dt>Email</dt><dd>{r.email || "-"}</dd></div>
                                    <div><dt>Matching eligible donors</dt><dd>{(donors || []).filter((d) => d.bloodGroup === r.bloodGroup && d.city === r.city && eligibility(d).ok).length} in {r.city}</dd></div>
                                  </dl>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                    <Pager pg={reqPg} />
                  </div>
                )}
              </section>
            )}

            {tab === "donors" && (
              <section>
                <div className="toolbar">
                  <label className="search-in">
                    <Icon name="search" size={18} />
                    <input className="input" placeholder="Search name, contact or city" value={dq.q} onChange={(e) => setDq((s) => ({ ...s, q: e.target.value }))} aria-label="Search donors" />
                  </label>
                  <select className="input select" value={dq.city} onChange={(e) => setDq((s) => ({ ...s, city: e.target.value }))} aria-label="Filter by city">
                    <option value="">All cities</option>
                    {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="input select" value={dq.sort} onChange={(e) => setDq((s) => ({ ...s, sort: e.target.value }))} aria-label="Sort donors">
                    <option value="name">Sort: Name</option>
                    <option value="group">Sort: Blood group</option>
                    <option value="city">Sort: City</option>
                    <option value="age">Sort: Age</option>
                  </select>
                  <button className={`chip-toggle${dq.ready ? " on" : ""}`} aria-pressed={dq.ready} onClick={() => setDq((s) => ({ ...s, ready: !s.ready }))}>
                    <Icon name="check" size={16} />
                    Eligible now
                  </button>
                  <button className="btn btn-sm btn-ghost" disabled={!donorList?.length} onClick={() => downloadCSV(donorList.map((d) => ({ name: d.name, age: d.age, group: d.bloodGroup, city: d.city, contact: d.contact, last_donation: d.lastDonationDate || "" })), "donors.csv")}>
                    <Icon name="download" size={16} />
                    Export
                  </button>
                </div>
                <div className="group-filter" role="group" aria-label="Filter by blood group">
                  {["All", ...BLOOD_GROUPS].map((g) => (
                    <button key={g} className={dq.group === g ? "on" : ""} onClick={() => setDq((s) => ({ ...s, group: g }))}>
                      {g === "All" ? "All groups" : fmtGroup(g)}
                      <span>{g === "All" ? donors?.length ?? 0 : (donors || []).filter((d) => d.bloodGroup === g).length}</span>
                    </button>
                  ))}
                </div>

                {loading && <TableSkeleton rows={6} />}
                {!loading && donorList.length === 0 && <EmptyState icon="users" title="No donors match">Try a different search or clear a filter.</EmptyState>}
                {!loading && donorList.length > 0 && (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Age</th>
                          <th>Blood group</th>
                          <th>Contact</th>
                          <th>City</th>
                          <th>Availability</th>
                          <th className="th-actions">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donorPg.slice.map((d) => {
                          const e = eligibility(d);
                          return (
                            <tr key={d._id}>
                              <td><strong>{d.name}</strong></td>
                              <td>{d.age}</td>
                              <td><GroupChip group={d.bloodGroup} /></td>
                              <td>{d.contact}</td>
                              <td>{d.city}</td>
                              <td>
                                <span className={`badge ${e.ok ? "badge-approved" : "badge-pending"}`}>{e.label}</span>
                                <small className="cell-sub">Last: {formatDate(d.lastDonationDate)}</small>
                              </td>
                              <td>
                                <div className="row-actions">
                                  <button className="btn btn-sm btn-ghost" onClick={() => setEditing(d)}>
                                    <Icon name="edit" size={16} />
                                    Edit
                                  </button>
                                  <button className="icon-btn" onClick={() => askDeleteDonor(d)} aria-label={`Delete donor ${d.name}`}>
                                    <Icon name="trash" size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <Pager pg={donorPg} />
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>

      {palette && (
        <Modal title="Quick search" onClose={() => { setPalette(false); setPaletteQ(""); }}>
          <label className="search-in palette-in">
            <Icon name="search" size={18} />
            <input autoFocus className="input" placeholder="Type a name, number, city or blood group" value={paletteQ} onChange={(e) => setPaletteQ(e.target.value)} />
          </label>
          {paletteQ.trim() === "" && <p className="hint pal-hint">Jump straight to a donor or request. Press Esc to close.</p>}
          {paletteQ.trim() !== "" && paletteHits.r.length + paletteHits.d.length === 0 && <p className="hint pal-hint">No matches.</p>}
          {paletteHits.r.length > 0 && (
            <div className="pal-group">
              <h3>Requests</h3>
              {paletteHits.r.map((r) => (
                <button key={r._id} className="pal-item" onClick={() => jump("requests", { q: r.patientName })}>
                  <GroupChip group={r.bloodGroup} />
                  <span>{r.patientName}<small>{r.city}, {r.contact}</small></span>
                  <StatusBadge status={statusOf(r)} />
                </button>
              ))}
            </div>
          )}
          {paletteHits.d.length > 0 && (
            <div className="pal-group">
              <h3>Donors</h3>
              {paletteHits.d.map((d) => (
                <button key={d._id} className="pal-item" onClick={() => jump("donors", { q: d.name })}>
                  <GroupChip group={d.bloodGroup} />
                  <span>{d.name}<small>{d.city}, {d.contact}</small></span>
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}

      {confirm && (
        <Modal
          title={confirm.title}
          size="s"
          onClose={() => !busy && setConfirm(null)}
          footer={
            <>
              <Button className="btn-ghost" onClick={() => setConfirm(null)} disabled={busy}>Cancel</Button>
              <Button className={confirm.tone === "danger" ? "btn-danger" : "btn-primary"} onClick={confirm.run} loading={busy}>{confirm.confirmLabel}</Button>
            </>
          }
        >
          <p>{confirm.message}</p>
        </Modal>
      )}

      {editing && (
        <EditDonorModal donor={editing} busy={busy} onClose={() => !busy && setEditing(null)} onSave={(body) => runAction(`/donors/update/${editing._id}`, "Donor updated.", body)} />
      )}
    </>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const allowed = adminSession.get();

  useEffect(() => {
    if (!allowed) navigate("/admin-login", { replace: true });
  }, [allowed, navigate]);

  return allowed ? <Dashboard /> : null;
}
