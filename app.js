import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const state = {
  mode: "login",
  user: null,
  profile: null,
  users: [],
  leads: [],
  followUps: [],
  reports: [],
  checklist: {},
  leadFilters: {
    search: "",
    status: "",
    source: "",
    category: "",
    manager: ""
  }
};

const $ = (id) => document.getElementById(id);
const today = () => new Date().toISOString().slice(0, 10);
const money = (value) => `$${Number(value || 0).toLocaleString()}`;

const els = {
  authView: $("authView"),
  hubView: $("hubView"),
  loginTab: $("loginTab"),
  registerTab: $("registerTab"),
  authForm: $("authForm"),
  authEmail: $("authEmail"),
  authPassword: $("authPassword"),
  displayNameField: $("displayNameField"),
  displayName: $("displayName"),
  roleField: $("roleField"),
  requestedRole: $("requestedRole"),
  authSubmit: $("authSubmit"),
  authMessage: $("authMessage"),
  userSummary: $("userSummary"),
  logoutBtn: $("logoutBtn"),
  refreshBtn: $("refreshBtn"),
  ownerNavBtn: $("ownerNavBtn"),
  leadForm: $("leadForm"),
  followUpForm: $("followUpForm"),
  reportForm: $("reportForm"),
  saveChecklistBtn: $("saveChecklistBtn")
};

bindEvents();
onAuthStateChanged(auth, handleAuthState);

function bindEvents() {
  els.loginTab.addEventListener("click", () => setAuthMode("login"));
  els.registerTab.addEventListener("click", () => setAuthMode("register"));
  els.authForm.addEventListener("submit", handleAuthSubmit);
  els.logoutBtn.addEventListener("click", () => signOut(auth));
  els.refreshBtn.addEventListener("click", loadData);
  els.leadForm.addEventListener("submit", saveLead);
  $("clearLeadBtn").addEventListener("click", clearLeadForm);
  $("leadSearch").addEventListener("input", updateLeadFilters);
  $("filterStatus").addEventListener("change", updateLeadFilters);
  $("filterSource").addEventListener("change", updateLeadFilters);
  $("filterCategory").addEventListener("change", updateLeadFilters);
  $("filterManager").addEventListener("change", updateLeadFilters);
  $("clearLeadFiltersBtn").addEventListener("click", clearLeadFilters);
  els.followUpForm.addEventListener("submit", saveFollowUp);
  $("clearFollowUpBtn").addEventListener("click", clearFollowUpForm);
  els.reportForm.addEventListener("submit", saveReport);
  els.saveChecklistBtn.addEventListener("click", saveChecklist);

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => showSection(button.dataset.section));
  });

  $("reportDate").value = today();
  $("followUpDate").value = today();
}

function setAuthMode(mode) {
  state.mode = mode;
  const isRegister = mode === "register";
  els.loginTab.classList.toggle("active", !isRegister);
  els.registerTab.classList.toggle("active", isRegister);
  els.displayNameField.classList.toggle("hidden", !isRegister);
  els.roleField.classList.toggle("hidden", !isRegister);
  els.authSubmit.textContent = isRegister ? "Create account" : "Login";
  els.authMessage.textContent = "";
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  setMessage(els.authMessage, "Working...");

  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;

  try {
    if (state.mode === "register") {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const name = els.displayName.value.trim() || email;
      await updateProfile(credential.user, { displayName: name });
      await setDoc(doc(db, "users", credential.user.uid), {
        uid: credential.user.uid,
        email,
        displayName: name,
        role: els.requestedRole.value,
        createdAt: serverTimestamp()
      });
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    els.authForm.reset();
  } catch (error) {
    setMessage(els.authMessage, cleanError(error), true);
  }
}

async function handleAuthState(user) {
  state.user = user;

  if (!user) {
    state.profile = null;
    els.authView.classList.remove("hidden");
    els.hubView.classList.add("hidden");
    return;
  }

  await ensureUserProfile(user);
  els.authView.classList.add("hidden");
  els.hubView.classList.remove("hidden");
  await loadData();
}

async function ensureUserProfile(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email,
      role: "sales_manager",
      createdAt: serverTimestamp()
    });
  }

  const fresh = await getDoc(ref);
  state.profile = fresh.data();
  els.userSummary.textContent = `${state.profile.displayName || state.user.email} | ${labelRole(state.profile.role)}`;
  els.ownerNavBtn.classList.toggle("hidden", !isOwner());
}

