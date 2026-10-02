let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

function searchNotes(word) {
  return notes.filter(note => 
    note.text.toLowerCase().includes(word.toLowerCase())
  );
}

function longestNote() {
  if (notes.length === 0) return null;

  return notes.reduce((longest, current) => 
    current.text.length > longest.text.length ? current : longest
  );
}

function countByCategory() {
  return notes.reduce((counts, note) => {
    let cat = note.category;
    counts[cat] = (counts[cat] || 0) + 1;
    return counts;
  }, {});
}

function getSummary() {
  const counts = countByCategory();
  const summaryParts = Object.entries(counts)
    .map(([cat, count]) => `${count} ${cat}`)
    .join(", ");
    
  return `${notes.length} notes: ${summaryParts}.`;
}

function isDuplicate(text) {
  if (typeof text !== "string") return false;
  const normalizedInput = text.trim().toLowerCase().replace(/\s+/g, " ");
  
  return notes.some(note => 
    note.text.trim().toLowerCase().replace(/\s+/g, " ") === normalizedInput
  );
}

function addNote(text, category) {
  
  if (typeof text !== "string" || text.trim().length < 1 || text.trim().length > 200) {
    console.log("Reason: Note text must be between 1 and 200 characters.");
    return false;
  }

  const validCategories = ["personal", "work", "study"];
  const normalizedCategory = category ? category.toLowerCase().trim() : "";
  if (!validCategories.includes(normalizedCategory)) {
    console.log("Reason: Category must be 'personal', 'work', or 'study'.");
    return false;
  }

  if (isDuplicate(text)) {
    console.log("Reason: A note with this text already exists.");
    return false;
  }

  const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;

  notes.push({
    id: newId,
    text: text.trim(),
    category: normalizedCategory
  });

  return true;
}

console.log("--- 1. searchNotes('javascript') ---");
console.log(searchNotes("javascript"));

console.log("\n--- 2. longestNote() ---");
console.log(longestNote());

console.log("\n--- 3. countByCategory() ---");
console.log(countByCategory());

console.log("\n--- 4. getSummary() ---");
console.log(getSummary());

console.log("\n--- 5. isDuplicate() ---");
console.log("Checking exact duplicate:", isDuplicate("Call mum"));
console.log("Checking case/space duplicate:", isDuplicate("  call MUM  "));
console.log("Checking unique text:", isDuplicate("Go for a run"));

console.log("\n--- 6. addNote() Tests ---");

console.log("Add valid note:", addNote("Submit weekly timesheet", "work")); 

console.log("Add invalid category:", addNote("Buy groceries", "fitness")); 

console.log("Add duplicate note:", addNote("call MUM", "personal")); 

console.log("\nUpdated Notes Summary after additions:");
console.log(getSummary());