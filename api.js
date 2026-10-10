const API_URL = "https://jsonplaceholder.typicode.com/posts";
const MAX_TITLE_LENGTH = 100;

const loadButton = document.getElementById("load-btn");
const form = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const submitButton = document.getElementById("submit-btn");
const statusElement = document.getElementById("status");
const notesList = document.getElementById("notes-list");

let notes = [];
let nextKey = 1;
let requestRunning = false;

// Reusable function for API requests.
async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return { data: null, status: response.status };
  }

  const data = await response.json();

  return { data, status: response.status };
}

// Update the status message.
function setStatus(message, type = "") {
  statusElement.textContent = message;
  statusElement.className = type;
}

// Disable buttons while a request is running.
function setButtonsDisabled(disabled) {
  loadButton.disabled = disabled;
  submitButton.disabled = disabled;

  notesList.querySelectorAll("button").forEach((button) => {
    button.disabled = disabled;
  });
}

// Display notes safely using textContent.
function renderNotes() {
  notesList.replaceChildren();

  if (notes.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.textContent = "No notes to display.";
    emptyMessage.className = "empty-message";
    notesList.appendChild(emptyMessage);
    return;
  }

  notes.forEach((note) => {
    const item = document.createElement("li");
    item.className = "note-card";

    const title = document.createElement("h3");
    title.textContent = note.title;

    const body = document.createElement("p");
    body.textContent = note.body || "No body provided.";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.dataset.key = note.key;
    deleteButton.className = "delete-btn";

    item.append(title, body, deleteButton);
    notesList.appendChild(item);
  });
}

// Load the latest 10 notes.
async function loadNotes() {
  if (requestRunning) return;

  requestRunning = true;
  setButtonsDisabled(true);
  setStatus("Loading notes...", "loading");

  try {
    const result = await request(`${API_URL}?_limit=10`);

    notes = result.data.map((note) => ({
      ...note,
      key: nextKey++,
      isLocal: false,
    }));

    renderNotes();
    setStatus(`Successfully loaded ${notes.length} notes.`, "success");
  } catch (error) {
    setStatus(`Could not load notes: ${error.message}`, "error");
  } finally {
    requestRunning = false;
    setButtonsDisabled(false);
  }
}

// Validate and create a note.
async function createNote(event) {
  event.preventDefault();

  if (requestRunning) return;

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title) {
    setStatus("Please enter a title.", "error");
    titleInput.focus();
    return;
  }

  if (title.length > MAX_TITLE_LENGTH) {
    setStatus(
      `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`,
      "error",
    );
    titleInput.focus();
    return;
  }

  requestRunning = true;
  setButtonsDisabled(true);
  setStatus("Creating note...", "loading");

  try {
    const result = await request(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        body,
        userId: 1,
      }),
    });

    notes.unshift({
      ...result.data,
      key: nextKey++,
      isLocal: true,
    });

    renderNotes();
    form.reset();
    setStatus(`Note created successfully (ID: ${result.data.id}).`, "success");
  } catch (error) {
    setStatus(`Could not create note: ${error.message}`, "error");
  } finally {
    requestRunning = false;
    setButtonsDisabled(false);
  }
}

// Delete a note.
async function deleteNote(key) {
  if (requestRunning) return;

  const note = notes.find((item) => item.key === key);
  if (!note) return;

  requestRunning = true;
  setButtonsDisabled(true);
  setStatus("Deleting note...", "loading");

  try {
    const result = await request(`${API_URL}/${note.id}`, {
      method: "DELETE",
    });

    notes = notes.filter((item) => item.key !== key);
    renderNotes();

    setStatus(
      `Note deleted successfully (status ${result.status}).`,
      "success",
    );
  } catch (error) {
    setStatus(`Could not delete note: ${error.message}`, "error");
  } finally {
    requestRunning = false;
    setButtonsDisabled(false);
  }
}

// Handle Delete button clicks.
notesList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-key]");

  if (!button || requestRunning) return;

  deleteNote(Number(button.dataset.key));
});

// Connect the page controls.
loadButton.addEventListener("click", loadNotes);
form.addEventListener("submit", createNote);
