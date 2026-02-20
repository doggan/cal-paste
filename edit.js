const form = document.getElementById("event-form");
const loadingEl = document.getElementById("loading");
const resultEl = document.getElementById("result");

const titleInput = document.getElementById("title");
const startInput = document.getElementById("start");
const endInput = document.getElementById("end");
const locationInput = document.getElementById("location");
const descriptionInput = document.getElementById("description");
const calendarSelect = document.getElementById("calendar");
const saveBtn = document.getElementById("save-btn");

// Wait for parsed event data from background, then load calendars
init();

async function init() {
  try {
    // The background script may still be parsing — poll until data arrives
    const pendingEvent = await waitForPendingEvent();

    if (!pendingEvent) {
      showResult(false, "No Event Data", "Nothing to show. Try highlighting text and right-clicking again.");
      return;
    }

    const calendars = await fetchCalendars();
    populateCalendars(calendars);
    populateForm(pendingEvent);

    loadingEl.hidden = true;
    form.hidden = false;
  } catch (err) {
    showResult(false, "Error", err.message);
  }
}

async function waitForPendingEvent(timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const { pendingEvent } = await chrome.storage.session.get("pendingEvent");
    if (pendingEvent !== undefined) return pendingEvent;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Timed out waiting for AI to parse the text.");
}

function populateForm(event) {
  titleInput.value = event.title || "";
  startInput.value = toLocalDateTimeValue(event.startDateTime);
  endInput.value = toLocalDateTimeValue(event.endDateTime);
  locationInput.value = event.location || "";
  descriptionInput.value = event.description || "";
}

function populateCalendars(calendars) {
  calendarSelect.innerHTML = "";
  for (const cal of calendars) {
    const opt = document.createElement("option");
    opt.value = cal.id;
    opt.textContent = cal.summary;
    if (cal.primary) opt.selected = true;
    calendarSelect.appendChild(opt);
  }
}

// Convert ISO string to datetime-local input value
function toLocalDateTimeValue(iso) {
  if (!iso) return "";
  const dt = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

async function fetchCalendars() {
  const token = await getAuthToken();
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) throw new Error("Failed to fetch calendars");
  const data = await response.json();
  return data.items || [];
}

function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(token);
    });
  });
}

// Handle form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  saveBtn.disabled = true;
  saveBtn.textContent = "Creating...";

  try {
    const token = await getAuthToken();
    const calendarId = encodeURIComponent(calendarSelect.value || "primary");
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const event = {
      summary: titleInput.value,
      start: { dateTime: new Date(startInput.value).toISOString(), timeZone },
      end: { dateTime: new Date(endInput.value).toISOString(), timeZone },
    };

    if (locationInput.value.trim()) event.location = locationInput.value.trim();
    if (descriptionInput.value.trim()) event.description = descriptionInput.value.trim();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || response.statusText);
    }

    const created = await response.json();
    showResult(true, "Event Created!", `"${created.summary}" has been added to your calendar.`, created.htmlLink);

    // Clean up
    chrome.storage.session.remove("pendingEvent");
  } catch (err) {
    saveBtn.disabled = false;
    saveBtn.textContent = "Add to Calendar";
    showResult(false, "Failed to Create Event", err.message);
  }
});

document.getElementById("cancel-btn").addEventListener("click", () => {
  chrome.storage.session.remove("pendingEvent");
  window.close();
});

document.getElementById("close-btn").addEventListener("click", () => {
  window.close();
});

function showResult(success, title, message, link) {
  loadingEl.hidden = true;
  form.hidden = true;
  resultEl.hidden = false;

  document.getElementById("result-icon").textContent = success ? "\u2705" : "\u274C";
  document.getElementById("result-title").textContent = title;
  document.getElementById("result-message").textContent = message;

  const linkEl = document.getElementById("result-link");
  if (link) {
    linkEl.href = link;
    linkEl.hidden = false;
  }
}
