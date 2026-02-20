const keyInput = document.getElementById("openai-key");
const saveKeyBtn = document.getElementById("save-key");
const keyStatus = document.getElementById("key-status");
const googleSigninBtn = document.getElementById("google-signin");
const googleStatus = document.getElementById("google-status");

// Load saved state on open
chrome.storage.sync.get("openaiApiKey", ({ openaiApiKey }) => {
  if (openaiApiKey) {
    keyInput.value = openaiApiKey;
    setStatus(keyStatus, "Key saved", "ok");
  }
});

// Check if Google token already exists
chrome.identity.getAuthToken({ interactive: false }, (token) => {
  if (token) {
    setStatus(googleStatus, "Connected", "ok");
  } else {
    setStatus(googleStatus, "Not connected", "err");
  }
});

// Save API key
saveKeyBtn.addEventListener("click", () => {
  const key = keyInput.value.trim();
  if (!key) {
    setStatus(keyStatus, "Please enter a key", "err");
    return;
  }
  chrome.storage.sync.set({ openaiApiKey: key }, () => {
    setStatus(keyStatus, "Key saved", "ok");
  });
});

// Google sign-in
googleSigninBtn.addEventListener("click", () => {
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError) {
      setStatus(googleStatus, chrome.runtime.lastError.message, "err");
    } else if (token) {
      setStatus(googleStatus, "Connected", "ok");
    }
  });
});

function setStatus(el, text, type) {
  el.textContent = text;
  el.className = "status " + (type || "");
}
