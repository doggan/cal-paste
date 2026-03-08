# CalPaste

A Chrome extension that turns any selected date or time text into a Google Calendar event — in one right-click.

## How it works

1. Highlight a date/time on any webpage (e.g. "Tuesday March 10 at 3pm")
2. Right-click → **Add to Calendar**
3. CalPaste uses OpenAI to parse the text into event details
4. Review and edit the event, then save it to your Google Calendar

## Setup

### 1. Load the extension

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select this folder

### 2. Configure

Click the CalPaste icon in your toolbar:

- **OpenAI API Key** — required for date parsing (uses `gpt-4o-mini`)
- **Google Calendar** — sign in to allow event creation

## Stack

- Chrome Extension (Manifest V3)
- OpenAI Chat Completions API (`gpt-4o-mini`)
- Google Calendar API v3
- Vanilla JS, no build step
