const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  patientName: String,
  bloodGroup: String,
  contact: String,
  email: String,

  city: String,
  email: { type: String }, // optional (WhatsApp requests may not have one)


  emergency: {
    type: Boolean,
    default: false
  },
  age: {
  type: Number,
  required: true
},


  status: {
    type: String,
    default: "Pending"
  },

  // where the request came from
  source: {
    type: String,
    default: "web"
  },
  whatsappFrom: String
  

}, { timestamps: true });

module.exports = mongoose.model("Request", requestSchema);
