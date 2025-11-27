// ===============================
// MULTI-LANGUAGE SUPPORT
// ===============================
const TRANSLATIONS = {
  en: {
    tagline: "Earn small, stay flexible – UK & EU students",
    postTask: "Post a New Task / Gig",
    title: "Title*",
    description: "Description",
    budget: "Budget (£/€)*",
    category: "Category",
    city: "City / Campus",
    yourName: "Your name (optional)",
    postTaskBtn: "Post Task",
    latestTasks: "Latest Tasks & Gigs",
    filterAll: "All categories",
    catCreative: "Creative",
    catStudy: "Study Help",
    catMicro: "Micro-Task",
    catTech: "Tech / Digital",
    catOther: "Other",
    searchPlaceholder: "Search by title, description or city",
    login: "Login",
    register: "Register",
    logout: "Logout",
    dashboard: "My Dashboard",
    myTasks: "My Tasks",
    myApplications: "My Applications",
    applyForTask: "Apply for this task",
    viewApplications: "View applications",
    msgMustLoginPost: "You must be logged in to post a task.",
    msgMustLoginApply: "Please log in to apply for a task.",
    msgTaskSuccess: "Task posted successfully!",
    msgLoginSuccess: "Login successful.",
    msgRegisterSuccess: "Registration successful! You are now logged in.",
  },
  ro: {
    tagline: "Câștigă puțin, rămâi flexibil – studenți UK & UE",
    postTask: "Publică un Task / Gig",
    title: "Titlu*",
    description: "Descriere",
    budget: "Buget (£/€)*",
    category: "Categorie",
    city: "Oraș / Campus",
    yourName: "Numele tău (opțional)",
    postTaskBtn: "Publică taskul",
    latestTasks: "Ultimele Task-uri & Gig-uri",
    filterAll: "Toate categoriile",
    catCreative: "Creativ",
    catStudy: "Ajutor la învățat",
    catMicro: "Micro-task",
    catTech: "Tech / Digital",
    catOther: "Altele",
    searchPlaceholder: "Caută după titlu, descriere sau oraș",
    login: "Autentificare",
    register: "Înregistrare",
    logout: "Deconectare",
    dashboard: "Dashboard-ul meu",
    myTasks: "Task-urile mele",
    myApplications: "Aplicațiile mele",
    applyForTask: "Aplică pentru acest task",
    viewApplications: "Vezi aplicațiile",
    msgMustLoginPost: "Trebuie să fii autentificat ca să publici un task.",
    msgMustLoginApply: "Autentifică-te ca să poți aplica la un task.",
    msgTaskSuccess: "Task-ul a fost publicat!",
    msgLoginSuccess: "Autentificare reușită.",
    msgRegisterSuccess: "Înregistrare reușită! Acum ești autentificat.",
  },
};

let currentLang = window.localStorage.getItem("sh_lang") || "en";

function translatePage() {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  // Text nodes
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) el.textContent = t[key];
  });

  // Placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key]) el.placeholder = t[key];
  });
}

function setupLanguageButtons() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.getAttribute("data-lang") === currentLang
    );
    btn.addEventListener("click", () => {
      currentLang = btn.getAttribute("data-lang");
      window.localStorage.setItem("sh_lang", currentLang);
      document
        .querySelectorAll(".lang-btn")
        .forEach((b) =>
          b.classList.toggle(
            "active",
            b.getAttribute("data-lang") === currentLang
          )
        );
      translatePage();
      renderTasks(); // re-render buttons text if needed
    });
  });
}

// ===============================
// DOM ELEMENTS
// ===============================
const tasksList = document.getElementById("tasks-list");
const taskForm = document.getElementById("task-form");
const formMessage = document.getElementById("form-message");
const filterCategory = document.getElementById("filter-category");
const filterSearch = document.getElementById("filter-search");

// Auth elements
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const logoutBtn = document.getElementById("logout-btn");
const userInfoSpan = document.getElementById("user-info");
const userNameSpan = document.getElementById("user-name");

