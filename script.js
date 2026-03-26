// ── Konstante ───────────────────────────────────────────────
const monthNames = ["Siječanj","Veljača","Ožujak","Travanj","Svibanj",
  "Lipanj","Srpanj","Kolovoz","Rujan","Listopad","Studeni","Prosinac"];
const dayNames = ["Nedjelja","Ponedjeljak","Utorak","Srijeda",
  "Četvrtak","Petak","Subota"];

// ── DOM elementi ────────────────────────────────────────────
const monthYear         = document.getElementById("monthYear");
const calendarDays      = document.getElementById("calendarDays");
const selectedDateTitle = document.getElementById("selectedDateTitle");
const taskCount         = document.getElementById("taskCount");
const taskList          = document.getElementById("taskList");
const prevMonthBtn      = document.getElementById("prevMonth");
const nextMonthBtn      = document.getElementById("nextMonth");
const openModalBtn      = document.getElementById("openModal");
const closeModalBtn     = document.getElementById("closeModal");
const taskModal         = document.getElementById("taskModal");
const taskInput         = document.getElementById("taskInput");
const addTaskBtn        = document.getElementById("addTaskBtn");
const progressWrap      = document.getElementById("progressWrap");
const progressBar       = document.getElementById("progressBar");
const progressLabel     = document.getElementById("progressLabel");
const toastEl           = document.getElementById("toast");
const priorityBtns      = document.querySelectorAll(".priority-btn");

// ── Stanje ──────────────────────────────────────────────────
const today = new Date();
let currentMonth  = today.getMonth();
let currentYear   = today.getFullYear();
let selectedDate  = null;
let selectedPriority = "low";

let tasks = JSON.parse(localStorage.getItem("tasks")) || {};

// ── Pomoćne funkcije ────────────────────────────────────────

// ISPRAVAK: zero-padded key sprječava kolizije
function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden");
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("show");
    setTimeout(() => toastEl.classList.add("hidden"), 300);
  }, 2200);
}

function pluralZadatak(n) {
  if (n === 1) return "1 zadatak";
  if (n >= 2 && n <= 4) return `${n} zadatka`;
  return `${n} zadataka`;
}

// ── Priority gumbi ──────────────────────────────────────────
priorityBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    priorityBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedPriority = btn.dataset.priority;
  });
});

// ── Kalendar ────────────────────────────────────────────────
function renderCalendar() {
  calendarDays.innerHTML = "";
  monthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  const firstDayRaw     = new Date(currentYear, currentMonth, 1).getDay();
  const firstDayOfMonth = (firstDayRaw + 6) % 7; // Pon = 0
  const daysInMonth     = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDayOfMonth; i++) {
    const empty = document.createElement("div");
    empty.classList.add("day", "empty-day");
    calendarDays.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const key  = dateKey(date);

    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day");
    dayDiv.tabIndex = 0;

    // Broj dana
    const number = document.createElement("div");
    number.textContent = day;
    dayDiv.appendChild(number);

    // Srce ako ima zadataka
    if (tasks[key] && tasks[key].length > 0) {
      const heart = document.createElement("div");
      heart.textContent = "💗";
      heart.classList.add("day-heart");
      dayDiv.appendChild(heart);
    }

    const isToday =
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear();
    if (isToday) dayDiv.classList.add("today");

    if (
      selectedDate &&
      day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear()
    ) {
      dayDiv.classList.add("selected");
    }

    const handleSelect = () => {
      selectedDate = new Date(currentYear, currentMonth, day);
      document.querySelectorAll(".day").forEach(d => d.classList.remove("selected"));
      dayDiv.classList.add("selected");
      updateSelectedDateTitle();
      renderTasks();
    };

    dayDiv.addEventListener("click", handleSelect);
    dayDiv.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelect(); }
    });

    calendarDays.appendChild(dayDiv);
  }
}

