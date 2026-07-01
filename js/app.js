const STORAGE_KEY = "forLucyCycleData";

const MOODS = ["Calm", "Happy", "Anxious", "Tired", "Energised", "Sensitive", "Low"];
const SYMPTOMS = ["Cramps", "Bloating", "Headache", "Backache", "Tender breasts", "Cravings", "Clear skin", "Spotting"];

const PHASES = {
  menstrual: {
    name: "Menstrual phase",
    messages: [
      "Rest when you need to — your body is doing important work.",
      "Warmth, hydration, and gentle movement can feel grounding today.",
      "It's okay to move slowly. Be as kind to yourself as you'd be to Lucy.",
    ],
  },
  follicular: {
    name: "Follicular phase",
    messages: [
      "Energy may be rising — a good time for fresh starts and ideas.",
      "Your body is building momentum. Follow what feels light and possible.",
      "Creativity and optimism often bloom in this part of your cycle.",
    ],
  },
  ovulation: {
    name: "Ovulation phase",
    messages: [
      "You may feel more social and confident — honour that spark.",
      "Peak energy days can be wonderful for connection and bold plans.",
      "Listen to your body; some people feel vibrant, others need balance.",
    ],
  },
  luteal: {
    name: "Luteal phase",
    messages: [
      "Winding down is natural now. Prioritise comfort and routine.",
      "If emotions feel closer to the surface, that's a normal part of this phase.",
      "Nourishing food, sleep, and small rituals can help you feel steadier.",
    ],
  },
};

const state = {
  settings: {
    lastPeriodStart: null,
    cycleLength: 28,
    periodLength: 5,
  },
  logs: {},
  viewMonth: new Date(),
  selectedMoods: new Set(),
  selectedSymptoms: new Set(),
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.settings) state.settings = { ...state.settings, ...parsed.settings };
    if (parsed.logs) state.logs = parsed.logs;
  } catch {
    /* ignore corrupt storage */
  }
}

function saveData() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ settings: state.settings, logs: state.logs })
  );
}

function parseDate(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function daysBetween(a, b) {
  const ms = startOfDay(b) - startOfDay(a);
  return Math.round(ms / 86400000);
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

function getCycleInfo(forDate = new Date()) {
  const { lastPeriodStart, cycleLength, periodLength } = state.settings;
  if (!lastPeriodStart) return null;

  const anchor = parseDate(lastPeriodStart);
  const dayDiff = daysBetween(anchor, forDate);
  const cycleDay = mod(dayDiff, cycleLength) + 1;
  const ovulationDay = cycleLength - 14;
  const fertileStart = Math.max(periodLength + 1, ovulationDay - 5);
  const fertileEnd = ovulationDay + 1;

  let phase = "follicular";
  if (cycleDay <= periodLength) {
    phase = "menstrual";
  } else if (cycleDay === ovulationDay) {
    phase = "ovulation";
  } else if (cycleDay > ovulationDay) {
    phase = "luteal";
  } else {
    phase = "follicular";
  }

  return { cycleDay, phase, ovulationDay, fertileStart, fertileEnd, periodLength, cycleLength, anchor };
}

function getDayType(date) {
  const info = getCycleInfo(date);
  if (!info) return {};

  const { cycleDay, ovulationDay, fertileStart, fertileEnd, periodLength } = info;
  const types = [];

  if (cycleDay <= periodLength) types.push("period");
  if (cycleDay >= fertileStart && cycleDay <= fertileEnd) types.push("fertile");
  if (cycleDay === ovulationDay) types.push("ovulation");
  if (state.logs[formatDateKey(date)]) types.push("logged");

  return { types, cycleDay };
}

function getNextPeriodDate(fromDate = new Date()) {
  const info = getCycleInfo(fromDate);
  if (!info) return null;

  const { cycleDay, cycleLength } = info;
  const daysUntil = cycleLength - cycleDay + 1;
  return addDays(fromDate, daysUntil);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function renderPhaseCard() {
  const info = getCycleInfo();
  const cycleDayEl = document.getElementById("cycleDayLabel");
  const phaseNameEl = document.getElementById("phaseName");
  const phaseMessageEl = document.getElementById("phaseMessage");
  const nextPeriodEl = document.getElementById("nextPeriod");
  const cycleLengthEl = document.getElementById("cycleLengthDisplay");

  cycleLengthEl.textContent = `${state.settings.cycleLength} days`;

  if (!info) {
    cycleDayEl.textContent = "Day —";
    phaseNameEl.textContent = "Welcome, Lucy";
    phaseMessageEl.textContent = "Set your last period start in settings to begin tracking your cycle.";
    nextPeriodEl.textContent = "—";
    return;
  }

  const phase = PHASES[info.phase];
  const message = phase.messages[info.cycleDay % phase.messages.length];
  const nextPeriod = getNextPeriodDate();

  cycleDayEl.textContent = `Day ${info.cycleDay} of ${info.cycleLength}`;
  phaseNameEl.textContent = phase.name;
  phaseMessageEl.textContent = message;
  nextPeriodEl.textContent = formatDisplayDate(nextPeriod);
}

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const monthLabel = document.getElementById("monthLabel");
  const view = state.viewMonth;
  const year = view.getFullYear();
  const month = view.getMonth();

  monthLabel.textContent = view.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = formatDateKey(new Date());

  grid.innerHTML = "";

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekdayRow = document.createElement("div");
  weekdayRow.className = "calendar__weekdays";
  weekdayRow.setAttribute("role", "row");
  weekdays.forEach((label) => {
    const cell = document.createElement("div");
    cell.className = "calendar__weekday";
    cell.setAttribute("role", "columnheader");
    cell.textContent = label;
    weekdayRow.appendChild(cell);
  });
  grid.appendChild(weekdayRow);

  const daysRow = document.createElement("div");
  daysRow.className = "calendar__days";
  daysRow.setAttribute("role", "row");

  for (let i = 0; i < startOffset; i += 1) {
    const empty = document.createElement("div");
    empty.className = "calendar__day calendar__day--muted";
    empty.setAttribute("aria-hidden", "true");
    daysRow.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const key = formatDateKey(date);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "calendar__day";
    btn.textContent = String(day);
    btn.title = formatDisplayDate(date);
    btn.setAttribute("role", "gridcell");

    const { types } = getDayType(date);
    if (types.includes("period")) btn.classList.add("calendar__day--period");
    if (types.includes("fertile")) btn.classList.add("calendar__day--fertile");
    if (types.includes("ovulation")) btn.classList.add("calendar__day--ovulation");
    if (types.includes("logged")) btn.classList.add("calendar__day--logged");
    if (key === todayKey) btn.classList.add("calendar__day--today");

    daysRow.appendChild(btn);
  }

  grid.appendChild(daysRow);
}

function renderChips(containerId, options, selectedSet) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  options.forEach((option) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = option;
    btn.setAttribute("aria-pressed", selectedSet.has(option) ? "true" : "false");
    btn.addEventListener("click", () => {
      if (selectedSet.has(option)) selectedSet.delete(option);
      else selectedSet.add(option);
      btn.setAttribute("aria-pressed", selectedSet.has(option) ? "true" : "false");
    });
    container.appendChild(btn);
  });
}