// Auth popups
const loginPopup = document.getElementById("login-popup");
const registerPopup = document.getElementById("register-popup");
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const loginSubmitBtn = document.getElementById("login-submit");
const loginMsg = document.getElementById("login-msg");

const regNameInput = document.getElementById("reg-name");
const regEmailInput = document.getElementById("reg-email");
const regPasswordInput = document.getElementById("reg-password");
const regSubmitBtn = document.getElementById("register-submit");
const regMsg = document.getElementById("register-msg");

const createdByInput = document.getElementById("createdBy");

// Dashboard (optional - only if you added it in HTML)
const dashboardSection = document.getElementById("dashboard");
const dashboardContent = document.getElementById("dashboard-content");
const tabMyTasks = document.getElementById("tab-my-tasks");
const tabMyApps = document.getElementById("tab-my-apps");

// ===============================
// APP STATE
// ===============================
let allTasks = [];
let authToken = null;
let currentUser = null;

// ===============================
// AUTH HELPERS
// ===============================
function updateAuthUI() {
  if (currentUser && authToken) {
    // show logged-in UI
    if (userInfoSpan) userInfoSpan.style.display = "inline-flex";
    if (loginBtn) loginBtn.style.display = "none";
    if (registerBtn) registerBtn.style.display = "none";
    if (userNameSpan) userNameSpan.textContent = currentUser.name;
    if (createdByInput) createdByInput.value = currentUser.name;
  } else {
    // show logged-out UI
    if (userInfoSpan) userInfoSpan.style.display = "none";
    if (loginBtn) loginBtn.style.display = "inline-flex";
    if (registerBtn) registerBtn.style.display = "inline-flex";
    if (createdByInput) createdByInput.value = "";
  }
  renderTasks();
  updateDashboardVisibility();
}

function setLoggedIn(user, token) {
  currentUser = user;
  authToken = token;
  window.localStorage.setItem(
    "sh_auth",
    JSON.stringify({ user: currentUser, token: authToken })
  );
  updateAuthUI();
}

function setLoggedOut() {
  currentUser = null;
  authToken = null;
  window.localStorage.removeItem("sh_auth");
  updateAuthUI();
}

function restoreAuthFromStorage() {
  try {
    const raw = window.localStorage.getItem("sh_auth");
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data?.user && data?.token) {
      currentUser = data.user;
      authToken = data.token;
    }
  } catch (err) {
    console.error("Failed to restore auth:", err);
  }
  updateAuthUI();
}

// ===============================
// POPUP HELPERS
// ===============================
function openPopup(el) {
  if (!el) return;
  el.classList.remove("hidden");
  el.classList.add("show");
}

function closePopup(el) {
  if (!el) return;
  el.classList.remove("show");
  el.classList.add("hidden");
}

// ===============================
// FETCH TASKS
// ===============================
async function loadTasks() {
  tasksList.innerHTML = "<p>Loading tasks...</p>";
  try {
    const res = await fetch("/api/tasks");
    const tasks = await res.json();
    allTasks = tasks;
    renderTasks();
  } catch (err) {
    console.error(err);
    tasksList.innerHTML =
      "<p class='error'>Failed to load tasks. Please try again.</p>";
  }
}

