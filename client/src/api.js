/*
  Thin wrapper around the existing Express API. The backend is unchanged:
  GET routes return JSON, POST routes read the body and answer with a redirect.
  fetch() follows those redirects, so a POST counts as successful when the
  response either is ok or was redirected.
*/

export async function getJSON(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const error = new Error(`Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function send(url, body = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return {
    ok: res.ok || res.redirected,
    redirected: res.redirected,
    status: res.status,
    url: res.url,
  };
}

/* Same as send(), but also returns the JSON body (used by the WhatsApp alert endpoint). */
export async function sendJSON(url, body = {}) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no JSON body */
  }
  return { ok: res.ok, status: res.status, data };
}

/* Remembers that the admin signed in, so /#/admin can send visitors to the login page. */
export const adminSession = {
  get() {
    try {
      return sessionStorage.getItem("bd_admin") === "1";
    } catch {
      return false;
    }
  },
  set() {
    try {
      sessionStorage.setItem("bd_admin", "1");
    } catch {
      /* storage unavailable */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem("bd_admin");
    } catch {
      /* storage unavailable */
    }
  },
};