function isOwner() {
  return state.profile?.role === "owner";
}

async function loadData() {
  if (!state.user || !state.profile) return;

  const scopeField = isOwner() ? null : where("ownerId", "==", state.user.uid);
  const [users, leads, followUps, reports] = await Promise.all([
    isOwner() ? getDocs(collection(db, "users")) : Promise.resolve({ docs: [] }),
    getDocs(buildScopedQuery("leads", scopeField)),
    getDocs(buildScopedQuery("followUps", scopeField)),
    getDocs(buildScopedQuery("dailyReports", scopeField))
  ]);

  state.users = users.docs.map(toRecord);
  state.leads = leads.docs.map(toRecord).sort(sortBy("createdAt", "desc"));
  state.followUps = followUps.docs.map(toRecord).sort(sortBy("dueDate", "asc"));
  state.reports = reports.docs.map(toRecord).sort(sortBy("date", "desc"));

  await loadChecklist();
  renderAll();
}

function buildScopedQuery(name, scopeField) {
  const base = collection(db, name);
  return scopeField ? query(base, scopeField) : query(base);
}

function toRecord(snap) {
  return { id: snap.id, ...snap.data() };
}

function sortBy(field, direction = "asc") {
  return (a, b) => {
    const first = normalizeSortValue(a[field]);
    const second = normalizeSortValue(b[field]);
    const result = first > second ? 1 : first < second ? -1 : 0;
    return direction === "desc" ? -result : result;
  };
}

function normalizeSortValue(value) {
  if (value?.toMillis) return value.toMillis();
  return value || "";
}

async function loadChecklist() {
  const ref = doc(db, "dailyChecklists", `${state.user.uid}_${today()}`);
  const snap = await getDoc(ref);
  state.checklist = snap.exists() ? snap.data().items || {} : {};
}

function renderAll() {
  renderStats();
  renderLeads();
  renderFollowUps();
  renderReports();
  renderChecklist();
  renderOwnerDashboard();
}

function renderStats() {
  const openLeads = state.leads.filter((lead) => !["booked", "lost"].includes(lead.status));
  const dueFollowUps = state.followUps.filter((item) => item.status !== "done" && item.dueDate <= today());
  const reportsToday = state.reports.filter((report) => report.date === today());

  $("statTotalLeads").textContent = state.leads.length;
  $("statOpenLeads").textContent = openLeads.length;
  $("statDueFollowUps").textContent = dueFollowUps.length;
  $("statReportsToday").textContent = reportsToday.length;

  $("dashboardFollowUps").innerHTML = renderMiniList(
    state.followUps.filter((item) => item.status !== "done").slice(0, 5),
    (item) => `${leadName(item.leadId)} - ${item.type} - ${item.dueDate}`
  );
  $("dashboardLeads").innerHTML = renderMiniList(
    state.leads.slice(0, 5),
    (lead) => `${leadTitle(lead)} - ${labelValue(lead.status)} - ${labelValue(lead.category || "No category")}`
  );
}

function renderMiniList(items, mapper) {
  if (!items.length) return `<p class="muted">Nothing yet.</p>`;
  return items.map((item) => `<div class="record-card">${escapeHtml(mapper(item))}</div>`).join("");
}

