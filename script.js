const monthNames = [
  "Siječanj", "Veljača", "Ožujak", "Travanj", "Svibanj", "Lipanj",
  "Srpanj", "Kolovoz", "Rujan", "Listopad", "Studeni", "Prosinac"
];

const dayNames = [
  "Nedjelja", "Ponedjeljak", "Utorak", "Srijeda",
  "Četvrtak", "Petak", "Subota"
];

const themeClasses = ["theme-roza", "theme-plava", "theme-ljubicasta", "theme-zelena"];

const typeEmoji = {
  obaveza: "📌",
  ispit: "📋",
  prijatelji: "🧑‍🤝‍🧑",
  ostalo: "🌸"
};

const typeLabel = {
  obaveza: "Obaveza",
  ispit: "Ispit",
  prijatelji: "Prijatelji",
  ostalo: "Ostalo"
};

const priorityLabel = {
  low: "Nisko",
  medium: "Srednje",
  high: "Hitno"
};

const priorityRank = {
  high: 0,
  medium: 1,
  low: 2
};

const reminderLabel = {
  none: "Bez podsjetnika",
  "at-time": "U vrijeme",
  "10m": "10 min prije",
  "30m": "30 min prije",
  "1h": "1 sat prije",
  "1d": "1 dan prije"
};

const reminderOffsetMs = {
  "at-time": 0,
  "10m": 10 * 60 * 1000,
  "30m": 30 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000
};

const monthYear = document.getElementById("monthYear");
const calendarDays = document.getElementById("calendarDays");
const selectedDateTitle = document.getElementById("selectedDateTitle");
const taskCount = document.getElementById("taskCount");

const weeklyList = document.getElementById("weeklyList");
const weeklySummary = document.getElementById("weeklySummary");

const activeTaskList = document.getElementById("activeTaskList");
const completedTaskList = document.getElementById("completedTaskList");
const activeCount = document.getElementById("activeCount");
const completedCount = document.getElementById("completedCount");

const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

const openModalBtn = document.getElementById("openModal");
const closeModalBtn = document.getElementById("closeModal");
const taskModal = document.getElementById("taskModal");
const modalTitle = document.getElementById("modalTitle");
const taskInput = document.getElementById("taskInput");
const taskDateInput = document.getElementById("taskDateInput");
const taskTimeInput = document.getElementById("taskTimeInput");
const taskReminderSelect = document.getElementById("taskReminderSelect");
const taskRecurrenceSelect = document.getElementById("taskRecurrenceSelect");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const deleteTaskBtn = document.getElementById("deleteTaskBtn");

const priorityBtns = document.querySelectorAll(".priority-btn");
const typeBtns = document.querySelectorAll(".task-type-btn");
const filterBtns = document.querySelectorAll(".filter-btn");

const progressWrap = document.getElementById("progressWrap");
const progressBar = document.getElementById("progressBar");
const progressLabel = document.getElementById("progressLabel");

const globalSearchInput = document.getElementById("globalSearchInput");
const globalSearchResults = document.getElementById("globalSearchResults");
const searchResultsList = document.getElementById("searchResultsList");
const closeSearchResultsBtn = document.getElementById("closeSearchResults");

