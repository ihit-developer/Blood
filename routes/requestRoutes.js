const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const Notification = require("../models/Notification");
const transporter = require("../utils/mailer"); // 📧 EMAIL
const { notifyDecision } = require("../utils/notify"); // 💬 WhatsApp (only for WhatsApp requests)

/* ================= CREATE – Submit Blood Request (PENDING + NOTIFICATION) ================= */
router.post("/add", async (req, res) => {
  const request = await Request.create(req.body);

  // 🔔 ADMIN NOTIFICATION
  await Notification.create({
    message: `🚨 New blood request from ${request.patientName}`
  });

  // 📧 EMAIL ON SUBMIT (PENDING)
  if (request.email) {
    await transporter.sendMail({
      from: "Blood Donation System <no-reply@bloodsystem.com>",
      to: request.email,
      subject: "🩸 Blood Request Submitted",
      html: `
        <h3>Blood Request Received</h3>

        <p>Your blood request has been successfully submitted.</p>

        <p>
          <b>Status:</b>
          <span style="color:orange;font-weight:bold;">PENDING</span>
        </p>

        <p><b>Patient Name:</b> ${request.patientName}</p>
        <p><b>Age:</b> ${request.age}</p>
        <p><b>Blood Group:</b> ${request.bloodGroup}</p>
        <p><b>City:</b> ${request.city}</p>

        <p>
          Our admin team is reviewing your request.
          You will receive another email once it is approved or rejected.
        </p>

        <br>
        <p>🩸 Blood Donation System</p>
      `
    });
  }

  res.redirect("/request-status.html");
});

/* ================= READ – All Requests (Admin) ================= */
router.get("/", async (req, res) => {
  const requests = await Request.find();
  res.json(requests);
});

/* ================= STATS (FOR CHART) ================= */
router.get("/stats", async (req, res) => {
  const total = await Request.countDocuments();
  const approved = await Request.countDocuments({ status: "Approved" });
  const rejected = await Request.countDocuments({ status: "Rejected" });

  res.json({ total, approved, rejected });
});

/* ================= APPROVE BLOOD REQUEST (WITH EMAIL) ================= */
router.post("/approve/:id", async (req, res) => {
  const request = await Request.findByIdAndUpdate(
    req.params.id,
    { status: "Approved" },
    { new: true }
  );

  notifyDecision(request).catch(() => {});

  // 📧 EMAIL ON APPROVE
  if (request.email) {
    await transporter.sendMail({
      from: "Blood Donation System <no-reply@bloodsystem.com>",
      to: request.email,
      subject: "🩸 Blood Request Approved",
      html: `
        <h3>Good News!</h3>

        <p>Your blood request has been
        <b style="color:green;">APPROVED</b>.</p>

        <p><b>Patient Name:</b> ${request.patientName}</p>
        <p><b>Age:</b> ${request.age}</p>
        <p><b>Blood Group:</b> ${request.bloodGroup}</p>
        <p><b>City:</b> ${request.city}</p>

        <p>Our team will contact you soon.</p>

        <br>
        <p>🩸 Blood Donation System</p>
      `
    });
  }

  res.redirect("/admin.html");
});

/* ================= REJECT BLOOD REQUEST (WITH EMAIL) ================= */
router.post("/reject/:id", async (req, res) => {
  const request = await Request.findByIdAndUpdate(
    req.params.id,
    { status: "Rejected" },
    { new: true }
  );

  notifyDecision(request).catch(() => {});

  // 📧 EMAIL ON REJECT
  if (request.email) {
    await transporter.sendMail({
      from: "Blood Donation System <no-reply@bloodsystem.com>",
      to: request.email,
      subject: "🩸 Blood Request Rejected",
      html: `
        <h3>Blood Request Update</h3>

        <p>
          We regret to inform you that your blood request has been
          <b style="color:red;">REJECTED</b>.
        </p>

        <p><b>Patient Name:</b> ${request.patientName}</p>
        <p><b>Age:</b> ${request.age}</p>
        <p><b>Blood Group:</b> ${request.bloodGroup}</p>
        <p><b>City:</b> ${request.city}</p>

        <p>
          This may be due to unavailability of compatible donors.
          You may try again later.
        </p>

        <br>
        <p>🩸 Blood Donation System</p>
      `
    });
  }

  res.redirect("/admin.html");
});

/* ================= DELETE REQUEST ================= */
router.post("/delete/:id", async (req, res) => {
  await Request.findByIdAndDelete(req.params.id);
  res.redirect("/admin.html");
});

/* ================= CHECK REQUEST STATUS ================= */
router.get("/status", async (req, res) => {
  const { contact } = req.query;
  const requests = await Request.find({ contact });
  res.json(requests);
});

/* ================= READ ONE (KEEP LAST) ================= */
router.get("/:id", async (req, res) => {
  const request = await Request.findById(req.params.id);
  res.json(request);
});

module.exports = router;