function renderLeads() {
  renderManagerOptions();
  const filteredLeads = getFilteredLeads();

  $("leadsList").innerHTML = filteredLeads.length
    ? filteredLeads.map(renderLeadCard).join("")
    : `<article class="record-card"><p class="muted">No leads match the current filters.</p></article>`;

  $("followUpLead").innerHTML = [
    `<option value="">No lead selected</option>`,
    ...state.leads.map((lead) => `<option value="${lead.id}">${escapeHtml(leadTitle(lead))}</option>`)
  ].join("");

  document.querySelectorAll("[data-edit-lead]").forEach((button) => {
    button.addEventListener("click", () => editLead(button.dataset.editLead));
  });
  document.querySelectorAll("[data-delete-lead]").forEach((button) => {
    button.addEventListener("click", () => deleteLead(button.dataset.deleteLead));
  });
}

function renderLeadCard(lead) {
  const createdDate = formatDateTime(lead.createdAt) || lead.createdDate || "-";
  const updatedDate = formatDateTime(lead.updatedAt) || lead.updatedDate || "-";

  return `
    <article class="record-card">
      <div class="record-header">
        <div>
          <div class="record-title">${escapeHtml(leadTitle(lead))}</div>
          <div class="record-meta">
            <span class="badge ${lead.status === "booked" ? "success" : lead.status === "lost" ? "danger" : ""}">${escapeHtml(lead.status)}</span>
            <span>${escapeHtml(labelValue(lead.category || "No category"))}</span>
            <span>${escapeHtml(labelValue(lead.source || "No source"))}</span>
            <span>${escapeHtml(lead.city || "No city")}</span>
            <span>Next: ${escapeHtml(lead.nextFollowUpDate || "No date")}</span>
            <span>Manager: ${escapeHtml(userName(lead.ownerId))}</span>
          </div>
        </div>
        <div class="record-actions">
          <button data-edit-lead="${lead.id}" type="button">Edit</button>
          <button data-delete-lead="${lead.id}" class="danger" type="button">Delete</button>
        </div>
      </div>
      <p class="muted">${escapeHtml(lead.notes || "No notes")}</p>
      <div class="record-meta">
        <span>Contact: ${escapeHtml(lead.contactName || lead.name || "No contact")}</span>
        <span>${escapeHtml(lead.phone || "No phone")}</span>
        <span>${escapeHtml(lead.email || "No email")}</span>
        <span>Created: ${escapeHtml(createdDate)}</span>
        <span>Updated: ${escapeHtml(updatedDate)}</span>
      </div>
    </article>
  `;
}

async function saveLead(event) {
  event.preventDefault();
  const id = $("leadId").value;
  const assignedManagerId = isOwner() ? $("leadAssignedManager").value : state.user.uid;
  const assignedManagerName = userName(assignedManagerId);
  const payload = {
    companyName: $("leadCompanyName").value.trim(),
    contactName: $("leadContactName").value.trim(),
    phone: $("leadPhone").value.trim(),
    email: $("leadEmail").value.trim(),
    city: $("leadCity").value.trim(),
    category: $("leadCategory").value,
    source: $("leadSource").value,
    status: $("leadStatus").value,
    assignedManagerId,
    assignedManagerName,
    nextFollowUpDate: $("leadNextFollowUpDate").value,
    notes: $("leadNotes").value.trim(),
    ownerId: assignedManagerId,
    ownerName: assignedManagerName,
    updatedDate: today(),
    updatedAt: serverTimestamp()
  };

  if (id) {
    await updateDoc(doc(db, "leads", id), payload);
  } else {
    await addDoc(collection(db, "leads"), {
      ...payload,
      createdDate: today(),
      createdAt: serverTimestamp()
    });
  }

  clearLeadForm();
  await loadData();
}