const openSettingsBtn = document.getElementById("openSettingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const settingsThemeBtns = document.querySelectorAll(".settings-theme-btn");
const darkModeToggle = document.getElementById("darkModeToggle");
const clearAllTasksBtn = document.getElementById("clearAllTasksBtn");
const enableNotificationsBtn = document.getElementById("enableNotificationsBtn");

const themeModal = document.getElementById("themeModal");
const themePreviewCards = document.querySelectorAll(".theme-preview-card");

const toastEl = document.getElementById("toast");

const today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();
let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

let selectedPriority = "low";
let selectedType = "obaveza";
let selectedFilter = "sve";

let editingTaskId = null;

let tasks = loadTasks();
let settings = loadSettings();
let reminderLog = loadReminderLog();

function loadTasks() {
  try {
    const raw = JSON.parse(localStorage.getItem("tasks_v2")) || [];
    return raw.map(normalizeTask);
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem("tasks_v2", JSON.stringify(tasks));
}

function loadSettings() {
  return {
    theme: localStorage.getItem("theme") || "theme-roza",
    darkMode: JSON.parse(localStorage.getItem("darkMode") || "false")
  };
}

function saveSettings() {
  localStorage.setItem("theme", settings.theme);
  localStorage.setItem("darkMode", JSON.stringify(settings.darkMode));
}

function loadReminderLog() {
  try {
    return JSON.parse(localStorage.getItem("reminder_log")) || {};
  } catch {
    return {};
  }
}

function saveReminderLog() {
  localStorage.setItem("reminder_log", JSON.stringify(reminderLog));
}

function normalizeTask(task) {
  return {
    id: task.id || String(Date.now() + Math.random()),
    text: String(task.text || "").trim(),
    date: task.date || formatDateInputValue(today),
    time: task.time || "",
    doneDates: Array.isArray(task.doneDates) ? task.doneDates : (task.done ? [task.date || formatDateInputValue(today)] : []),
    priority: task.priority || "low",
    type: task.type || "obaveza",
    reminder: task.reminder || "none",
    recurrence: task.recurrence || "none",
    createdAt: task.createdAt || Date.now()
  };
}

function formatDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateInputValue(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getTaskEmoji(type) {
  return typeEmoji[type] || "📌";
}

function getTypeText(type) {
  return typeLabel[type] || "Obaveza";
}

function getPriorityText(priority) {
  return priorityLabel[priority] || "Nisko";
}

function pluralZadatak(n) {
  if (n === 1) return "1 zadatak";
  if (n >= 2 && n <= 4) return `${n} zadatka`;
  return `${n} zadataka`;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function isSameDay(a, b) {
  return formatDateInputValue(a) === formatDateInputValue(b);
}

function getWeekStart(date) {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return startOfDay(addDays(date, diff));
}

function formatLongDate(dateValue) {
  const date = typeof dateValue === "string" ? parseDateInputValue(dateValue) : dateValue;
  return `${dayNames[date.getDay()]}, ${date.getDate()}. ${monthNames[date.getMonth()]} ${date.getFullYear()}.`;
}

function formatShortDate(dateValue) {
  const date = typeof dateValue === "string" ? parseDateInputValue(dateValue) : dateValue;
  return `${date.getDate()}. ${monthNames[date.getMonth()]}`;
}

function formatTime(time) {
  return time || "Bez vremena";
}

function setSelectedDate(date) {
  selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  currentMonth = selectedDate.getMonth();
  currentYear = selectedDate.getFullYear();
  updateSelectedDateTitle();
  renderCalendar();
  renderDayTasks();
  renderWeeklyOverview();
}

function updateSelectedDateTitle() {
  selectedDateTitle.textContent = formatLongDate(selectedDate);
}

function occurrenceExistsOnDate(task, date) {
  const target = startOfDay(date);
  const base = startOfDay(parseDateInputValue(task.date));

  if (target < base) return false;

  if (task.recurrence === "none") {
    return isSameDay(target, base);
  }

  if (task.recurrence === "daily") {
    return true;
  }

  if (task.recurrence === "weekly") {
    const diffDays = Math.floor((target - base) / (24 * 60 * 60 * 1000));
    return diffDays % 7 === 0;
  }

  if (task.recurrence === "monthly") {
    return target.getDate() === base.getDate();
  }

  return false;
}

function getOccurrenceKey(taskId, dateStr) {
  return `${taskId}__${dateStr}`;
}

function isOccurrenceDone(task, dateStr) {
  return task.doneDates.includes(dateStr);
}

function toggleOccurrenceDone(taskId, dateStr, done) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  if (done) {
    if (!task.doneDates.includes(dateStr)) {
      task.doneDates.push(dateStr);
    }
  } else {
    task.doneDates = task.doneDates.filter(d => d !== dateStr);
  }

  saveTasks();
}

function getTasksForDate(date) {
  const dateStr = formatDateInputValue(date);

  return tasks
    .filter(task => occurrenceExistsOnDate(task, date))
    .map(task => ({
      taskId: task.id,
      occurrenceDate: dateStr,
      occurrenceDateObj: parseDateInputValue(dateStr),
      text: task.text,
      priority: task.priority,
      type: task.type,
      time: task.time,
      reminder: task.reminder,
      recurrence: task.recurrence,
      done: isOccurrenceDone(task, dateStr)
    }));
}

function sortOccurrences(list) {
  return [...list].sort((a, b) => {
    const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    const timeA = a.time || "99:99";
    const timeB = b.time || "99:99";
    if (timeA !== timeB) return timeA.localeCompare(timeB);

    return a.text.localeCompare(b.text, "hr");
  });
}

function getCalendarIndicator(dayTasks) {
  if (dayTasks.length === 0) return null;
  if (dayTasks.length === 1) {
    return { type: "emoji", value: getTaskEmoji(dayTasks[0].type) };
  }
  return { type: "count", value: String(dayTasks.length) };
}

function renderCalendar() {
  calendarDays.innerHTML = "";
  monthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  const firstDayRaw = new Date(currentYear, currentMonth, 1).getDay();
  const firstDayOfMonth = (firstDayRaw + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDayOfMonth; i++) {
    const empty = document.createElement("div");
    empty.classList.add("day", "empty-day");
    calendarDays.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day");
    dayDiv.tabIndex = 0;

    const number = document.createElement("div");
    number.textContent = day;
    dayDiv.appendChild(number);

    const dayTasks = getTasksForDate(date);
    const indicator = getCalendarIndicator(dayTasks);

    if (indicator?.type === "emoji") {
      const marker = document.createElement("div");
      marker.textContent = indicator.value;
      marker.classList.add("day-indicator");
      dayDiv.appendChild(marker);
    }

    if (indicator?.type === "count") {
      const badge = document.createElement("div");
      badge.textContent = indicator.value;
      badge.classList.add("day-count-badge");
      dayDiv.appendChild(badge);
    }

    if (isSameDay(date, today)) dayDiv.classList.add("today");
    if (selectedDate && isSameDay(date, selectedDate)) dayDiv.classList.add("selected");

    const handleSelect = () => setSelectedDate(date);

    dayDiv.addEventListener("click", handleSelect);
    dayDiv.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSelect();
      }
    });

    calendarDays.appendChild(dayDiv);
  }
}

