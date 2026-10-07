const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const Request = require("../models/Request");
const Donor = require("../models/Donor");
const Notification = require("../models/Notification");
const { handleMessage } = require("../utils/agent");
const { CAN_RECEIVE_FROM, isEligible } = require("../utils/bloodRules");
const { isConfigured, sendText, sendTemplate, toIntl, toLocal } = require("../utils/whatsapp");

const ALERT_LIMIT = 20;
const seen = new Set(); // WhatsApp can deliver the same message twice

function validSignature(req) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) {
    console.log("[whatsapp] WHATSAPP_APP_SECRET is not set, webhook signature is NOT being checked");
    return true;
  }
  const given = Buffer.from(req.get("x-hub-signature-256") || "");
  const expected = Buffer.from("sha256=" + crypto.createHmac("sha256", secret).update(req.rawBody || Buffer.alloc(0)).digest("hex"));
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

/* ---------- Meta calls this once to verify the webhook URL ---------- */
router.get("/webhook", (req, res) => {
  const ok = req.query["hub.mode"] === "subscribe" && process.env.WHATSAPP_VERIFY_TOKEN && req.query["hub.verify_token"] === process.env.WHATSAPP_VERIFY_TOKEN;
  if (ok) return res.status(200).send(req.query["hub.challenge"]);
  res.sendStatus(403);
});

/* ---------- incoming messages ---------- */
async function processMessage(msg) {
  const from = msg.from;
  const local = toLocal(from);

  if (msg.type !== "text") {
    return sendText(from, "Please send a text message. I can help you request blood, check a request, or register as a donor.");
  }
  const text = (msg.text && msg.text.body) || "";

  // opt-out always works, even without the AI
  if (/^\s*(stop|unsubscribe|band karo|band kro)\s*[.!]?\s*$/i.test(text)) {
    await Donor.updateMany({ contact: local }, { whatsappOptIn: false });
    return sendText(from, "You will not get donor alerts any more. Message us any time if you want to help again.");
  }

  // a donor answering an alert
  if (/^\s*(yes|y|haan|han|ha|ji|ji haan)\s*[.!]?\s*$/i.test(text)) {
    const donor = await Donor.findOne({ contact: local, "lastAlert.at": { $gte: new Date(Date.now() - 86400000) } });
    if (donor) {
      await Notification.create({ message: `✅ Donor ${donor.name} (${donor.bloodGroup}, ${donor.city}) can donate. Contact: ${donor.contact}` });
      donor.lastAlert = undefined;
      await donor.save();
      return sendText(from, "Thank you! Our admin team will contact you shortly. Your number is not shared with the patient's family.");
    }
  }

  return sendText(from, await handleMessage(from, text));
}

router.post("/webhook", (req, res) => {
  if (!validSignature(req)) return res.sendStatus(403);
  res.sendStatus(200); // answer fast, work afterwards

  const messages = [];
  for (const entry of req.body.entry || [])
    for (const change of entry.changes || [])
      for (const m of (change.value && change.value.messages) || []) messages.push(m);

  messages.forEach(async (msg) => {
    if (!msg.id || seen.has(msg.id)) return;
    seen.add(msg.id);
    if (seen.size > 2000) seen.delete(seen.values().next().value);
    try {
      await processMessage(msg);
    } catch (err) {
      console.log("[whatsapp] could not handle message:", err.message);
      sendText(msg.from, "Sorry, something went wrong. Please try again in a moment.").catch(() => {});
    }
  });
});

/* ---------- admin: alert matching donors about an approved request ---------- */
router.post("/alert/:id", async (req, res) => {
  try {
    if (!req.session || !req.session.admin) return res.status(401).json({ error: "Admin sign-in required." });
    if (!isConfigured()) return res.status(503).json({ error: "WhatsApp is not configured on the server yet." });

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found." });
    if (request.status !== "Approved") return res.status(400).json({ error: "Only approved requests can be sent to donors." });

    const groups = CAN_RECEIVE_FROM[request.bloodGroup] || [];
    const city = String(request.city || "").trim().toLowerCase();
    const candidates = await Donor.find({ whatsappOptIn: true, bloodGroup: { $in: groups } });
    const matched = candidates.filter((d) => String(d.city || "").trim().toLowerCase() === city && isEligible(d)).slice(0, ALERT_LIMIT);

    const group = request.bloodGroup;
    let sent = 0;
    for (const donor of matched) {
      const result = process.env.WHATSAPP_ALERT_TEMPLATE
        ? await sendTemplate(toIntl(donor.contact), process.env.WHATSAPP_ALERT_TEMPLATE, [group, request.city])
        : await sendText(toIntl(donor.contact), `Urgent: ${group} blood is needed in ${request.city}. If you can donate, reply YES. Reply STOP to stop alerts.`);
      if (result.ok) {
        sent += 1;
        donor.lastAlert = { requestId: String(request._id), at: new Date() };
        await donor.save();
      }
    }
    res.json({ matched: matched.length, sent, failed: matched.length - sent });
  } catch (err) {
    console.log("[whatsapp] alert failed:", err.message);
    res.status(500).json({ error: "Could not send the alert." });
  }
});

module.exports = router;