function editLead(id) {
  const lead = state.leads.find((item) => item.id === id);
  if (!lead) return;
  $("leadId").value = lead.id;
  $("leadCompanyName").value = lead.companyName || lead.name || "";
  $("leadContactName").value = lead.contactName || lead.name || "";
  $("leadPhone").value = lead.phone || "";
  $("leadEmail").value = lead.email || "";
  $("leadCity").value = lead.city || "";
  $("leadCategory").value = lead.category || "other";
  $("leadSource").value = lead.source || "other";
  $("leadStatus").value = lead.status || "new";
  $("leadAssignedManager").value = lead.ownerId || state.user.uid;
  $("leadNextFollowUpDate").value = lead.nextFollowUpDate || "";
  $("leadNotes").value = lead.notes || "";
  showSection("leadsSection");
}

async function deleteLead(id) {
  if (!confirm("Delete this lead?")) return;
  await deleteDoc(doc(db, "leads", id));
  await loadData();
}

function clearLeadForm() {
  els.leadForm.reset();
  $("leadId").value = "";
  renderManagerOptions();
}

function renderManagerOptions() {
  const managerOptions = getManagerOptions();
  $("leadAssignedManager").innerHTML = managerOptions
    .map((user) => `<option value="${user.uid}">${escapeHtml(user.displayName || user.email)}</option>`)
    .join("");
  $("leadAssignedManager").disabled = !isOwner();
  $("filterManagerWrap").classList.toggle("hidden", !isOwner());
  $("filterManager").innerHTML = [
    `<option value="">All managers</option>`,
    ...managerOptions.map((user) => `<option value="${user.uid}">${escapeHtml(user.displayName || user.email)}</option>`)
  ].join("");
  $("filterManager").value = state.leadFilters.manager;
  if (!isOwner()) {
    $("leadAssignedManager").value = state.user.uid;
    state.leadFilters.manager = "";
  }
}

function getManagerOptions() {
  if (!isOwner()) {
    return [{
      uid: state.user.uid,
      email: state.user.email,
      displayName: state.profile?.displayName || state.user.email
    }];
  }

  const managers = state.users.filter((user) => ["owner", "sales_manager"].includes(user.role));
  const hasCurrentUser = managers.some((user) => user.uid === state.user.uid);
  return hasCurrentUser ? managers : [{
    uid: state.user.uid,
    email: state.user.email,
    displayName: state.profile?.displayName || state.user.email,
    role: state.profile?.role || "owner"
  }, ...managers];
}

function updateLeadFilters() {
  state.leadFilters = {
    search: $("leadSearch").value.trim().toLowerCase(),
    status: $("filterStatus").value,
    source: $("filterSource").value,
    category: $("filterCategory").value,
    manager: $("filterManager").value
  };
  renderLeads();
}

function clearLeadFilters() {
  $("leadSearch").value = "";
  $("filterStatus").value = "";
  $("filterSource").value = "";
  $("filterCategory").value = "";
  $("filterManager").value = "";
  updateLeadFilters();
}

function getFilteredLeads() {
  return state.leads.filter((lead) => {
    const haystack = [
      lead.companyName,
      lead.contactName,
      lead.name,
      lead.phone,
      lead.email,
      lead.city,
      lead.category,
      lead.source,
      lead.status,
      lead.notes,
      lead.ownerName,
      lead.assignedManagerName
    ].join(" ").toLowerCase();

    if (state.leadFilters.search && !haystack.includes(state.leadFilters.search)) return false;
    if (state.leadFilters.status && lead.status !== state.leadFilters.status) return false;
    if (state.leadFilters.source && lead.source !== state.leadFilters.source) return false;
    if (state.leadFilters.category && lead.category !== state.leadFilters.category) return false;
    if (state.leadFilters.manager && lead.ownerId !== state.leadFilters.manager) return false;
    return true;
  });
}

function renderFollowUps() {
  $("followUpsList").innerHTML = state.followUps.length
    ? state.followUps.map(renderFollowUpCard).join("")
    : `<article class="record-card"><p class="muted">No follow-ups yet.</p></article>`;

  document.querySelectorAll("[data-edit-follow]").forEach((button) => {
    button.addEventListener("click", () => editFollowUp(button.dataset.editFollow));
  });
  document.querySelectorAll("[data-delete-follow]").forEach((button) => {
    button.addEventListener("click", () => deleteFollowUp(button.dataset.deleteFollow));
  });
  document.querySelectorAll("[data-complete-follow]").forEach((button) => {
    button.addEventListener("click", () => completeFollowUp(button.dataset.completeFollow));
  });
}