function updateProgress(dayTasks) {
  if (dayTasks.length === 0) {
    progressWrap.style.display = "none";
    return;
  }

  const done = dayTasks.filter(t => t.done).length;
  const pct = Math.round((done / dayTasks.length) * 100);

  progressWrap.style.display = "block";
  progressBar.style.width = `${pct}%`;
  progressLabel.textContent = `${done} / ${dayTasks.length}`;
}

function buildTaskMeta(occurrence) {
  const parts = [
    formatTime(occurrence.time),
    getTypeText(occurrence.type),
    getPriorityText(occurrence.priority)
  ];

  if (occurrence.recurrence !== "none") {
    const recurrenceText = {
      daily: "Svaki dan",
      weekly: "Svaki tjedan",
      monthly: "Svaki mjesec"
    }[occurrence.recurrence];
    parts.push(recurrenceText);
  }

  if (occurrence.reminder !== "none") {
    parts.push(reminderLabel[occurrence.reminder]);
  }

  return parts.join(" • ");
}

function renderTaskList(listEl, items, emptyText) {
  listEl.innerHTML = "";

  if (items.length === 0) {
    listEl.innerHTML = `<p class="empty-message">${emptyText}</p>`;
    return;
  }

  items.forEach(occurrence => {
    const item = document.createElement("div");
    item.className = `task-item priority-${occurrence.priority}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = occurrence.done;
    checkbox.className = "task-checkbox";
    checkbox.addEventListener("change", () => {
      toggleOccurrenceDone(occurrence.taskId, occurrence.occurrenceDate, checkbox.checked);
      renderDayTasks();
      renderWeeklyOverview();
      if (checkbox.checked) showToast("✅ Zadatak završen!");
    });

    const main = document.createElement("div");
    main.className = "task-main";

    const text = document.createElement("div");
    text.className = "task-text";
    if (occurrence.done) text.classList.add("task-done");
    text.textContent = `${getTaskEmoji(occurrence.type)} ${occurrence.text}`;

    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.textContent = buildTaskMeta(occurrence);

    main.appendChild(text);
    main.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn";
    editBtn.type = "button";
    editBtn.textContent = "✏️";
    editBtn.setAttribute("aria-label", "Uredi zadatak");
    editBtn.addEventListener("click", () => openEditModal(occurrence.taskId));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "icon-btn";
    deleteBtn.type = "button";
    deleteBtn.textContent = "🗑️";
    deleteBtn.setAttribute("aria-label", "Obriši zadatak");
    deleteBtn.addEventListener("click", () => deleteTask(occurrence.taskId));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(checkbox);
    item.appendChild(main);
    item.appendChild(actions);

    listEl.appendChild(item);
  });
}

function renderDayTasks() {
  const dayTasks = sortOccurrences(getTasksForDate(selectedDate));
  const filtered = selectedFilter === "sve"
    ? dayTasks
    : dayTasks.filter(task => task.type === selectedFilter);

  const activeTasks = filtered.filter(task => !task.done);
  const doneTasks = filtered.filter(task => task.done);

  taskCount.textContent = pluralZadatak(filtered.length);
  activeCount.textContent = String(activeTasks.length);
  completedCount.textContent = String(doneTasks.length);

  updateProgress(filtered);

  renderTaskList(activeTaskList, activeTasks, "Nema aktivnih zadataka za ovaj dan.");
  renderTaskList(completedTaskList, doneTasks, "Nema završenih zadataka za ovaj dan.");
}

function renderWeeklyOverview() {
  const weekStart = getWeekStart(selectedDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weeklyOccurrences = sortOccurrences(
    weekDates.flatMap(date =>
      getTasksForDate(date).map(task => ({
        ...task,
        displayDate: formatShortDate(date),
        displayDateObj: date
      }))
    )
  );

  weeklyList.innerHTML = "";
  weeklySummary.textContent = pluralZadatak(weeklyOccurrences.length);

  if (weeklyOccurrences.length === 0) {
    weeklyList.innerHTML = '<p class="empty-message small-empty">Nema zadataka za ovaj tjedan.</p>';
    return;
  }

  weeklyOccurrences.slice(0, 7).forEach(occurrence => {
    const item = document.createElement("div");
    item.className = "weekly-item";
    item.addEventListener("click", () => {
      setSelectedDate(parseDateInputValue(occurrence.occurrenceDate));
    });

    item.innerHTML = `
      <div class="weekly-item-top">
        <div class="weekly-item-title">${getTaskEmoji(occurrence.type)} ${escapeHtml(occurrence.text)}</div>
        <div class="weekly-item-date">${occurrence.displayDate}</div>
      </div>
      <div class="task-meta">${buildTaskMeta(occurrence)}</div>
    `;

    weeklyList.appendChild(item);
  });
}

function openAddModal() {
  editingTaskId = null;
  modalTitle.textContent = "Dodaj zadatak";
  saveTaskBtn.textContent = "Spremi zadatak";
  deleteTaskBtn.classList.add("hidden");

  taskInput.value = "";
  taskDateInput.value = formatDateInputValue(selectedDate);
  taskTimeInput.value = "";
  taskReminderSelect.value = "none";
  taskRecurrenceSelect.value = "none";

  setSelectedTypeButton("obaveza");
  setSelectedPriorityButton("low");

  taskModal.classList.remove("hidden");
  taskInput.focus();
}

function openEditModal(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  editingTaskId = taskId;
  modalTitle.textContent = "Uredi zadatak";
  saveTaskBtn.textContent = "Spremi promjene";
  deleteTaskBtn.classList.remove("hidden");

  taskInput.value = task.text;
  taskDateInput.value = task.date;
  taskTimeInput.value = task.time;
  taskReminderSelect.value = task.reminder;
  taskRecurrenceSelect.value = task.recurrence;

  setSelectedTypeButton(task.type);
  setSelectedPriorityButton(task.priority);

  taskModal.classList.remove("hidden");
  taskInput.focus();
}

function closeModal() {
  taskModal.classList.add("hidden");
  editingTaskId = null;
}

function setSelectedPriorityButton(priority) {
  selectedPriority = priority;
  priorityBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.priority === priority);
  });
}

function setSelectedTypeButton(type) {
  selectedType = type;
  typeBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.type === type);
  });
}

function saveTaskFromModal() {
  const text = taskInput.value.trim();
  const date = taskDateInput.value;

  if (!text) {
    showToast("⚠️ Upiši naziv zadatka!");
    return;
  }

  if (!date) {
    showToast("⚠️ Odaberi datum!");
    return;
  }

  const payload = {
    text,
    date,
    time: taskTimeInput.value,
    priority: selectedPriority,
    type: selectedType,
    reminder: taskReminderSelect.value,
    recurrence: taskRecurrenceSelect.value
  };

  if (editingTaskId) {
    const task = tasks.find(t => t.id === editingTaskId);
    if (!task) return;

    task.text = payload.text;
    task.date = payload.date;
    task.time = payload.time;
    task.priority = payload.priority;
    task.type = payload.type;
    task.reminder = payload.reminder;
    task.recurrence = payload.recurrence;
    showToast("✏️ Zadatak ažuriran");
  } else {
    tasks.push({
      id: String(Date.now() + Math.random()),
      ...payload,
      doneDates: [],
      createdAt: Date.now()
    });
    showToast("🌸 Zadatak dodan!");
  }

  saveTasks();
  closeModal();
  renderEverything();
}

function deleteTask(taskId = editingTaskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const confirmed = confirm(`Obrisati zadatak "${task.text}"?`);
  if (!confirmed) return;

  tasks = tasks.filter(t => t.id !== taskId);
  saveTasks();
  closeModal();
  renderEverything();
  showToast("🗑️ Zadatak obrisan");
}

function renderEverything() {
  renderCalendar();
  renderDayTasks();
  renderWeeklyOverview();
}

function applyTheme() {
  document.body.classList.remove(...themeClasses);
  document.body.classList.add(settings.theme);
  document.body.classList.toggle("dark-mode", settings.darkMode);
  darkModeToggle.checked = settings.darkMode;

  settingsThemeBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === settings.theme);
  });
}

function openSearchResults() {
  globalSearchResults.classList.remove("hidden");
}

function closeSearchResults() {
  globalSearchResults.classList.add("hidden");
}

function searchOccurrences(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const start = addMonths(startOfDay(today), -1);
  const end = addMonths(startOfDay(today), 3);

  const results = [];

  for (let date = new Date(start); date <= end; date = addDays(date, 1)) {
    const occurrences = getTasksForDate(date);
    occurrences.forEach(occurrence => {
      const haystack = [
        occurrence.text,
        getTypeText(occurrence.type),
        getPriorityText(occurrence.priority),
        occurrence.time || ""
      ].join(" ").toLowerCase();

      if (haystack.includes(normalized)) {
        results.push(occurrence);
      }
    });
  }

  return sortOccurrences(results).slice(0, 50);
}

function renderSearchResults(query) {
  searchResultsList.innerHTML = "";

  if (!query.trim()) {
    searchResultsList.innerHTML = '<div class="search-results-empty">Upiši pojam za pretragu.</div>';
    return;
  }

  const results = searchOccurrences(query);

  if (results.length === 0) {
    searchResultsList.innerHTML = '<div class="search-results-empty">Nema rezultata za ovu pretragu.</div>';
    return;
  }

  results.forEach(occurrence => {
    const item = document.createElement("div");
    item.className = "search-result-item";
    item.innerHTML = `
      <div class="search-result-date">${formatLongDate(occurrence.occurrenceDate)}</div>
      <div class="search-result-text">${getTaskEmoji(occurrence.type)} ${escapeHtml(occurrence.text)}</div>
      <div class="search-result-priority">${buildTaskMeta(occurrence)}</div>
    `;

    item.addEventListener("click", () => {
      setSelectedDate(parseDateInputValue(occurrence.occurrenceDate));
      closeSearchResults();
    });

    searchResultsList.appendChild(item);
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    showToast("⚠️ Ovaj preglednik ne podržava notifikacije.");
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    showToast("🔔 Notifikacije uključene");
  } else {
    showToast("⚠️ Notifikacije nisu dopuštene");
  }
}

function getOccurrenceDateTime(occurrence) {
  const [y, m, d] = occurrence.occurrenceDate.split("-").map(Number);
  const result = new Date(y, m - 1, d, 9, 0, 0, 0);

  if (occurrence.time) {
    const [hh, mm] = occurrence.time.split(":").map(Number);
    result.setHours(hh, mm, 0, 0);
  }

  return result;
}

function maybeSendReminders() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const now = new Date();
  const lookAheadEnd = addDays(now, 2);

  for (let date = startOfDay(today); date <= lookAheadEnd; date = addDays(date, 1)) {
    const occurrences = getTasksForDate(date).filter(o => !o.done && o.reminder !== "none");

    occurrences.forEach(occurrence => {
      const when = getOccurrenceDateTime(occurrence);
      const offset = reminderOffsetMs[occurrence.reminder] ?? 0;
      const triggerAt = new Date(when.getTime() - offset);
      const key = getOccurrenceKey(occurrence.taskId, occurrence.occurrenceDate);

      if (now >= triggerAt && !reminderLog[key]) {
        new Notification("Podsjetnik ⏰", {
          body: `${getTaskEmoji(occurrence.type)} ${occurrence.text} • ${formatLongDate(occurrence.occurrenceDate)} • ${formatTime(occurrence.time)}`
        });
        reminderLog[key] = true;
        saveReminderLog();
      }
    });
  }
}

function shouldShowThemeModal() {
  return localStorage.getItem("themeSelected") !== "false";
}

function populateThemeModalMonths() {
  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();

  const prevM = m === 0 ? 11 : m - 1;
  const nextM = m === 11 ? 0 : m + 1;

  // Kratice za krugove (3 slova)
  const short = monthNames.map(n => n.slice(0, 3));

  const elPrev = document.getElementById("themeMonthPrev");
  const elCur  = document.getElementById("themeMonthCurrent");
  const elNext = document.getElementById("themeMonthNext");
  if (elPrev) elPrev.textContent = short[prevM];
  if (elCur)  elCur.textContent  = short[m];
  if (elNext) elNext.textContent = short[nextM];

  // Puni naziv u preview karticama
  const curFull = monthNames[m];
  ["tpMonthRoza","tpMonthLjubicasta","tpMonthZelena","tpMonthPlava"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = curFull;
  });
}

function closeThemeModal() {
  themeModal.classList.add("hidden");
}

function selectInitialTheme(theme) {
  settings.theme = theme;
  saveSettings();
  applyTheme();
  localStorage.setItem("themeSelected", "true");
  closeThemeModal();
  showToast("🎨 Tema odabrana");
}

prevMonthBtn.addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
});

openModalBtn.addEventListener("click", openAddModal);
closeModalBtn.addEventListener("click", closeModal);
saveTaskBtn.addEventListener("click", saveTaskFromModal);
deleteTaskBtn.addEventListener("click", () => deleteTask());

taskInput.addEventListener("keydown", e => {
  if (e.key === "Enter") saveTaskFromModal();
});

taskModal.addEventListener("click", e => {
  if (e.target === taskModal) closeModal();
});

priorityBtns.forEach(btn => {
  btn.addEventListener("click", () => setSelectedPriorityButton(btn.dataset.priority));
});

typeBtns.forEach(btn => {
  btn.addEventListener("click", () => setSelectedTypeButton(btn.dataset.type));
});

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    selectedFilter = btn.dataset.filter;
    filterBtns.forEach(b => b.classList.toggle("active", b.dataset.filter === selectedFilter));
    renderDayTasks();
  });
});

globalSearchInput.addEventListener("input", e => {
  const query = e.target.value;
  if (query.trim()) {
    openSearchResults();
    renderSearchResults(query);
  } else {
    closeSearchResults();
  }
});

globalSearchInput.addEventListener("focus", () => {
  if (globalSearchInput.value.trim()) {
    openSearchResults();
    renderSearchResults(globalSearchInput.value);
  }
});

closeSearchResultsBtn.addEventListener("click", closeSearchResults);
globalSearchResults.addEventListener("click", e => {
  if (e.target === globalSearchResults) closeSearchResults();
});

openSettingsBtn.addEventListener("click", () => settingsModal.classList.remove("hidden"));
closeSettingsBtn.addEventListener("click", () => settingsModal.classList.add("hidden"));
settingsModal.addEventListener("click", e => {
  if (e.target === settingsModal) settingsModal.classList.add("hidden");
});

settingsThemeBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    settings.theme = btn.dataset.theme;
    saveSettings();
    applyTheme();
    localStorage.setItem("themeSelected", "true");
    showToast("🎨 Tema promijenjena");
  });
});

themePreviewCards.forEach(card => {
  card.addEventListener("click", () => {
    selectInitialTheme(card.dataset.theme);
  });
});

darkModeToggle.addEventListener("change", () => {
  settings.darkMode = darkModeToggle.checked;
  saveSettings();
  applyTheme();
});

enableNotificationsBtn.addEventListener("click", requestNotificationPermission);

clearAllTasksBtn.addEventListener("click", () => {
  const confirmed = confirm("Jesi li sigurna da želiš obrisati sve zadatke?");
  if (!confirmed) return;

  tasks = [];
  reminderLog = {};
  saveTasks();
  saveReminderLog();
  renderEverything();
  settingsModal.classList.add("hidden");
  showToast("🗑️ Svi zadaci su obrisani");
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if (!taskModal.classList.contains("hidden")) closeModal();
    if (!settingsModal.classList.contains("hidden")) settingsModal.classList.add("hidden");
    if (!globalSearchResults.classList.contains("hidden")) closeSearchResults();
  }
});

applyTheme();
updateSelectedDateTitle();
taskDateInput.value = formatDateInputValue(selectedDate);
renderEverything();

if (shouldShowThemeModal()) {
  populateThemeModalMonths();
  themeModal.classList.remove("hidden");
} else {
  themeModal.classList.add("hidden");
}

maybeSendReminders();
setInterval(maybeSendReminders, 30000);