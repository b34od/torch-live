function timeToMinutes(value) {
  const [hourRaw = "0", minuteRaw = "0"] = String(value || "00:00").split(":");
  const hour = Number.parseInt(hourRaw, 10);
  const minute = Number.parseInt(minuteRaw, 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function withDurations(blocks, defaultDuration = 45) {
  return blocks.map((block, index) => {
    const startMinutes = timeToMinutes(block.start_time);
    const nextMinutes =
      index < blocks.length - 1 ? timeToMinutes(blocks[index + 1].start_time) : null;
    const derivedDuration =
      Number.isFinite(startMinutes) &&
      Number.isFinite(nextMinutes) &&
      nextMinutes > startMinutes
        ? nextMinutes - startMinutes
        : defaultDuration;

    return {
      start_time: block.start_time,
      duration_minutes: Math.max(derivedDuration, 5),
      activity_name: block.activity_name,
      location: block.location || "TBD",
      notes: block.notes || null,
    };
  });
}

function cloneBlocks(blocks) {
  return blocks.map((block) => ({ ...block }));
}

function withDaySortOrder(rows) {
  const dayCounters = new Map();
  return rows.map((row) => {
    const day = Number(row.day_number || 0);
    const nextValue = (dayCounters.get(day) || 0) + 1;
    dayCounters.set(day, nextValue);
    return {
      ...row,
      sort_order: nextValue,
    };
  });
}

const LEGACY_2025_STUDENT_DAYS = {
  1: withDurations([
    { start_time: "09:00", activity_name: "Registration & Icebreakers", location: "Housing 2 & Outside" },
    { start_time: "09:45", activity_name: "Welcome to TORCH", location: "Campus Center Theatre" },
    { start_time: "10:40", activity_name: "Team Meeting 1", location: "Classrooms" },
    {
      start_time: "11:35",
      activity_name: "Community Guidelines & Hall Meeting",
      location: "Campus Center Theatre",
    },
    { start_time: "12:30", activity_name: "Lunch w/ Team", location: "Dining Hall" },
    { start_time: "13:30", activity_name: "Team Meeting 2", location: "Classrooms" },
    { start_time: "14:00", activity_name: "Guild Meeting 1", location: "Classrooms" },
    { start_time: "15:00", activity_name: "Trust 1", location: "Outside" },
    { start_time: "15:50", activity_name: "Orientation", location: "Campus Center Theatre" },
    { start_time: "16:20", activity_name: "Senior Counselor Challenge", location: "Outside" },
    { start_time: "17:30", activity_name: "Dinner w/ Guild", location: "Dining Hall" },
    { start_time: "18:30", activity_name: "Connection 1", location: "Event Room A" },
    { start_time: "19:10", activity_name: "The Power of Leadership", location: "Campus Center Theatre" },
    { start_time: "20:20", activity_name: "Team Meeting 3", location: "Campus Center Theatre" },
    { start_time: "21:05", activity_name: "What is a Leader?", location: "Campus Center Theatre" },
    { start_time: "21:45", activity_name: "Free Time", location: "Housing 2" },
    { start_time: "23:00", activity_name: "Lights Out", location: "Housing 2", notes: "Hydrate, relax, and sleep." },
  ]),
  2: withDurations([
    { start_time: "07:45", activity_name: "Wake Up Call", location: "Housing 2" },
    { start_time: "08:30", activity_name: "Breakfast w/ Friends", location: "Dining Hall" },
    { start_time: "09:15", activity_name: "Believe", location: "Campus Center Theatre" },
    { start_time: "11:50", activity_name: "Lunch / Team Mtg 4", location: "Event Room A" },
    { start_time: "12:35", activity_name: "Color Outside the Lines", location: "Campus Center Theatre" },
    { start_time: "13:35", activity_name: "Connection 2", location: "Outside" },
    { start_time: "14:20", activity_name: "International Leadership", location: "Campus Center Theatre" },
    { start_time: "17:30", activity_name: "Dinner w/ Guild", location: "Dining Hall" },
    { start_time: "18:30", activity_name: "Guild Meeting 2", location: "Classrooms" },
    { start_time: "19:00", activity_name: "Debrief", location: "Event Room A" },
    { start_time: "19:30", activity_name: "Goal Mining", location: "Event Room A" },
    { start_time: "20:00", activity_name: "Impact", location: "Coffee House" },
    { start_time: "21:00", activity_name: "Movie Night", location: "Campus Center Theatre" },
    { start_time: "23:55", activity_name: "Lights Out", location: "Housing 2", notes: "Hydrate, relax, and sleep." },
  ]),
  3: withDurations([
    { start_time: "07:45", activity_name: "Wake Up Call", location: "Housing 2" },
    { start_time: "08:30", activity_name: "Breakfast w/ Friends", location: "Dining Hall" },
    { start_time: "09:15", activity_name: "Group Photos + Trust 2", location: "Outside" },
    { start_time: "10:30", activity_name: "Presence", location: "Campus Center Theatre" },
    { start_time: "10:55", activity_name: "Connection 3", location: "Campus Center Theatre" },
    { start_time: "11:40", activity_name: "Team Meeting 5", location: "Classrooms" },
    { start_time: "12:20", activity_name: "Follies Rehearsal", location: "Campus Center Theatre" },
    { start_time: "12:45", activity_name: "Lunch w/ Team", location: "Dining Hall" },
    { start_time: "13:30", activity_name: "A Mile in Their Shoes", location: "Campus Center Theatre" },
    { start_time: "13:50", activity_name: "The Whole Earth Game", location: "Event Room A" },
    { start_time: "17:20", activity_name: "Dinner w/ Guild", location: "Dining Hall" },
    { start_time: "18:25", activity_name: "Guild Meeting 3", location: "Classrooms" },
    { start_time: "18:55", activity_name: "Follies Rehearsal", location: "Campus Center Theatre" },
    { start_time: "19:40", activity_name: "The TORCH Follies", location: "Campus Center Theatre" },
    { start_time: "20:35", activity_name: "Fireside Chat", location: "Campus Center Theatre" },
    { start_time: "21:00", activity_name: "Pass the TORCH", location: "Outside" },
    { start_time: "22:00", activity_name: "Free Time", location: "Housing 2" },
    { start_time: "23:00", activity_name: "Lights Out", location: "Housing 2", notes: "Hydrate, relax, and sleep." },
  ]),
  4: withDurations([
    { start_time: "07:45", activity_name: "Wake Up Call & Pack Up", location: "Housing 2" },
    { start_time: "08:30", activity_name: "Breakfast w/ Friends", location: "Dining Hall" },
    { start_time: "09:20", activity_name: "Guild Meeting 4", location: "Classrooms" },
    { start_time: "10:05", activity_name: "Team Meeting 6", location: "Classrooms" },
    { start_time: "11:20", activity_name: "Trust 3", location: "Outside" },
    { start_time: "12:30", activity_name: "Lunch w/ Team", location: "Dining Hall" },
    { start_time: "13:15", activity_name: "Team Meeting 7", location: "Classrooms" },
    { start_time: "14:05", activity_name: "TORCH Wrap Up", location: "Campus Center Theatre" },
    { start_time: "15:30", activity_name: "Dress, Pack & Checkout", location: "Housing 2" },
    { start_time: "16:15", activity_name: "Nonprofit Expo", location: "Event Room A" },
    { start_time: "17:15", activity_name: "Closing Ceremony", location: "Event Room A" },
    { start_time: "18:15", activity_name: "Certificates & Departures", location: "Campus Center Lobby" },
  ]),
};

const LEGACY_2025_STAFF_DAY_ZERO = withDurations([
  { start_time: "08:00", activity_name: "Staff Move-In & Arrival", location: "Housing 2" },
  { start_time: "10:00", activity_name: "Operations Setup", location: "Campus Center Theatre" },
  { start_time: "13:00", activity_name: "Staff Training & Walkthrough", location: "Campus Center Theatre" },
  { start_time: "15:00", activity_name: "Final Program Prep", location: "Classrooms" },
  { start_time: "18:00", activity_name: "Staff Dinner & Briefing", location: "Dining Hall" },
]);

const DRAFT_2026_STUDENT_DAYS = {
  1: withDurations([
    { start_time: "09:00", activity_name: "Student Registration & Ice Breakers", location: "Housing 2 & Outside" },
    { start_time: "09:45", activity_name: "TORCH Survey", location: "Campus Center Theatre" },
    { start_time: "09:50", activity_name: "Welcome to TORCH", location: "Campus Center Theatre" },
    { start_time: "10:20", activity_name: "TORCH Rules", location: "Campus Center Theatre" },
    { start_time: "10:35", activity_name: "Team Meeting 1 - Egg Drop", location: "Classrooms" },
    { start_time: "11:35", activity_name: "Community Guidelines", location: "Campus Center Theatre" },
    { start_time: "11:50", activity_name: "Hall Meeting", location: "Campus Center Theatre" },
    { start_time: "12:30", activity_name: "Lunch (Teams)", location: "Dining Hall" },
    { start_time: "13:15", activity_name: "Team Meeting 2 - Pick Guilds", location: "Classrooms" },
    { start_time: "14:00", activity_name: "Trust Part I", location: "Outside" },
    { start_time: "14:50", activity_name: "Orientation", location: "Campus Center Theatre" },
    { start_time: "15:20", activity_name: "Group Challenge (Puzzled)", location: "Outside" },
    { start_time: "16:40", activity_name: "Group Challenge Debrief", location: "Event Room A" },
    { start_time: "16:50", activity_name: "Connection 1", location: "Event Room A" },
    { start_time: "17:20", activity_name: "Guild Meeting 1", location: "Classrooms" },
    { start_time: "18:10", activity_name: "Dinner (Guilds)", location: "Dining Hall" },
    { start_time: "19:00", activity_name: "The Power of Leadership / What is a Leader?", location: "Campus Center Theatre" },
    { start_time: "20:10", activity_name: "Team Meeting 3 - Paper Superheroes", location: "Campus Center Theatre" },
    { start_time: "20:55", activity_name: "What is a Leader?", location: "Campus Center Theatre" },
    { start_time: "21:40", activity_name: "Bonfire / Social", location: "Event Room A" },
    { start_time: "22:40", activity_name: "Lights Out", location: "Housing 2" },
  ]),
  2: withDurations([
    { start_time: "07:45", activity_name: "Wake-Up Call", location: "Housing 2" },
    { start_time: "08:30", activity_name: "Breakfast w/ Friends", location: "Dining Hall" },
    { start_time: "09:15", activity_name: "Believe", location: "Campus Center Theatre" },
    { start_time: "10:20", activity_name: "Board Breaking", location: "Outside" },
    { start_time: "11:50", activity_name: "Lunch & Team Meeting 4 Debrief", location: "Event Room A" },
    { start_time: "12:35", activity_name: "Color Outside the Lines", location: "Campus Center Theatre" },
    { start_time: "13:35", activity_name: "Connection 2 - Identity on the GO", location: "Outside" },
    { start_time: "14:20", activity_name: "International Leadership", location: "Campus Center Theatre" },
    { start_time: "14:30", activity_name: "Adventure Course Brief", location: "Campus Center Theatre" },
    { start_time: "14:45", activity_name: "Adventure Course", location: "Outside" },
    { start_time: "17:30", activity_name: "Dinner (Guilds)", location: "Dining Hall" },
    { start_time: "18:15", activity_name: "Guild Meeting 2", location: "Classrooms" },
    { start_time: "19:00", activity_name: "Adventure Course Debrief", location: "Event Room A" },
    { start_time: "19:15", activity_name: "Believe Debrief & Goal Mining", location: "Event Room A" },
    { start_time: "20:00", activity_name: "Impact", location: "Coffee House" },
    { start_time: "21:05", activity_name: "Movie Night", location: "Campus Center Theatre" },
    { start_time: "23:55", activity_name: "Lights Out", location: "Housing 2" },
  ]),
  3: withDurations([
    { start_time: "07:45", activity_name: "Wake-Up Call", location: "Housing 2" },
    { start_time: "08:30", activity_name: "Breakfast w/ Friends", location: "Dining Hall" },
    { start_time: "09:15", activity_name: "Team Photos & Leader Group Photo", location: "Outside" },
    { start_time: "09:30", activity_name: "Trust Exercises (2)", location: "Outside" },
    { start_time: "10:30", activity_name: "Presence - Guided Meditation", location: "Campus Center Theatre" },
    { start_time: "10:45", activity_name: "Connection 3 - CRUMPLED PAPER", location: "Campus Center Theatre" },
    { start_time: "11:35", activity_name: "Guild Meeting 3", location: "Classrooms" },
    { start_time: "12:10", activity_name: "Team Meeting 5 - Lead Freestyle", location: "Classrooms" },
    { start_time: "12:55", activity_name: "Lunch / Team Meeting 5", location: "Dining Hall" },
    { start_time: "13:40", activity_name: "A Mile in Their Shoes", location: "Campus Center Theatre" },
    { start_time: "14:00", activity_name: "Whole Earth Game", location: "Event Room A" },
    { start_time: "17:00", activity_name: "Chips, Debrief, Circle of Life", location: "Event Room A" },
    { start_time: "17:30", activity_name: "Follies Rehearsal / Dinner", location: "Outside" },
    { start_time: "18:15", activity_name: "Follies Rehearsal / Dinner", location: "Dining Hall" },
    { start_time: "19:00", activity_name: "Follies", location: "Campus Center Theatre" },
    { start_time: "20:00", activity_name: "TORCH Fireside Chat", location: "Campus Center Theatre" },
    { start_time: "20:30", activity_name: "Candle Ceremony", location: "Outdoor Amphitheatre" },
    { start_time: "21:20", activity_name: "Dance", location: "TRLC" },
    { start_time: "22:20", activity_name: "Lights Out", location: "Housing 2" },
  ]),
  4: withDurations([
    { start_time: "07:55", activity_name: "Wake-Up Call (students pack up)", location: "Housing 2" },
    { start_time: "08:30", activity_name: "Breakfast w/ Friends", location: "Dining Hall" },
    { start_time: "09:20", activity_name: "Team Meeting 6 (Letters to Self / Thank Yous)", location: "Classrooms" },
    { start_time: "10:35", activity_name: "Trust", location: "Outside" },
    { start_time: "11:45", activity_name: "Escape to Disorientation", location: "Classrooms" },
    { start_time: "12:15", activity_name: "Disorientation", location: "Outside" },
    { start_time: "12:35", activity_name: "Guild Meeting 4", location: "Classrooms" },
    { start_time: "13:15", activity_name: "Lunch (Teams)", location: "Dining Hall" },
    { start_time: "13:55", activity_name: "Gratitude - Connection 4", location: "Campus Center Theatre" },
    { start_time: "14:35", activity_name: "Heart to Heart", location: "Campus Center Theatre" },
    { start_time: "15:05", activity_name: "Team Final Debrief / Circle of Life", location: "Campus Center Theatre" },
    { start_time: "15:30", activity_name: "Full Check Out / Parents Arrive", location: "Housing 2" },
    { start_time: "16:10", activity_name: "Nonprofit & Community Partner Expo", location: "Event Room A" },
    { start_time: "17:10", activity_name: "Closing Ceremony", location: "Event Room A" },
    { start_time: "18:10", activity_name: "Certificates / Final Team Photo", location: "Outside" },
  ]),
};

const DRAFT_2026_STAFF_DAY_ZERO = withDurations([
  { start_time: "08:00", activity_name: "Staff Move-In", location: "Housing 2" },
  { start_time: "10:00", activity_name: "Operations Setup", location: "Campus Center Theatre" },
  { start_time: "13:00", activity_name: "Staff Training & Walkthrough", location: "Campus Center Theatre" },
  { start_time: "15:00", activity_name: "Program Materials & Site Prep", location: "Classrooms" },
  { start_time: "18:00", activity_name: "Staff Dinner & Final Briefing", location: "Dining Hall" },
]);

const DRAFT_2026_STAFF_DAYS = {
  1: withDurations([
    { start_time: "08:00", activity_name: "Staff Meeting", location: "Staff Lounge" },
    { start_time: "08:15", activity_name: "Registration Set-Up", location: "Housing 2 & Outside" },
    { start_time: "09:00", activity_name: "Student Registration + Ice Breakers", location: "Housing 2 & Outside" },
    { start_time: "09:45", activity_name: "TORCH Survey", location: "Campus Center Theatre" },
    {
      start_time: "09:50",
      activity_name: "Welcome to TORCH (Intros, Games, etc.)",
      location: "Campus Center Theatre",
    },
    { start_time: "10:20", activity_name: "TORCH Rules", location: "Campus Center Theatre" },
    { start_time: "10:30", activity_name: "Walking Buffer", location: "Transit / Walking Buffer" },
    { start_time: "10:35", activity_name: "Team Meeting 1 (Build Egg Drop Egg)", location: "Classrooms" },
    { start_time: "11:35", activity_name: "Community Guidelines", location: "Campus Center Theatre" },
    { start_time: "11:50", activity_name: "Hall Meeting", location: "Campus Center Theatre" },
    { start_time: "12:30", activity_name: "Split: Lunch (Teams)", location: "Dining Hall" },
    { start_time: "13:15", activity_name: "Split: Team Meeting 2 (Pick Guilds)", location: "Classrooms" },
    { start_time: "14:00", activity_name: "Trust: Part I", location: "Outside – Behind Arts & Sciences" },
    { start_time: "14:50", activity_name: "Orientation", location: "Campus Center Theatre" },
    { start_time: "15:20", activity_name: "Group Challenge (Puzzled)", location: "Outside – Behind Arts & Sciences" },
    { start_time: "16:40", activity_name: "Group Challenge Debrief", location: "Event Room A" },
    { start_time: "16:50", activity_name: "Connection 1", location: "Event Room A" },
    { start_time: "17:20", activity_name: "Split: Guild Meeting 1", location: "Classrooms" },
    { start_time: "18:10", activity_name: "Split: Dinner (Guilds)", location: "Dining Hall" },
    {
      start_time: "19:00",
      activity_name: "The Power of Leadership / What Is a Leader?",
      location: "Campus Center Theatre",
    },
    {
      start_time: "20:10",
      activity_name: "Team Meeting 3 (Paper Superheroes)",
      location: "Campus Center Theatre",
    },
    { start_time: "20:55", activity_name: "What Is a Leader?", location: "Campus Center Theatre" },
    { start_time: "21:25", activity_name: "SrC Break", location: "Campus Center Theatre" },
    { start_time: "21:35", activity_name: "Walking Buffer", location: "Transit / Walking Buffer" },
    { start_time: "21:40", activity_name: "Bonfire / Social", location: "Event Room A" },
    { start_time: "22:40", activity_name: "Lights Out", location: "Housing 2" },
    { start_time: "22:50", activity_name: "Staff Meeting", location: "Staff Lounge" },
  ]),
  2: withDurations([
    { start_time: "07:45", activity_name: "Wake-Up Call", location: "Housing 2" },
    { start_time: "08:00", activity_name: "Optional Yoga", location: "Outside – Quad" },
    { start_time: "08:25", activity_name: "Walking Buffer", location: "Transit / Walking Buffer" },
    { start_time: "08:30", activity_name: "Breakfast w/ Friends", location: "Dining Hall" },
    { start_time: "09:15", activity_name: "Believe", location: "Campus Center Theatre" },
    { start_time: "10:20", activity_name: "Board Breaking", location: "Outside – Behind Arts & Sciences" },
    {
      start_time: "11:50",
      activity_name: "Catered Lunch + Team Meeting 4 Debrief",
      location: "Event Room A",
    },
    { start_time: "12:35", activity_name: "Color Outside the Lines", location: "Campus Center Theatre" },
    {
      start_time: "13:35",
      activity_name: "Connection 2 - Identity on the GO",
      location: "Outside",
    },
    { start_time: "14:20", activity_name: "International Leadership", location: "Campus Center Theatre" },
    { start_time: "14:30", activity_name: "Brief for Adventure Course", location: "Campus Center Theatre" },
    { start_time: "14:45", activity_name: "Adventure Course", location: "Outside – Behind Arts & Sciences" },
    { start_time: "17:30", activity_name: "Split: Dinner (Guilds)", location: "Dining Hall" },
    { start_time: "18:15", activity_name: "Split: Guild Meeting 2", location: "Classrooms" },
    { start_time: "19:00", activity_name: "Adventure Course Debrief", location: "Event Room A" },
    { start_time: "19:15", activity_name: "Believe Debrief + Goal Mining", location: "Event Room A" },
    { start_time: "20:00", activity_name: "Impact", location: "Coffee House" },
    { start_time: "21:00", activity_name: "SrC Break 2", location: "Campus Center Theatre" },
    { start_time: "21:05", activity_name: "Movie Night", location: "Campus Center Theatre" },
    { start_time: "23:55", activity_name: "Walking Buffer", location: "Transit / Walking Buffer" },
    { start_time: "23:59", activity_name: "Lights Out + Staff Meeting", location: "Staff Lounge" },
  ]),
  3: withDurations([
    { start_time: "07:45", activity_name: "Wake-Up Call", location: "Housing 2" },
    { start_time: "08:25", activity_name: "Walking Buffer", location: "Transit / Walking Buffer" },
    { start_time: "08:30", activity_name: "Breakfast w/ Friends", location: "Dining Hall" },
    {
      start_time: "09:15",
      activity_name: "Team Photos + Leader Group Photo",
      location: "Outside – Behind N-Wing",
    },
    { start_time: "09:30", activity_name: "Trust Exercises (2)", location: "Outside – Behind N-Wing" },
    { start_time: "10:30", activity_name: "Presence - Guided Meditation", location: "Campus Center Theatre" },
    { start_time: "10:45", activity_name: "Connection 3 - CRUMPLED PAPER", location: "Campus Center Theatre" },
    { start_time: "11:30", activity_name: "SrC Break 3", location: "Campus Center Theatre" },
    { start_time: "11:35", activity_name: "Guild Meeting 3", location: "Classrooms" },
    { start_time: "12:10", activity_name: "Split: Team Meeting 5 - Lead Freestyle", location: "Classrooms" },
    { start_time: "12:55", activity_name: "Split: Lunch / Team Meeting 5", location: "Dining Hall" },
    { start_time: "13:40", activity_name: "A Mile in Their Shoes", location: "Campus Center Theatre" },
    { start_time: "14:00", activity_name: "Whole Earth Game", location: "Event Room A" },
    { start_time: "17:00", activity_name: "Chips, Debrief, Circle of Life", location: "Event Room A" },
    { start_time: "17:30", activity_name: "Split: Follies Rehearsal / Dinner", location: "Outside" },
    { start_time: "18:15", activity_name: "Split: Follies Rehearsal / Dinner", location: "Dining Hall" },
    { start_time: "19:00", activity_name: "Follies", location: "Campus Center Theatre" },
    { start_time: "20:00", activity_name: "TORCH Fireside Chat", location: "Campus Center Theatre" },
    {
      start_time: "20:30",
      activity_name: "Candle Ceremony - Congratulations",
      location: "Outdoor Amphitheatre",
    },
    { start_time: "21:15", activity_name: "Walking Buffer", location: "Transit / Walking Buffer" },
    { start_time: "21:20", activity_name: "Dance", location: "TRLC" },
    { start_time: "22:20", activity_name: "Lights Out + Staff Meeting", location: "Staff Lounge" },
  ]),
  4: withDurations([
    { start_time: "07:55", activity_name: "Wake-Up Call (Students Pack Up)", location: "Housing 2" },
    { start_time: "08:25", activity_name: "Walking Buffer", location: "Transit / Walking Buffer" },
    { start_time: "08:30", activity_name: "Breakfast w/ Friends", location: "Dining Hall" },
    {
      start_time: "09:20",
      activity_name: "Team Meeting 6 (Letters to Self / Survey / Thank Yous)",
      location: "Classrooms",
    },
    { start_time: "10:35", activity_name: "Trust", location: "Outside – Behind Arts & Sciences" },
    { start_time: "11:45", activity_name: "Escape to Disorientation", location: "Classrooms" },
    { start_time: "12:15", activity_name: "Disorientation", location: "Transit / Walking Buffer" },
    { start_time: "12:25", activity_name: "Disorientation (Outside)", location: "Outside" },
    { start_time: "12:35", activity_name: "Split: Guild Meeting 4", location: "Classrooms" },
    { start_time: "13:15", activity_name: "Split: Lunch (Teams)", location: "Dining Hall" },
    { start_time: "13:55", activity_name: "Gratitude - Connection 4", location: "Campus Center Theatre" },
    { start_time: "14:35", activity_name: "Heart to Heart", location: "Campus Center Theatre" },
    { start_time: "15:05", activity_name: "Team Final Debrief / Circle of Life", location: "Campus Center Theatre" },
    { start_time: "15:30", activity_name: "Full Check Out + Parents Arrive", location: "Housing 2" },
    { start_time: "16:10", activity_name: "Nonprofit + Community Partner Expo", location: "Event Room A" },
    { start_time: "17:10", activity_name: "Closing Ceremony", location: "Event Room A" },
    { start_time: "18:10", activity_name: "Certificates + Final Team Photo", location: "Campus Center Lobby" },
    { start_time: "18:20", activity_name: "Final Staff Regroup (Photo)", location: "Campus Center Lobby" },
    { start_time: "18:30", activity_name: "Advisor Check Out", location: "Campus Center Lobby" },
  ]),
};

const DRAFT_SOURCES = {
  draft_2026: {
    label: "2026 Draft (from attached main schedule PDF)",
    studentDays: DRAFT_2026_STUDENT_DAYS,
    staffDayZero: DRAFT_2026_STAFF_DAY_ZERO,
    staffDays: DRAFT_2026_STAFF_DAYS,
  },
  legacy_2025: {
    label: "2025 Baseline (legacy visual schedule)",
    studentDays: LEGACY_2025_STUDENT_DAYS,
    staffDayZero: LEGACY_2025_STAFF_DAY_ZERO,
  },
};

export function getScheduleDraftSourceOptions() {
  return Object.entries(DRAFT_SOURCES).map(([value, config]) => ({
    value,
    label: config.label,
  }));
}

export function getScheduleDraftSourceLabel(sourceKey) {
  return DRAFT_SOURCES[sourceKey]?.label || DRAFT_SOURCES.draft_2026.label;
}

export function normalizeScheduleDraftSource(sourceKey) {
  const normalized = String(sourceKey || "").trim();
  return Object.prototype.hasOwnProperty.call(DRAFT_SOURCES, normalized)
    ? normalized
    : "draft_2026";
}

function buildRowsFromSource(track, year, updatedBy, sourceKey) {
  const normalizedTrack = track === "staff" ? "staff" : "student";
  const normalizedYear = Number.parseInt(String(year || ""), 10);
  const programYear = Number.isFinite(normalizedYear) ? normalizedYear : 2026;
  const source = DRAFT_SOURCES[normalizeScheduleDraftSource(sourceKey)];
  const drafts = [];

  if (normalizedTrack === "staff") {
    cloneBlocks(source.staffDayZero || []).forEach((block) => {
      drafts.push({
        program_year: programYear,
        day_number: 0,
        start_time: block.start_time,
        duration_minutes: block.duration_minutes,
        activity_name: block.activity_name,
        location: block.location,
        rain_location: "N/A",
        point_person: null,
        secondary_person: null,
        notes: block.notes || null,
        av_needs: null,
        updated_by: updatedBy,
      });
    });
  }

  [1, 2, 3, 4].forEach((dayNumber) => {
    const sourceDays =
      normalizedTrack === "staff" && source.staffDays ? source.staffDays : source.studentDays;
    const blocks = cloneBlocks(sourceDays[dayNumber] || []);
    blocks.forEach((block) => {
      if (normalizedTrack === "staff") {
        drafts.push({
          program_year: programYear,
          day_number: dayNumber,
          start_time: block.start_time,
          duration_minutes: block.duration_minutes,
          activity_name: block.activity_name,
          location: block.location,
          rain_location: block.location === "Outside" ? "Event Room A" : "N/A",
          point_person: null,
          secondary_person: null,
          notes: block.notes || null,
          av_needs: null,
          updated_by: updatedBy,
        });
      } else {
        drafts.push({
          program_year: programYear,
          day_number: dayNumber,
          start_time: block.start_time,
          duration_minutes: block.duration_minutes,
          activity_name: block.activity_name,
          location: block.location,
          updated_by: updatedBy,
        });
      }
    });
  });

  drafts.sort((a, b) => {
    if (a.day_number !== b.day_number) return a.day_number - b.day_number;
    const aStart = timeToMinutes(a.start_time) || 0;
    const bStart = timeToMinutes(b.start_time) || 0;
    if (aStart !== bStart) return aStart - bStart;
    return 0;
  });

  return withDaySortOrder(drafts);
}

export function getScheduleDraftRows(track, year, updatedBy, sourceKey = "draft_2026") {
  return buildRowsFromSource(track, year, updatedBy, sourceKey);
}

export function getScheduleDraftCounts(year, sourceKey = "draft_2026") {
  const student = getScheduleDraftRows("student", year, "preview", sourceKey).length;
  const staff = getScheduleDraftRows("staff", year, "preview", sourceKey).length;
  return {
    student,
    staff,
    total: student + staff,
  };
}

function minutesToTimeLabel(value) {
  const minutes = Math.max(Number(value) || 0, 0);
  const dayOffset = Math.floor(minutes / (24 * 60));
  const normalized = minutes % (24 * 60);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const label = `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
  return dayOffset > 0 ? `${label} (+${dayOffset}d)` : label;
}

export function getScheduleDraftDaySummaries(track, year, sourceKey = "draft_2026") {
  const rows = getScheduleDraftRows(track, year, "preview", sourceKey);
  const grouped = new Map();

  rows.forEach((row) => {
    const day = Number(row.day_number || 0);
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day).push(row);
  });

  return [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([dayNumber, dayRows]) => {
      const starts = dayRows
        .map((row) => timeToMinutes(row.start_time))
        .filter((value) => Number.isFinite(value));
      const ends = dayRows
        .map((row) => {
          const start = timeToMinutes(row.start_time);
          const duration = Number(row.duration_minutes || 0);
          if (!Number.isFinite(start)) return null;
          return start + duration;
        })
        .filter((value) => Number.isFinite(value));

      const firstStart = starts.length ? Math.min(...starts) : null;
      const lastEnd = ends.length ? Math.max(...ends) : null;

      return {
        dayNumber,
        count: dayRows.length,
        firstStartLabel: Number.isFinite(firstStart) ? minutesToTimeLabel(firstStart) : "—",
        lastEndLabel: Number.isFinite(lastEnd) ? minutesToTimeLabel(lastEnd) : "—",
      };
    });
}
