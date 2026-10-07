const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema({
  name: String,
  age: Number,
  bloodGroup: String,
  contact: String,
  city: String,

  // ✅ ADD HERE
  lastDonationDate: {
    type: Date,
    default: null
  },

  // WhatsApp alerts: only donors who opted in are messaged
  whatsappOptIn: {
    type: Boolean,
    default: false
  },
  lastAlert: {
    requestId: String,
    at: Date
  }
});

module.exports = mongoose.model("Donor", donorSchema);
