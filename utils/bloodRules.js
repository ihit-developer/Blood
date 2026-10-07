const GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/* Which donor groups a patient can receive from (same rules as the website). */
const CAN_RECEIVE_FROM = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "AB-": ["A-", "B-", "AB-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
};

const GAP_DAYS = 90;

function isEligible(donor) {
  if (!donor.lastDonationDate) return true;
  return (Date.now() - new Date(donor.lastDonationDate).getTime()) / 86400000 >= GAP_DAYS;
}

module.exports = { GROUPS, CAN_RECEIVE_FROM, GAP_DAYS, isEligible };
