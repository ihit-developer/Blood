const express = require("express");
const Donor = require("../models/Donor");
const transporter = require("../utils/mailer"); // ✅ EMAIL CONFIG
const Notification = require("../models/Notification");
const router = express.Router();

/* ================= CREATE (Register Donor) ================= */
router.post("/add", async (req, res) => {
  const donor = await Donor.create(req.body);

  // 📧 EMAIL TO ADMIN
  await transporter.sendMail({
    from: "Blood Donation System <no-reply@bloodsystem.com>",
    to: "ihtisham11.com@gmail.com",   // 🔴 replace with real admin email
    subject: "🩸 New Donor Registered",
    html: `
      <h3>New Donor Registered</h3>
      <p><b>Name:</b> ${donor.name}</p>
      <p><b>Age:</b> ${donor.age}</p>
      <p><b>Blood Group:</b> ${donor.bloodGroup}</p>
      <p><b>City:</b> ${donor.city}</p>
      <p><b>Contact:</b> ${donor.contact}</p>
    `
  });

  res.redirect("/donor-login.html");
});

/* ================= READ (View All Donors) ================= */
router.get("/", async (req, res) => {
  const donors = await Donor.find();
  res.json(donors);
});

/* ================= SEARCH DONORS ================= */
router.get("/search", async (req, res) => {
  const { bloodGroup, city } = req.query;

  const query = {};
  if (bloodGroup) query.bloodGroup = bloodGroup;
  if (city) query.city = city;

  const donors = await Donor.find(query);
  res.json(donors);
});

/* ================= TOTAL DONORS ================= */
router.get("/count", async (req, res) => {
  const totalDonors = await Donor.countDocuments();
  res.json({ totalDonors });
});

/* ================= READ ONE (For Update) ================= */
router.get("/:id", async (req, res) => {
  const donor = await Donor.findById(req.params.id);
  res.json(donor);
});

/* ================= UPDATE DONOR ================= */
router.post("/update/:id", async (req, res) => {
  await Donor.findByIdAndUpdate(req.params.id, req.body);
  res.redirect("/admin.html");
});

/* ================= DELETE DONOR ================= */
router.post("/delete/:id", async (req, res) => {
  await Donor.findByIdAndDelete(req.params.id);
  res.redirect("/admin.html");
});

/* ================= DONOR LOGIN ================= */
router.post("/login", async (req, res) => {
  const donor = await Donor.findOne({ contact: req.body.contact });

  if (!donor) {
    return res.redirect("/donor-not-found.html");
  }

  req.session.donor = donor._id;
  res.redirect("/donor-profile.html");
});

/* ================= CREATE NOTIFICATION (SECOND ADD ROUTE) ================= */
router.post("/add", async (req, res) => {
  const donor = await Donor.create(req.body);

  // 🔔 CREATE NOTIFICATION FOR ADMIN
  await Notification.create({
    message: `🧑‍🦱 New donor registered: ${donor.name}`
  });

  res.redirect("/donor-login.html");
});

module.exports = router;