function renderFollowUpCard(item) {
  const isDue = item.status !== "done" && item.dueDate <= today();
  return `
    <article class="record-card">
      <div class="record-header">
        <div>
          <div class="record-title">${escapeHtml(leadName(item.leadId))}</div>
          <div class="record-meta">
            <span class="badge ${item.status === "done" ? "success" : isDue ? "danger" : ""}">${escapeHtml(item.status)}</span>
            <span>${escapeHtml(item.type)}</span>
            <span>Due: ${escapeHtml(item.dueDate)}</span>
            ${isOwner() ? `<span>${escapeHtml(userName(item.ownerId))}</span>` : ""}
          </div>
        </div>
        <div class="record-actions">
          <button data-complete-follow="${item.id}" type="button">Done</button>
          <button data-edit-follow="${item.id}" type="button">Edit</button>
          <button data-delete-follow="${item.id}" class="danger" type="button">Delete</button>
        </div>
      </div>
      <p class="muted">${escapeHtml(item.notes || "")}</p>
    </article>
  `;
}

async function saveFollowUp(event) {
  event.preventDefault();
  const id = $("followUpId").value;
  const payload = {
    leadId: $("followUpLead").value,
    dueDate: $("followUpDate").value,
    type: $("followUpType").value,
    status: $("followUpStatus").value,
    notes: $("followUpNotes").value.trim(),
    ownerId: state.user.uid,
    ownerName: state.profile.displayName || state.user.email,
    updatedAt: serverTimestamp()
  };

  if (id) {
    await updateDoc(doc(db, "followUps", id), payload);
  } else {
    await addDoc(collection(db, "followUps"), { ...payload, createdAt: serverTimestamp() });
  }

  clearFollowUpForm();
  await loadData();
}

function editFollowUp(id) {
  const item = state.followUps.find((followUp) => followUp.id === id);
  if (!item) return;
  $("followUpId").value = item.id;
  $("followUpLead").value = item.leadId || "";
  $("followUpDate").value = item.dueDate || today();
  $("followUpType").value = item.type || "call";
  $("followUpStatus").value = item.status || "open";
  $("followUpNotes").value = item.notes || "";
}

