 document.addEventListener('DOMContentLoaded', () => {
    const noteText = document.getElementById('note-text');
    const charCount = document.getElementById('char-count');
    const wordCount = document.getElementById('word-count');
    const clearBtn = document.getElementById('clear-btn');
    const themeToggle = document.getElementById('theme-toggle');

    // Function to update character/word counts and apply warning/over classes
    function updateCounts() {
        const text = noteText.value;
        const length = text.length;
        
        // Calculate words (split by whitespace, filter out empty strings)
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

        charCount.textContent = `${length} / 200 characters`;
        wordCount.textContent = `${words} words`;

        // Reset classes
        charCount.classList.remove('warning', 'over');

        // Apply rules
        if (length > 200) {
            charCount.classList.add('over');
        } else if (length > 180) {
            charCount.classList.add('warning');
        }
    }

    // 1. Restore saved draft from localStorage
    const savedDraft = localStorage.getItem('noteDraft');
    if (savedDraft !== null) {
        noteText.value = savedDraft;
    }

    // 2. Restore saved theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        themeToggle.textContent = 'Light mode';
    } else {
        themeToggle.textContent = 'Dark mode';
    }

    // Initial count update on load
    updateCounts();

    // 3. Input event: update counts and save draft
    noteText.addEventListener('input', () => {
        updateCounts();
        localStorage.setItem('noteDraft', noteText.value);
    });

    // 4. Clear button functionality
    clearBtn.addEventListener('click', () => {
        noteText.value = '';
        localStorage.removeItem('noteDraft');
        updateCounts();
    });

    // 5. Escape key clears the textarea
    noteText.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            noteText.value = '';
            localStorage.removeItem('noteDraft');
            updateCounts();
        }
    });

    // 6. Theme toggle button functionality
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');

        if (isDark) {
            themeToggle.textContent = 'Light mode';
            localStorage.setItem('theme', 'dark');
        } else {
            themeToggle.textContent = 'Dark mode';
            localStorage.setItem('theme', 'light');
        }
    });
});