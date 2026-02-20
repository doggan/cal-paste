// Register context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "add-to-calendar",
    title: "Add to Calendar",
    contexts: ["selection"],
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== "add-to-calendar") return;

  const selectedText = info.selectionText;
  if (!selectedText) {
    showNotification("No Text Selected", "Please highlight some text first.");
    return;
  }

  try {
    showNotification("Processing...", `Parsing: "${selectedText.slice(0, 80)}..."`);

    const parsed = await parseDateTime(selectedText);
    if (!parsed || !parsed.startDateTime) {
      showNotification("Parse Failed", "Could not extract a date/time from the selected text.");
      return;
    }

    const event = await createCalendarEvent(parsed);
    const eventLink = event.htmlLink || "";
    showNotification(
      "Event Created!",
      `"${parsed.title}" on ${new Date(parsed.startDateTime).toLocaleString()}`,
      eventLink
    );
  } catch (err) {
    console.error("Calendar Date Picker error:", err);
    showNotification("Error", err.message || "Something went wrong.");
  }
});

// --- OpenAI Date Parsing ---

async function parseDateTime(text) {
  const { openaiApiKey } = await chrome.storage.sync.get("openaiApiKey");
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not set. Open the extension popup to configure it.");
  }

  const today = new Date().toISOString().split("T")[0];
  const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a date/time extraction assistant. Today is ${dayOfWeek}, ${today}.
Extract event details from the user's text and return JSON with these fields:
- "title": string (event name/summary; infer from context if not explicit)
- "startDateTime": string (ISO 8601 format, e.g. "2025-04-18T13:00:00")
- "endDateTime": string (ISO 8601 format; if no end time given, default to 1 hour after start)
- "location": string or null (venue/address if mentioned)
- "description": string or null (any additional context from the text)

Rules:
- Resolve relative dates like "this Monday", "next Thursday" relative to today (${today}).
- If the year is not specified, use the current or next occurrence of the date.
- Use 24-hour time internally but accept any format in input.
- If you truly cannot find any date/time information, set startDateTime to null.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI.");

  return JSON.parse(content);
}

// --- Google Calendar API ---

async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(token);
      }
    });
  });
}

async function createCalendarEvent(parsed) {
  const token = await getAuthToken();

  const event = {
    summary: parsed.title || "Untitled Event",
    start: {
      dateTime: parsed.startDateTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: parsed.endDateTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  if (parsed.location) event.location = parsed.location;
  if (parsed.description) event.description = parsed.description;

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
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
    throw new Error(`Google Calendar error: ${err.error?.message || response.statusText}`);
  }

  return response.json();
}

// --- Notifications ---

function showNotification(title, message, url) {
  chrome.notifications.create(
    {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title,
      message,
    },
    (notificationId) => {
      if (url) {
        // Store the URL so we can open it if the user clicks the notification
        chrome.storage.session.set({ [`notif_${notificationId}`]: url });
      }
    }
  );
}

// Open calendar link when notification is clicked
chrome.notifications.onClicked.addListener(async (notificationId) => {
  const key = `notif_${notificationId}`;
  const result = await chrome.storage.session.get(key);
  if (result[key]) {
    chrome.tabs.create({ url: result[key] });
    chrome.storage.session.remove(key);
  }
});
