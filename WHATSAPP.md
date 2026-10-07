# WhatsApp AI agent: setup

Everything is switched off until the keys below are in `.env`. The website works exactly as before without them.

## What it does
- **Chat requests:** someone messages your WhatsApp number, the AI collects the details, and a PENDING request appears in the admin dashboard (marked WhatsApp). An admin still approves or rejects it.
- **Status:** "meri request ka kya hua" returns the status of requests made from that same number only.
- **Donor sign-up:** a person can register as a donor by chat (age 18-65). Registering there means they agreed to alerts.
- **Decision messages:** when you approve or reject a WhatsApp request, the requester gets a WhatsApp message.
- **Donor alerts:** on an approved request, press **Alert donors** in the admin Requests tab. Only opted-in, eligible, compatible donors in the same city are messaged (max 20). No patient details are sent. A donor replying YES creates a notification in the admin bell. Replying STOP opts out.

The AI can only create pending requests, read the sender's own requests and register the sender as a donor. It cannot approve, reject, delete or see anyone else's data.

## Setup (Meta)
1. developers.facebook.com -> create an app of type **Business**, add the **WhatsApp** product.
2. In WhatsApp -> API Setup copy the **Phone number ID** and create a permanent access token (System User). Put them in `.env`.
3. Webhook: callback URL `https://YOUR-DOMAIN/whatsapp/webhook`, verify token = `WHATSAPP_VERIFY_TOKEN`. Subscribe to the **messages** field.
4. App settings -> Basic -> copy **App Secret** into `WHATSAPP_APP_SECRET`.
5. Get an Anthropic API key from console.anthropic.com and set `ANTHROPIC_API_KEY`.
6. Restart `node server.js`.

Testing on your own computer: run a tunnel (for example `ngrok http 3000`) and use the https URL it prints as the webhook domain.

## Templates (for messaging people first)
WhatsApp only allows free text within 24 hours of the person's last message. For donor alerts and late decisions, create these in Meta's template manager (category Utility), then put their names in `.env`:
- Alert template body: `Urgent: {{1}} blood is needed in {{2}}. If you can donate, reply YES. Reply STOP to stop alerts.`
- Decision template body: `Update on the blood request for {{1}}: {{2}}.`

Without templates the same texts are sent as plain messages, which only arrive inside the 24-hour window (fine for testing with your own number).

## Limits to know
- Chat memory is kept in server RAM per number (6 hours) and is lost on restart. Requests and donors are saved in MongoDB.
- Each number can create 3 requests per day and send 30 messages per hour.
- Meta pricing and rules change, so check their current WhatsApp pricing before going live.
