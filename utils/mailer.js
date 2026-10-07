const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ihtisham11.com@gmail.com",
    pass: "huzzhqtpsfmarzzj"
  }
});

module.exports = transporter;
