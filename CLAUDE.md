# CalPaste - Chrome Extension

## Project Overview

CalPaste is a Chrome extension (Manifest V3) that lets users highlight date/time text on any webpage, right-click, and add the event to Google Calendar. It uses OpenAI to parse natural language dates.

## Architecture

- **background.js** — Service worker; handles context menu, OpenAI date parsing, stores parsed results in `chrome.storage.session`
- **edit.js / edit.html** — Event creation form; polls background for parsed data, lists user calendars, creates the event via Google Calendar API
- **popup.js / popup.html** — Settings UI; stores OpenAI API key and Google sign-in state
- No build step — plain JavaScript, load unpacked in Chrome

## Key APIs

- **OpenAI**: `gpt-4o-mini` chat completions to parse selected text into structured event data
- **Google Calendar API v3**: list calendars, create events
- **Chrome APIs**: `contextMenus`, `identity` (OAuth2), `storage.sync` / `storage.session`, `notifications`, `windows`

## Permissions & OAuth

- Google OAuth scopes: `calendar.events`, `calendar.readonly`
- OpenAI key stored in `chrome.storage.sync`
- Google auth token via `chrome.identity.getAuthToken`

## Data Flow

1. User selects text → right-clicks → "Add to Calendar"
2. background.js calls OpenAI to parse the text, stores result in `chrome.storage.session`
3. edit.html opens and polls background.js (up to 60× at 500ms intervals) for the parsed result
4. User edits the form, selects a calendar, and submits
5. edit.js POSTs to Google Calendar API to create the event

## Dev Notes

- Load extension via `chrome://extensions` → "Load unpacked"
- No `package.json`, no build step, no tests
- `.gitignore` excludes `.idea/` and `.claude/`