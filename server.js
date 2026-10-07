const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
const notificationRoutes = require("./routes/notificationRoutes");
require("dotenv").config();

const donorRoutes = require("./routes/donorRoutes");
const requestRoutes = require("./routes/requestRoutes");
const Donor = require("./models/Donor");

const app = express(); // ✅ app MUST be initialized first

/* ================= MIDDLEWARE ================= */
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  bodyParser.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
); // rawBody is used to verify WhatsApp webhook signatures

app.use(
  session({
    secret: process.env.SESSION_SECRET || "bloodDonationSecret",
    resave: false,
    saveUninitialized: true,
  }),
);

/* ================= STATIC FILES ================= */
app.use(express.static(path.join(__dirname, "public")));

app.use("/notifications", notificationRoutes);

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

/* ================= ROUTES ================= */
app.use("/donors", donorRoutes);

app.use("/requests", requestRoutes);

app.use("/whatsapp", require("./routes/whatsappRoutes"));

/* ================= HOME PAGE ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ================= DONOR PROFILE API ================= */
app.get("/donor/me", async (req, res) => {
  if (!req.session.donor) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const donor = await Donor.findById(req.session.donor);

    if (!donor) {
      return res.status(404).json({ error: "Donor not found" });
    }

    res.json(donor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= ADMIN LOGIN ================= */
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin123") {
    req.session.admin = true;
    res.redirect("/admin.html");
  } else {
    res.send("Invalid Admin Credentials");
  }
});

/* ================= ADMIN LOGOUT ================= */
app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin-login.html");
  });
});

/* ================= DONOR LOGOUT ================= */
app.get("/donor/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/index.html");
  });
});

/* ================= SERVER ================= */

// Local development
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Vercel needs the Express app exported
module.exports = app;
