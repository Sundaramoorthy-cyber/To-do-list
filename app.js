const STORAGE_KEY = "daily-todo-tasks";

const todayHeading = document.querySelector("#today");
const addForm = document.querySelector("#add-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const remainingCount = document.querySelector("#remaining-count");
const clearCompletedButton = document.querySelector("#clear-completed");

const tasks = loadTasks();

todayHeading.textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
}).format(new Date());

addForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.focus();
    return;
  }

  tasks.push({ id: createTaskId(), text, completed: false });
  taskInput.value = "";
  saveAndRender();
  taskInput.focus();
});

clearCompletedButton.addEventListener("click", () => {
  tasks.splice(0, tasks.length, ...tasks.filter((task) => !task.completed));
  saveAndRender();
});

function createTaskId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (task) =>
        task &&
        typeof task.id === "string" &&
        typeof task.text === "string" &&
        typeof task.completed === "boolean",
    );
  } catch (error) {
    console.error("Could not read saved daily todo tasks.", error);
    return [];
  }
}

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  renderTasks();
}

function renderTasks() {
  taskList.replaceChildren();

  for (const task of tasks) {
    taskList.append(createTaskElement(task));
  }

  const remaining = tasks.filter((task) => !task.completed).length;
  remainingCount.textContent = `${remaining} ${remaining === 1 ? "task" : "tasks"} left`;
  emptyState.hidden = tasks.length > 0;
  clearCompletedButton.disabled = !tasks.some((task) => task.completed);
}

function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = `task-item${task.completed ? " is-complete" : ""}`;

  const checkbox = document.createElement("input");
  checkbox.className = "task-check";
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", `Mark "${task.text}" ${task.completed ? "incomplete" : "complete"}`);
  checkbox.addEventListener("change", () => {
    task.completed = checkbox.checked;
    saveAndRender();
  });
  item.append(checkbox);

  const label = document.createElement("span");
  label.className = "task-text";
  label.textContent = task.text;
  item.append(label);

  const actions = document.createElement("div");
  actions.className = "task-actions";
  actions.append(
    createActionButton("Edit", "Edit task", () => startEditing(item, task)),
    createActionButton("Delete", `Delete "${task.text}"`, () => {
      const taskIndex = tasks.findIndex((entry) => entry.id === task.id);
      if (taskIndex !== -1) tasks.splice(taskIndex, 1);
      saveAndRender();
    }, "delete-button"),
  );
  item.append(actions);
  return item;
}

function createActionButton(text, label, onClick, extraClass = "") {
  const button = document.createElement("button");
  button.className = `task-action ${extraClass}`.trim();
  button.type = "button";
  button.textContent = text;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", onClick);
  return button;
}

function startEditing(item, task) {
  const input = document.createElement("input");
  input.className = "edit-input";
  input.type = "text";
  input.value = task.text;
  input.setAttribute("aria-label", `Edit "${task.text}"`);

  const saveButton = createActionButton("Save", "Save task", () => {
    const text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }
    task.text = text;
    saveAndRender();
  });
  const cancelButton = createActionButton("Cancel", "Cancel editing", renderTasks);

  item.replaceChildren(input, saveButton, cancelButton);
  input.focus();
  input.select();
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveButton.click();
    } else if (event.key === "Escape") {
      renderTasks();
    }
  });
}

renderTasks();
