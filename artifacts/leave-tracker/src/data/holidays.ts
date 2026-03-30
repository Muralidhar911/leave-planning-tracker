// DXC India 2026 Holiday data extracted from the official holiday calendar
// Structure: national holidays + state-specific holidays + weekend holidays

export type HolidayCategory = "national" | "state" | "weekend";

export const LOCATIONS = [
  "Bengaluru",
  "Chennai",
  "Hyderabad",
  "Indore",
  "Mumbai/Pune",
  "Noida",
  "Gurugram",
  "Kolkata",
] as const;

export type Location = (typeof LOCATIONS)[number];

export interface Holiday {
  id: string;
  date: string;         // ISO format: "2026-01-26"
  day: string;
  name: string;
  category: HolidayCategory;
  locations: Location[]; // empty = all locations
}

// Helper: all locations
const ALL = [...LOCATIONS] as Location[];

export const HOLIDAYS_2026: Holiday[] = [
  // ─── NATIONAL HOLIDAYS (Section A) ───────────────────────────────────────
  {
    id: "n1",
    date: "2026-01-26",
    day: "Monday",
    name: "Republic Day",
    category: "national",
    locations: ALL,
  },
  {
    id: "n2",
    date: "2026-10-02",
    day: "Friday",
    name: "Gandhi Jayanti",
    category: "national",
    locations: ALL,
  },

  // ─── STATE-SPECIFIC HOLIDAYS (Section B) ─────────────────────────────────
  {
    id: "s1",
    date: "2026-01-01",
    day: "Thursday",
    name: "New Year",
    category: "state",
    locations: ["Bengaluru", "Chennai"],
  },
  {
    id: "s2",
    date: "2026-01-15",
    day: "Thursday",
    name: "Makar Sankranti / Pongal / Bihu",
    category: "state",
    locations: ["Chennai", "Hyderabad"],
  },
  {
    id: "s3",
    date: "2026-03-03",
    day: "Tuesday",
    name: "Dolyatra",
    category: "state",
    locations: ["Kolkata"],
  },
  {
    id: "s4",
    date: "2026-03-04",
    day: "Wednesday",
    name: "Holi",
    category: "state",
    locations: ["Indore", "Mumbai/Pune", "Noida", "Gurugram"],
  },
  {
    id: "s5",
    date: "2026-03-19",
    day: "Thursday",
    name: "Ugadi / Gudi Padwa / Cheti Chand",
    category: "state",
    locations: ["Bengaluru", "Hyderabad"],
  },
  {
    id: "s6",
    date: "2026-03-26",
    day: "Thursday",
    name: "Ram Navami",
    category: "state",
    locations: [],
  },
  {
    id: "s7",
    date: "2026-03-31",
    day: "Tuesday",
    name: "Mahavir Jayanti",
    category: "state",
    locations: [],
  },
  {
    id: "s8",
    date: "2026-04-03",
    day: "Friday",
    name: "Good Friday",
    category: "state",
    locations: [],
  },
  {
    id: "s9",
    date: "2026-04-14",
    day: "Tuesday",
    name: "Tamil New Year / Vishu",
    category: "state",
    locations: ["Chennai"],
  },
  {
    id: "s10",
    date: "2026-04-15",
    day: "Wednesday",
    name: "Bengali New Year",
    category: "state",
    locations: ["Kolkata"],
  },
  {
    id: "s11",
    date: "2026-05-01",
    day: "Friday",
    name: "May Day / Maharashtra Day / Buddha Purnima",
    category: "state",
    locations: ALL,
  },
  {
    id: "s12",
    date: "2026-05-27",
    day: "Wednesday",
    name: "Id-ul-Zuha (Bakrid)",
    category: "state",
    locations: ["Chennai", "Hyderabad", "Indore", "Mumbai/Pune", "Noida", "Gurugram", "Kolkata"],
  },
  {
    id: "s13",
    date: "2026-06-26",
    day: "Friday",
    name: "Muharram",
    category: "state",
    locations: [],
  },
  {
    id: "s14",
    date: "2026-08-26",
    day: "Wednesday",
    name: "Onam / Id-E-Milad",
    category: "state",
    locations: [],
  },
  {
    id: "s15",
    date: "2026-08-28",
    day: "Friday",
    name: "Rakshabandhan",
    category: "state",
    locations: ["Indore", "Noida", "Gurugram"],
  },
  {
    id: "s16",
    date: "2026-09-14",
    day: "Monday",
    name: "Ganesh Chaturthi",
    category: "state",
    locations: ["Bengaluru", "Hyderabad"],
  },
  {
    id: "s17",
    date: "2026-09-18",
    day: "Friday",
    name: "Janmashtami",
    category: "state",
    locations: ["Noida", "Gurugram"],
  },
  {
    id: "s18",
    date: "2026-10-19",
    day: "Monday",
    name: "Ashtami / Maha Navami / Ayudha Pooja",
    category: "state",
    locations: ["Chennai", "Kolkata"],
  },
  {
    id: "s19",
    date: "2026-10-20",
    day: "Tuesday",
    name: "Dussehra",
    category: "state",
    locations: ["Bengaluru", "Hyderabad", "Indore", "Mumbai/Pune", "Noida", "Gurugram", "Kolkata"],
  },
  {
    id: "s20",
    date: "2026-11-09",
    day: "Monday",
    name: "Govardhan Puja",
    category: "state",
    locations: [],
  },
  {
    id: "s21",
    date: "2026-11-11",
    day: "Wednesday",
    name: "Bhai Dooj",
    category: "state",
    locations: [],
  },
  {
    id: "s22",
    date: "2026-11-24",
    day: "Tuesday",
    name: "Guru Nanak Jayanti",
    category: "state",
    locations: [],
  },
  {
    id: "s23",
    date: "2026-12-25",
    day: "Friday",
    name: "Christmas",
    category: "state",
    locations: ALL,
  },

  // ─── WEEKEND HOLIDAYS ────────────────────────────────────────────────────
  {
    id: "w1",
    date: "2026-02-15",
    day: "Sunday",
    name: "Maha Shivaratri",
    category: "weekend",
    locations: ALL,
  },
  {
    id: "w2",
    date: "2026-03-21",
    day: "Saturday",
    name: "Id-ul-Fitr",
    category: "weekend",
    locations: ALL,
  },
  {
    id: "w3",
    date: "2026-08-15",
    day: "Saturday",
    name: "Independence Day / Parsi New Year's",
    category: "weekend",
    locations: ALL,
  },
  {
    id: "w4",
    date: "2026-11-01",
    day: "Sunday",
    name: "Karnataka Rajyotsav",
    category: "weekend",
    locations: ALL,
  },
  {
    id: "w5",
    date: "2026-11-08",
    day: "Sunday",
    name: "Diwali / Naraka Chaturdashi",
    category: "weekend",
    locations: ALL,
  },
];

// Sorted by date
export const sortedHolidays = [...HOLIDAYS_2026].sort(
  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
);
