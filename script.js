// ====== DOM ELEMENTS ======
const form = document.getElementById("checkInForm");
const nameInput = document.getElementById("attendeeName");
const teamSelect = document.getElementById("teamSelect");

const greetingEl = document.getElementById("greeting");
const attendeeCountEl = document.getElementById("attendeeCount");
const progressBarEl = document.getElementById("progressBar");

const waterCountEl = document.getElementById("waterCount");
const zeroCountEl = document.getElementById("zeroCount");
const powerCountEl = document.getElementById("powerCount");

const attendeeListEl = document.getElementById("attendeeList");

// ====== STATE ======
const MAX_COUNT = 50;

// localStorage keys
const STORAGE_KEY = "intelSummitCheckInState";

// Default state
let state = {
  total: 0,
  teams: {
    water: 0,
    zero: 0,
    power: 0,
  },
  attendees: [], // { name, teamValue, teamLabel }
  celebrated: false, // prevent repeating celebration message on every submit after goal
};

// ====== HELPERS ======
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    // Basic shape guard (minimal)
    if (
      typeof parsed?.total === "number" &&
      parsed?.teams &&
      Array.isArray(parsed?.attendees)
    ) {
      state = parsed;
    }
  } catch {
    // ignore bad storage
  }
}

function renderCounts() {
  attendeeCountEl.textContent = state.total;
  waterCountEl.textContent = state.teams.water;
  zeroCountEl.textContent = state.teams.zero;
  powerCountEl.textContent = state.teams.power;
}

function renderProgress() {
  const pct = Math.min(100, (state.total / MAX_COUNT) * 100);
  progressBarEl.style.width = `${pct}%`;
}

function showGreeting(message, isCelebration = false) {
  greetingEl.textContent = message;
  greetingEl.style.display = "block";
  greetingEl.classList.add("success-message");

  // Optional: make celebration feel “different” using same area, minimal change
  if (isCelebration) {
    greetingEl.style.fontWeight = "700";
  } else {
    greetingEl.style.fontWeight = "";
  }
}

function teamLabelFromValue(teamValue) {
  const labels = {
    water: "Team Water Wise",
    zero: "Team Net Zero",
    power: "Team Renewables",
  };
  return labels[teamValue] || "Team";
}

function renderAttendeeList() {
  attendeeListEl.innerHTML = "";

  state.attendees.forEach((a) => {
    const li = document.createElement("li");
    li.className = "attendee-item";

    const left = document.createElement("span");
    left.textContent = a.name;

    const right = document.createElement("span");
    right.className = "attendee-team";
    right.textContent = a.teamLabel;

    li.appendChild(left);
    li.appendChild(right);
    attendeeListEl.appendChild(li);
  });
}

function getWinningTeam() {
  const entries = Object.entries(state.teams); // [teamValue, count]
  entries.sort((a, b) => b[1] - a[1]);

  const [topTeam, topCount] = entries[0];
  // Basic tie handling: if tie, show “It’s a tie”
  const secondCount = entries[1]?.[1] ?? -1;

  if (topCount === secondCount) return "It’s a tie!";
  return teamLabelFromValue(topTeam);
}

function maybeCelebrate() {
  if (state.celebrated) return;
  if (state.total < MAX_COUNT) return;

  const winner = getWinningTeam();
  showGreeting(`🎊 Goal reached! Winning team: ${winner}`, true);
  state.celebrated = true;
}

// ====== INITIAL LOAD ======
loadState();
renderCounts();
renderProgress();
renderAttendeeList();

if (state.total >= MAX_COUNT) {
  // If they already hit goal earlier, show celebration once on load
  maybeCelebrate();
}

// ====== FORM SUBMIT ======
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const teamValue = teamSelect.value;

  // Minimal validation (HTML "required" helps, but this prevents weird edge cases)
  if (!name || !teamValue) return;

  // Prevent checking in beyond max? (Optional; if you want to still allow, remove this)
  if (state.total >= MAX_COUNT) {
    showGreeting(`✅ ${name}, you’re already counted — goal is reached!`, true);
    form.reset();
    nameInput.focus();
    return;
  }

  const teamLabel = teamSelect.selectedOptions[0].text;

  // Update state
  state.total += 1;
  state.teams[teamValue] += 1;
  state.attendees.push({ name, teamValue, teamLabel });

  // Update UI
  renderCounts();
  renderProgress();
  renderAttendeeList();
  showGreeting(`🎉 Welcome, ${name} from ${teamLabel}!`);

  // Celebration check
  maybeCelebrate();

  // Save to localStorage
  saveState();

  // Reset form
  form.reset();
  nameInput.focus();
});