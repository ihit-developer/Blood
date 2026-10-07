export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/* Same compatibility rules the original request page used: who can give to a patient. */
export const CAN_RECEIVE_FROM = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "AB-": ["A-", "B-", "AB-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
};

export const CAN_GIVE_TO = Object.fromEntries(
  BLOOD_GROUPS.map((g) => [g, BLOOD_GROUPS.filter((r) => CAN_RECEIVE_FROM[r].includes(g))])
);

export const CITIES = [
  "Peshawar",
  "Islamabad",
  "Rawalpindi",
  "Lahore",
  "Karachi",
  "Quetta",
  "Multan",
  "Faisalabad",
];

export const DONATION_GAP_DAYS = 90;

/* Display helpers. Values stored in MongoDB keep the plain "-" (e.g. "O-"). */
export const fmtGroup = (g = "") => g.replace("-", "\u2212");
export const groupFamily = (g = "") => g.replace(/[+-]/, "") || "O";
