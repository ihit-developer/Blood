/*
  WhatsApp Business Cloud API helpers (official Meta API, no extra packages).
  Everything is a safe no-op until WHATSAPP_TOKEN and WHATSAPP_PHONE_ID are set in .env.
*/
const API = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || "v21.0"}`;

const isConfigured = () => Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);

/* 03001234567 / 3001234567 / +92 300 1234567  ->  923001234567 */
function toIntl(number) {
  const d = String(number || "").replace(/\D/g, "");
  if (/^03\d{9}$/.test(d)) return "92" + d.slice(1);
  if (/^3\d{9}$/.test(d)) return "92" + d;
  return d;
}

/* 923001234567 -> 03001234567 (the format the website stores) */
function toLocal(number) {
  const d = toIntl(number);
  return /^92\d{10}$/.test(d) ? "0" + d.slice(2) : d;
}

async function post(body) {
  if (!isConfigured()) {
    console.log("[whatsapp] not configured, message skipped");
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch(`${API}/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
    });
    if (!res.ok) {
      console.log("[whatsapp] send failed", res.status, (await res.text()).slice(0, 300));
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.log("[whatsapp] send error", err.message);
    return { ok: false };
  }
}

const sendText = (to, text) => post({ to: toIntl(to), type: "text", text: { body: String(text).slice(0, 4000) } });

/* Template messages are required to message someone who has not written to you in the last 24 hours. */
const sendTemplate = (to, name, params, language = "en") =>
  post({
    to: toIntl(to),
    type: "template",
    template: {
      name,
      language: { code: language },
      components: [{ type: "body", parameters: params.map((p) => ({ type: "text", text: String(p) })) }],
    },
  });

module.exports = { isConfigured, toIntl, toLocal, sendText, sendTemplate };
