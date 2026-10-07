const { sendText, sendTemplate } = require("./whatsapp");

/* Tells a WhatsApp requester the admin's decision. Web requests keep using email only. */
async function notifyDecision(request) {
  if (!request || request.source !== "whatsapp" || !request.whatsappFrom) return;

  if (process.env.WHATSAPP_DECISION_TEMPLATE) {
    await sendTemplate(request.whatsappFrom, process.env.WHATSAPP_DECISION_TEMPLATE, [request.patientName, request.status]);
    return;
  }
  const text =
    request.status === "Approved"
      ? `Good news: the blood request for ${request.patientName} (${request.bloodGroup}, ${request.city}) has been approved. Our team will contact you soon.`
      : `Update: the blood request for ${request.patientName} (${request.bloodGroup}, ${request.city}) was not approved. This may be because no compatible donor is available right now. You can try again later.`;
  await sendText(request.whatsappFrom, text);
}

module.exports = { notifyDecision };
