# Privacy Policy for CalPaste

_Last updated: March 7, 2026_

## Overview

CalPaste is a Chrome extension that lets you highlight date/time text on any webpage and add it to Google Calendar. This policy explains what data is collected and how it is used.

## Data We Collect

**OpenAI API Key**
Your OpenAI API key is stored locally in Chrome's sync storage (`chrome.storage.sync`). It is only used to make requests to the OpenAI API on your behalf to parse selected text. It is never sent to any server other than OpenAI.

**Selected Text**
When you right-click and choose "Add to Calendar", the text you highlighted is sent to the OpenAI API (`api.openai.com`) for date/time extraction. No copy of this text is retained by the extension after the request completes.

**Google Account**
The extension requests OAuth2 access to your Google Calendar to list your calendars and create events. Your Google credentials are handled entirely by Chrome's identity API — the extension never sees your password. Access tokens are stored temporarily in Chrome's session storage and are discarded when the session ends.

## Data We Do Not Collect

- We do not operate any servers or backend infrastructure.
- We do not collect analytics, crash reports, or usage data.
- We do not sell or share any data with third parties beyond the API calls described above.

## Third-Party Services

- **OpenAI** — selected text is sent to OpenAI for parsing. See [OpenAI's Privacy Policy](https://openai.com/policies/privacy-policy).
- **Google Calendar API** — calendar data is accessed on your behalf. See [Google's Privacy Policy](https://policies.google.com/privacy).

## Contact

If you have questions about this policy, open an issue at the project's GitHub repository.