async function completeFollowUp(id) {
  await updateDoc(doc(db, "followUps", id), {
    status: "done",
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await loadData();
}

async function deleteFollowUp(id) {
  if (!confirm("Delete this follow-up?")) return;
  await deleteDoc(doc(db, "followUps", id));
  await loadData();
}

function clearFollowUpForm() {
  els.followUpForm.reset();
  $("followUpId").value = "";
  $("followUpDate").value = today();
}

async function saveChecklist() {
  const items = {};
  document.querySelectorAll("[data-check-key]").forEach((checkbox) => {
    items[checkbox.dataset.checkKey] = checkbox.checked;
  });

  await setDoc(doc(db, "dailyChecklists", `${state.user.uid}_${today()}`), {
    ownerId: state.user.uid,
    ownerName: state.profile.displayName || state.user.email,
    date: today(),
    items,
    updatedAt: serverTimestamp()
  });
  state.checklist = items;
  setMessage($("checklistMessage"), "Checklist saved.");
}

function renderChecklist() {
  document.querySelectorAll("[data-check-key]").forEach((checkbox) => {
    checkbox.checked = Boolean(state.checklist[checkbox.dataset.checkKey]);
  });
}

async function saveReport(event) {
  event.preventDefault();
  const date = $("reportDate").value;
  const reportId = `${state.user.uid}_${date}`;
  await setDoc(doc(db, "dailyReports", reportId), {
    ownerId: state.user.uid,
    ownerName: state.profile.displayName || state.user.email,
    date,
    newLeads: Number($("reportNewLeads").value || 0),
    touches: Number($("reportTouches").value || 0),
    bookings: Number($("reportBookings").value || 0),
    revenue: Number($("reportRevenue").value || 0),
    wins: $("reportWins").value.trim(),
    blockers: $("reportBlockers").value.trim(),
    tomorrow: $("reportTomorrow").value.trim(),
    updatedAt: serverTimestamp()
  });
  els.reportForm.reset();
  $("reportDate").value = today();
  await loadData();
}

function renderReports() {
  $("reportsList").innerHTML = state.reports.length
    ? state.reports.map(renderReportCard).join("")
    : `<article class="record-card"><p class="muted">No reports yet.</p></article>`;
}

function renderReportCard(report) {
  return `
    <article class="record-card">
      <div class="record-header">
        <div>
          <div class="record-title">${escapeHtml(report.date)}</div>
          <div class="record-meta">
            <span>New leads: ${Number(report.newLeads || 0)}</span>
            <span>Touches: ${Number(report.touches || 0)}</span>
            <span>Bookings: ${Number(report.bookings || 0)}</span>
            <span>Revenue: ${money(report.revenue)}</span>
            ${isOwner() ? `<span>${escapeHtml(userName(report.ownerId))}</span>` : ""}
          </div>
        </div>
      </div>
      <p><strong>Wins:</strong> ${escapeHtml(report.wins || "-")}</p>
      <p><strong>Blockers:</strong> ${escapeHtml(report.blockers || "-")}</p>
      <p><strong>Tomorrow:</strong> ${escapeHtml(report.tomorrow || "-")}</p>
    </article>
  `;
}

function renderOwnerDashboard() {
  if (!isOwner()) return;

  const openFollowUps = state.followUps.filter((item) => item.status !== "done").length;

  $("ownerTeamCount").textContent = state.users.length;
  $("ownerLeadCount").textContent = state.leads.length;
  $("ownerRevenue").textContent = state.leads.filter((lead) => lead.status === "booked").length;
  $("ownerOpenFollowUps").textContent = openFollowUps;

  $("ownerTeamList").innerHTML = state.users.map((user) => {
    const leads = state.leads.filter((lead) => lead.ownerId === user.uid);
    const reports = state.reports.filter((report) => report.ownerId === user.uid);
    const bookedLeads = leads.filter((lead) => lead.status === "booked").length;
    return `
      <article class="record-card">
        <div class="record-title">${escapeHtml(user.displayName || user.email)}</div>
        <div class="record-meta">
          <span class="badge">${escapeHtml(user.role)}</span>
          <span>Leads: ${leads.length}</span>
          <span>Reports: ${reports.length}</span>
          <span>Booked leads: ${bookedLeads}</span>
        </div>
      </article>
    `;
  }).join("") || `<p class="muted">No team members yet.</p>`;
}

function showSection(sectionId) {
  if (sectionId === "ownerSection" && !isOwner()) return;
  document.querySelectorAll(".page-section").forEach((section) => {
    section.classList.toggle("hidden", section.id !== sectionId);
  });
  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.section === sectionId);
  });
}

function userName(uid) {
  const found = state.users.find((user) => user.uid === uid);
  return found?.displayName || found?.email || uid || "Unknown";
}

function leadName(leadId) {
  if (!leadId) return "No lead selected";
  const found = state.leads.find((lead) => lead.id === leadId);
  return found ? leadTitle(found) : "Deleted lead";
}

function labelRole(role) {
  return role === "owner" ? "Owner" : "Sales manager";
}

function setMessage(element, text, isError = false) {
  element.textContent = text;
  element.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function cleanError(error) {
  return error?.message?.replace("Firebase: ", "") || "Something went wrong.";
}

function leadTitle(lead) {
  return lead.companyName || lead.name || lead.contactName || "Untitled lead";
}

function labelValue(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value) {
  if (!value) return "";
  const date = value.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