function updateSelectedDateTitle() {
  if (!selectedDate) {
    selectedDateTitle.textContent = "Odaberi datum";
    return;
  }
  const dayName = dayNames[selectedDate.getDay()];
  const day     = selectedDate.getDate();
  const month   = monthNames[selectedDate.getMonth()];
  const year    = selectedDate.getFullYear();
  selectedDateTitle.textContent = `${dayName}, ${day}. ${month} ${year}.`;
}

// ── Navigacija ──────────────────────────────────────────────
prevMonthBtn.addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
});

// ── Zadaci ──────────────────────────────────────────────────
function updateProgress(dayTasks) {
  if (dayTasks.length === 0) {
    progressWrap.style.display = "none";
    return;
  }
  const done = dayTasks.filter(t => t.done).length;
  const pct  = Math.round((done / dayTasks.length) * 100);

  progressWrap.style.display = "block";
  progressBar.style.width    = `${pct}%`;
  progressLabel.textContent  = `${done} / ${dayTasks.length}`;
}

function renderTasks() {
  taskList.innerHTML = "";
  if (!selectedDate) return;

  const key      = dateKey(selectedDate);
  const dayTasks = tasks[key] || [];

  taskCount.textContent = pluralZadatak(dayTasks.length);
  updateProgress(dayTasks);

  if (dayTasks.length === 0) {
    taskList.innerHTML = '<p class="empty-message">Nema zadataka za ovaj dan. 🌸</p>';
    return;
  }

  dayTasks.forEach(task => {
    const item = document.createElement("div");
    item.classList.add("task-item", `priority-${task.priority || "low"}`);

    const checkbox = document.createElement("input");
    checkbox.type    = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      label.classList.toggle("task-done", task.done);
      saveTasks();
      updateProgress(tasks[key]);
      if (task.done) showToast("✅ Zadatak završen!");
    });

    const label = document.createElement("span");
    label.classList.add("task-text");
    if (task.done) label.classList.add("task-done");
    label.textContent = task.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "✕";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.setAttribute("aria-label", "Obriši zadatak");
    deleteBtn.addEventListener("click", () => {
      // Animacija brisanja
      item.style.transition = "opacity 0.2s, transform 0.2s";
      item.style.opacity    = "0";
      item.style.transform  = "translateX(20px)";
      setTimeout(() => {
        tasks[key] = tasks[key].filter(t => t.id !== task.id);
        saveTasks();
        renderTasks();
        renderCalendar();
        showToast("🗑️ Zadatak obrisan");
      }, 200);
    });

    item.appendChild(checkbox);
    item.appendChild(label);
    item.appendChild(deleteBtn);
    taskList.appendChild(item);
  });
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) { showToast("⚠️ Upiši naziv zadatka!"); return; }
  if (!selectedDate) { showToast("⚠️ Prvo odaberi datum!"); return; }

  const key = dateKey(selectedDate);
  if (!tasks[key]) tasks[key] = [];

  tasks[key].push({ id: Date.now(), text, done: false, priority: selectedPriority });

  saveTasks();
  renderTasks();
  renderCalendar(); // osvježi srca u kalendaru
  taskInput.value = "";
  closeModal();
  showToast("🌸 Zadatak dodan!");
}

// ── Modal ───────────────────────────────────────────────────
function openModal() {
  taskModal.classList.remove("hidden");
  taskInput.focus();
}

function closeModal() {
  taskModal.classList.add("hidden");
  taskInput.value = "";
  // Reset priority na "low"
  priorityBtns.forEach(b => b.classList.remove("active"));
  document.querySelector('[data-priority="low"]').classList.add("active");
  selectedPriority = "low";
}

openModalBtn.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);
addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("keydown", e => {
  if (e.key === "Enter") addTask();
});

taskModal.addEventListener("click", e => {
  if (e.target === taskModal) closeModal();
});

// ── Inicijalizacija ─────────────────────────────────────────
renderCalendar();
updateSelectedDateTitle();
renderTasks();