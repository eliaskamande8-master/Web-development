// api.js
// QuickNotes API client. We use JSONPlaceholder as a practice API.

const API_URL = "https://jsonplaceholder.typicode.com/posts";

// Grab the page elements once so we can reuse them
const loadBtn = document.getElementById("load-btn");
const statusEl = document.getElementById("status");
const notesList = document.getElementById("notes-list");

// ---------- Helpers ----------

// Shows a message in the status line.
// type is "loading", "success" or "error" (used by style.css for colours)
function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = type || "";
}

// Reusable function for every request in this file.
// It calls fetch, checks response.ok and throws if something went wrong.
// It returns the status code and the JSON data so callers can use both.
async function request(url, options = {}) {
  const response = await fetch(url, options);

  // fetch only rejects on network failure. A 404 or 500 still "succeeds",
  // so we have to check response.ok ourselves.
  if (!response.ok) {
    throw new Error("Request failed with status " + response.status);
  }

  const data = await response.json();
  return { status: response.status, data: data };
}

// Turns an error into a message a normal person can read
function friendlyError(error, action) {
  if (error instanceof TypeError) {
    // This is what fetch throws when there is no internet or the server is unreachable
    return "Could not " + action + ". Check your internet connection and try again.";
  }
  return "Could not " + action + ". The server had a problem. Please try again.";
}

// ---------- Rendering ----------

// Builds one <li> for a note.
// textContent is used everywhere so user text can never run as HTML.
function createNoteItem(note) {
  const li = document.createElement("li");
  li.className = "note";
  li.dataset.id = note.id;

  const title = document.createElement("h2");
  title.textContent = note.title;

  const body = document.createElement("p");
  body.textContent = note.body;

  li.append(title, body);
  return li;
}

// Clears the list and draws every note. Shows an empty state if there are none.
function renderNotes(notes) {
  notesList.textContent = "";

  if (notes.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No notes yet. Click Load notes or add one.";
    notesList.appendChild(empty);
    return;
  }

  notes.forEach(function (note) {
    notesList.appendChild(createNoteItem(note));
  });
}

// ---------- GET: load 10 notes ----------

async function loadNotes() {
  setStatus("Loading notes...", "loading");
  loadBtn.disabled = true; // stops double clicks while we wait

  try {
    const result = await request(API_URL + "?_limit=10");
    renderNotes(result.data);
    setStatus("Loaded " + result.data.length + " notes from the server.", "success");
  } catch (error) {
    console.error(error); // full details for the developer
    setStatus(friendlyError(error, "load notes"), "error");
  } finally {
    // finally runs whether it worked or failed, so the button always comes back
    loadBtn.disabled = false;
  }
}

loadBtn.addEventListener("click", loadNotes);