// ===============================
// RENDER TASKS
// ===============================
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderTasks() {
  const search = filterSearch ? filterSearch.value.trim().toLowerCase() : "";
  const category = filterCategory ? filterCategory.value : "all";

  const filtered = allTasks
    .slice()
    .reverse()
    .filter((task) => {
      const matchesCategory =
        category === "all" || task.category === category;

      const combinedText = `${task.title} ${
        task.description || ""
      } ${task.city || ""}`.toLowerCase();
      const matchesSearch = !search || combinedText.includes(search);

      return matchesCategory && matchesSearch;
    });

  if (!filtered.length) {
    tasksList.innerHTML = "<p>No tasks found with current filters.</p>";
    return;
  }

  tasksList.innerHTML = "";
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  filtered.forEach((task) => {
    const card = document.createElement("article");
    card.className = "task-card";
    card.innerHTML = `
      <div class="task-header">
        <h3>${escapeHtml(task.title)}</h3>
        <span class="task-budget">£/€ ${task.budget}</span>
      </div>
      <p class="task-meta">
        <span>${escapeHtml(task.category)}</span>
        ${task.city ? `• <span>${escapeHtml(task.city)}</span>` : ""}
      </p>
      ${
        task.description
          ? `<p class="task-desc">${escapeHtml(task.description)}</p>`
          : ""
      }
      <p class="task-footer">
        ${t.postedBy || "Posted by"} ${escapeHtml(task.createdBy || "Anonymous")} ·
        ${new Date(task.createdAt).toLocaleString()}
      </p>
    `;

    // Apply button
    const applyBtn = document.createElement("button");
    applyBtn.className = "apply-btn";
    applyBtn.textContent = t.applyForTask || "Apply for this task";
    if (!authToken) {
      applyBtn.disabled = true;
      applyBtn.title = t.msgMustLoginApply || "Please log in to apply.";
    }
    applyBtn.addEventListener("click", () => openApplicationPrompt(task));
    card.appendChild(applyBtn);

    // View applications
    const viewBtn = document.createElement("button");
    viewBtn.className = "view-apps-btn";
    viewBtn.textContent = t.viewApplications || "View applications";
    viewBtn.addEventListener("click", () => viewApplications(task));
    card.appendChild(viewBtn);

    tasksList.appendChild(card);
  });
}

// ===============================
// TASK FORM SUBMIT
// ===============================
taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "";
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  if (!authToken) {
    alert(t.msgMustLoginPost || "You must be logged in to post a task.");
    return;
  }

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const budget = document.getElementById("budget").value;
  const category = document.getElementById("category").value;
  const city = document.getElementById("city").value.trim();
  let createdBy = createdByInput ? createdByInput.value.trim() : "";

  if (currentUser && currentUser.name) {
    createdBy = currentUser.name;
  }

  if (!title || !budget) {
    formMessage.textContent = "Please fill in title and budget.";
    formMessage.className = "sh-message error";
    return;
  }

  try {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        budget,
        category,
        city,
        createdBy,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to create task.");
    }

    taskForm.reset();
    if (currentUser && createdByInput) {
      createdByInput.value = currentUser.name;
    }

    formMessage.textContent = t.msgTaskSuccess || "Task posted successfully!";
    formMessage.className = "sh-message success";
    await loadTasks();
  } catch (err) {
    console.error(err);
    formMessage.textContent = err.message;
    formMessage.className = "sh-message error";
  }
});

// ===============================
// APPLY TO TASK
// ===============================
async function openApplicationPrompt(task) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  if (!authToken) {
    alert(t.msgMustLoginApply || "Please log in to apply for a task.");
    return;
  }

  const applicantName = prompt(
    `Applying for: ${task.title}\n\nEnter your name:`
  );
  if (!applicantName) return;

  const message = prompt("Write a short message to the task owner:");
  if (!message) return;

  const offerBudgetInput = prompt(
    "Offer budget (£/€) (optional – leave empty to skip):"
  );
  const offerBudget = offerBudgetInput ? Number(offerBudgetInput) : null;

  try {
    const res = await fetch(`/api/tasks/${task._id}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicantName,
        message,
        offerBudget,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to apply for task.");
    }

    alert("Your application has been sent!");
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
}

// ===============================
// VIEW APPLICATIONS PER TASK
// ===============================
async function viewApplications(task) {
  try {
    const res = await fetch(`/api/tasks/${task._id}/applications`);
    if (!res.ok) {
      throw new Error("Failed to fetch applications.");
    }
    const apps = await res.json();

    if (!apps.length) {
      alert("No applications yet for this task.");
      return;
    }

    const lines = apps.map((app, index) => {
      const budgetText =
        app.offerBudget != null ? ` • Offer: £/€ ${app.offerBudget}` : "";
      return `${index + 1}. ${app.applicantName}${budgetText}\n   "${
        app.message
      }"`;
    });

    alert(`Applications for "${task.title}":\n\n` + lines.join("\n\n"));
  } catch (err) {
    console.error(err);
    alert("Error loading applications: " + err.message);
  }
}

