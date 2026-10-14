const noteText = document.querySelector("#note-text");
const charCount = document.querySelector("#char-count");
const wordCount = document.querySelector("#word-count");
const clearBtn = document.querySelector("#clear-btn");
const themeToggle = document.querySelector("#theme-toggle");

/* Update character and word counts + color classes*/
function updateCounts() {
    const text = noteText.value;
    const length = text.length;

    /* Word count calculation */
    const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

    charCount.textContent = `${length} / 200 characters`;
    wordCount.textContent = `${words} words`;

    /* Clear previous status classes */
    charCount.className = "";

    /* Apply warning or over classes */
    if (length > 200) {
        charCount.classList.add("over");
    } else if (length > 180) {
        charCount.classList.add("warning");
    }
}

/* Save draft to localStorage */
function saveDraft() {
    localStorage.setItem("noteDraft", noteText.value);
}

/* Clear note functionality */
function clearNote() {
    noteText.value = "";
    localStorage.removeItem("noteDraft");
    updateCounts();
    noteText.focus();
}

/* Event listeners */
noteText.addEventListener("input", () => {
    updateCounts();
    saveDraft();
});

clearBtn.addEventListener("click", clearNote);

/* Escape key inside textarea clears it */
noteText.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        clearNote();
    }
});

/* Theme toggle button logic */
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        themeToggle.textContent = "Light mode";
        localStorage.setItem("theme", "dark");
    } else {
        themeToggle.textContent = "Dark mode";
        localStorage.setItem("theme", "light");
    }
});

/* Load saved draft and theme on page load */
function init() {
    const savedDraft = localStorage.getItem("noteDraft");
    if (savedDraft !== null) {
        noteText.value = savedDraft;
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeToggle.textContent = "Light mode";
    } else {
        themeToggle.textContent = "Dark mode";
    }

    updateCounts();
}

init();