const API_URL = "https://jsonplaceholder.typicode.com/users";

const loadButton = document.getElementById("load-users");
const filterInput = document.getElementById("filter-input");
const statusEl = document.getElementById("status");
const usersList = document.getElementById("users-list");

// Every user returned by the API. The filter reads from this array,
// so typing in the box never triggers a new request.
let allUsers = [];

function setStatus(message, state) {
  statusEl.textContent = message;
  statusEl.dataset.state = state;
}

function createLine(text) {
  const p = document.createElement("p");
  p.textContent = text;
  return p;
}

// Draws any array of users. Clears the list first, then adds one <li> per user.
function renderUsers(list) {
  usersList.replaceChildren();

  list.forEach((user) => {
    const item = document.createElement("li");

    const name = document.createElement("h2");
    name.textContent = user.name;

    item.append(
      name,
      createLine("Email: " + user.email),
      createLine("City: " + user.address.city),
      createLine("Company: " + user.company.name)
    );

    usersList.appendChild(item);
  });
}

async function loadUsers() {
  loadButton.disabled = true;
  setStatus("Loading users...", "loading");

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Server responded with status " + response.status);
    }

    allUsers = await response.json();
    filterInput.value = "";
    renderUsers(allUsers);
    setStatus("Loaded " + allUsers.length + " users.", "success");
  } catch (error) {
    setStatus("Could not load users: " + error.message + ".", "error");
  } finally {
    loadButton.disabled = false;
  }
}

function filterUsers() {
  // Nothing to filter until a load has succeeded.
  if (allUsers.length === 0) {
    return;
  }

  const text = filterInput.value.toLowerCase();
  const matches = allUsers.filter((user) =>
    user.name.toLowerCase().includes(text)
  );

  renderUsers(matches);

  if (matches.length === 0) {
    setStatus("No users match your filter.", "info");
  } else {
    setStatus("Showing " + matches.length + " of " + allUsers.length + " users.", "success");
  }
}

loadButton.addEventListener("click", loadUsers);
filterInput.addEventListener("input", filterUsers);