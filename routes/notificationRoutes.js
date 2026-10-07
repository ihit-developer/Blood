const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

/* GET ALL NOTIFICATIONS */
router.get("/", async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 });
  res.json(notifications);
});

/* COUNT UNREAD */
router.get("/count", async (req, res) => {
  const count = await Notification.countDocuments({ read: false });
  res.json({ count });
});

/* MARK ALL READ */
router.post("/read", async (req, res) => {
  await Notification.updateMany({ read: false }, { read: true });
  res.json({ success: true });
});

module.exports = router;