function renderTodayLogForm() {
  const todayKey = formatDateKey(new Date());
  document.getElementById("todayLabel").textContent = formatDisplayDate(new Date());

  const existing = state.logs[todayKey];
  state.selectedMoods = new Set(existing?.moods || []);
  state.selectedSymptoms = new Set(existing?.symptoms || []);
  document.getElementById("logNotes").value = existing?.notes || "";

  renderChips("moodChips", MOODS, state.selectedMoods);
  renderChips("symptomChips", SYMPTOMS, state.selectedSymptoms);
}

function renderRecentLogs() {
  const list = document.getElementById("recentLogs");
  const entries = Object.entries(state.logs)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7);

  list.innerHTML = "";

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "insights__empty";
    empty.textContent = "Your check-ins will appear here once you start logging.";
    list.appendChild(empty);
    return;
  }

  entries.forEach(([dateKey, log]) => {
    const item = document.createElement("li");
    item.className = "insights__item";

    const tags = [...(log.moods || []), ...(log.symptoms || [])].join(" · ") || "No tags";
    item.innerHTML = `
      <div class="insights__item-head">
        <span class="insights__item-date">${formatDisplayDate(parseDate(dateKey))}</span>
        <span class="insights__item-tags">${tags}</span>
      </div>
      ${log.notes ? `<p>${escapeHtml(log.notes)}</p>` : ""}
    `;
    list.appendChild(item);
  });
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderAll() {
  renderPhaseCard();
  renderCalendar();
  renderTodayLogForm();
  renderRecentLogs();
}

function openSettings() {
  const modal = document.getElementById("settingsModal");
  document.getElementById("lastPeriodInput").value = state.settings.lastPeriodStart || "";
  document.getElementById("cycleLengthInput").value = state.settings.cycleLength;
  document.getElementById("periodLengthInput").value = state.settings.periodLength;
  modal.showModal();
}

function bindEvents() {
  document.getElementById("settingsBtn").addEventListener("click", openSettings);
  document.getElementById("closeSettings").addEventListener("click", () => {
    document.getElementById("settingsModal").close();
  });

  document.getElementById("settingsForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.settings.lastPeriodStart = document.getElementById("lastPeriodInput").value;
    state.settings.cycleLength = Number(document.getElementById("cycleLengthInput").value);
    state.settings.periodLength = Number(document.getElementById("periodLengthInput").value);
    saveData();
    document.getElementById("settingsModal").close();
    renderAll();
    showToast("Cycle settings saved");
  });

  document.getElementById("prevMonth").addEventListener("click", () => {
    state.viewMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() - 1, 1);
    renderCalendar();
  });

  document.getElementById("nextMonth").addEventListener("click", () => {
    state.viewMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  document.getElementById("logForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const todayKey = formatDateKey(new Date());
    state.logs[todayKey] = {
      moods: [...state.selectedMoods],
      symptoms: [...state.selectedSymptoms],
      notes: document.getElementById("logNotes").value.trim(),
    };
    saveData();
    renderCalendar();
    renderRecentLogs();
    showToast("Check-in saved");
  });

  document.getElementById("exportData").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ settings: state.settings, logs: state.logs }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "for-lucy-cycle-data.json";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Data exported");
  });

  document.getElementById("clearData").addEventListener("click", () => {
    if (!confirm("Clear all cycle data from this device?")) return;
    localStorage.removeItem(STORAGE_KEY);
    state.settings = { lastPeriodStart: null, cycleLength: 28, periodLength: 5 };
    state.logs = {};
    state.selectedMoods.clear();
    state.selectedSymptoms.clear();
    renderAll();
    showToast("All data cleared");
  });
}

loadData();
bindEvents();
renderAll();

if (!state.settings.lastPeriodStart) {
  window.setTimeout(openSettings, 600);
}