// ===============================
// DASHBOARD (My Tasks / My Applications)
// ===============================
function updateDashboardVisibility() {
  if (!dashboardSection) return;
  dashboardSection.style.display = authToken ? "block" : "none";
}

async function loadMyTasks() {
  if (!dashboardContent || !currentUser) return;
  const res = await fetch("/api/tasks");
  const tasks = await res.json();

  const my = tasks.filter((t) => t.createdBy === currentUser.name);
  let html = "<h3>My Posted Tasks</h3>";
  if (!my.length) html += "<p>No tasks posted yet.</p>";

  my.forEach((t) => {
    html += `<div class="task-entry">
      <strong>${escapeHtml(t.title)}</strong> – £${t.budget}<br/>
      <small>${escapeHtml(t.city || "")}</small>
    </div>`;
  });

  dashboardContent.innerHTML = html;
}

async function loadMyApplications() {
  if (!dashboardContent || !currentUser) return;
  const name = encodeURIComponent(currentUser.name);
  const res = await fetch(`/api/applications?applicantName=${name}`);
  const apps = await res.json();

  let html = "<h3>My Applications</h3>";
  if (!apps.length) html += "<p>No applications yet.</p>";

  apps.forEach((a) => {
    html += `<div class="application-entry">
      <strong>Offer: £${a.offerBudget ?? "-"}</strong><br/>
      <small>${escapeHtml(a.message || "")}</small>
    </div>`;
  });

  dashboardContent.innerHTML = html;
}

if (tabMyTasks && tabMyApps) {
  tabMyTasks.addEventListener("click", () => {
    tabMyTasks.classList.add("active");
    tabMyApps.classList.remove("active");
    loadMyTasks();
  });

  tabMyApps.addEventListener("click", () => {
    tabMyApps.classList.add("active");
    tabMyTasks.classList.remove("active");
    loadMyApplications();
  });
}

// ===============================
// AUTH EVENT LISTENERS
// ===============================
if (loginBtn && loginPopup) {
  loginBtn.addEventListener("click", () => {
    loginMsg.textContent = "";
    openPopup(loginPopup);
  });
}
if (registerBtn && registerPopup) {
  registerBtn.addEventListener("click", () => {
    regMsg.textContent = "";
    openPopup(registerPopup);
  });
}
document.querySelectorAll(".close-popup").forEach((btn) => {
  btn.addEventListener("click", () => {
    closePopup(loginPopup);
    closePopup(registerPopup);
  });
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    setLoggedOut();
  });
}

// Login submit
if (loginSubmitBtn) {
  loginSubmitBtn.addEventListener("click", async () => {
    loginMsg.textContent = "";
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;

    if (!email || !password) {
      loginMsg.textContent = "Email and password are required.";
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed.");
      }

      setLoggedIn(data.user, data.token);
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      loginMsg.textContent = t.msgLoginSuccess || "Login successful.";
      closePopup(loginPopup);
    } catch (err) {
      console.error(err);
      loginMsg.textContent = err.message;
    }
  });
}

// Register submit
if (regSubmitBtn) {
  regSubmitBtn.addEventListener("click", async () => {
    regMsg.textContent = "";
    const name = regNameInput.value.trim();
    const email = regEmailInput.value.trim();
    const password = regPasswordInput.value;

    if (!name || !email || !password) {
      regMsg.textContent = "Name, email and password are required.";
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      setLoggedIn(data.user, data.token);
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      regMsg.textContent =
        t.msgRegisterSuccess || "Registration successful! You are now logged in.";
      closePopup(registerPopup);
    } catch (err) {
      console.error(err);
      regMsg.textContent = err.message;
    }
  });
}

// ===============================
// FILTER LISTENERS
// ===============================
if (filterCategory) {
  filterCategory.addEventListener("change", renderTasks);
}
if (filterSearch) {
  filterSearch.addEventListener("input", renderTasks);
}

// ===============================
// INIT
// ===============================
translatePage();
setupLanguageButtons();
restoreAuthFromStorage();
loadTasks();
updateDashboardVisibility();
