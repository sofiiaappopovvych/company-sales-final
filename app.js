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
  checklist: {}
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
    (lead) => `${lead.name} - ${lead.status} - ${lead.eventType || "No event type"}`
  );
}

function renderMiniList(items, mapper) {
  if (!items.length) return `<p class="muted">Nothing yet.</p>`;
  return items.map((item) => `<div class="record-card">${escapeHtml(mapper(item))}</div>`).join("");
}

function renderLeads() {
  $("leadsList").innerHTML = state.leads.length
    ? state.leads.map(renderLeadCard).join("")
    : `<article class="record-card"><p class="muted">No leads yet. Add your first lead above.</p></article>`;

  $("followUpLead").innerHTML = [
    `<option value="">No lead selected</option>`,
    ...state.leads.map((lead) => `<option value="${lead.id}">${escapeHtml(lead.name)}</option>`)
  ].join("");

  document.querySelectorAll("[data-edit-lead]").forEach((button) => {
    button.addEventListener("click", () => editLead(button.dataset.editLead));
  });
  document.querySelectorAll("[data-delete-lead]").forEach((button) => {
    button.addEventListener("click", () => deleteLead(button.dataset.deleteLead));
  });
}

function renderLeadCard(lead) {
  return `
    <article class="record-card">
      <div class="record-header">
        <div>
          <div class="record-title">${escapeHtml(lead.name)}</div>
          <div class="record-meta">
            <span class="badge ${lead.status === "booked" ? "success" : lead.status === "lost" ? "danger" : ""}">${escapeHtml(lead.status)}</span>
            <span>${escapeHtml(lead.eventType || "No event type")}</span>
            <span>${escapeHtml(lead.eventDate || "No event date")}</span>
            <span>${money(lead.value)}</span>
            ${isOwner() ? `<span>${escapeHtml(userName(lead.ownerId))}</span>` : ""}
          </div>
        </div>
        <div class="record-actions">
          <button data-edit-lead="${lead.id}" type="button">Edit</button>
          <button data-delete-lead="${lead.id}" class="danger" type="button">Delete</button>
        </div>
      </div>
      <p class="muted">${escapeHtml(lead.notes || "No notes")}</p>
      <div class="record-meta">
        <span>${escapeHtml(lead.phone || "No phone")}</span>
        <span>${escapeHtml(lead.email || "No email")}</span>
        <span>${escapeHtml(lead.source || "No source")}</span>
      </div>
    </article>
  `;
}

async function saveLead(event) {
  event.preventDefault();
  const id = $("leadId").value;
  const payload = {
    name: $("leadName").value.trim(),
    phone: $("leadPhone").value.trim(),
    email: $("leadEmail").value.trim(),
    eventType: $("leadEventType").value.trim(),
    eventDate: $("leadEventDate").value,
    value: Number($("leadValue").value || 0),
    source: $("leadSource").value.trim(),
    status: $("leadStatus").value,
    notes: $("leadNotes").value.trim(),
    ownerId: state.user.uid,
    ownerName: state.profile.displayName || state.user.email,
    updatedAt: serverTimestamp()
  };

  if (id) {
    await updateDoc(doc(db, "leads", id), payload);
  } else {
    await addDoc(collection(db, "leads"), { ...payload, createdAt: serverTimestamp() });
  }

  clearLeadForm();
  await loadData();
}

function editLead(id) {
  const lead = state.leads.find((item) => item.id === id);
  if (!lead) return;
  $("leadId").value = lead.id;
  $("leadName").value = lead.name || "";
  $("leadPhone").value = lead.phone || "";
  $("leadEmail").value = lead.email || "";
  $("leadEventType").value = lead.eventType || "";
  $("leadEventDate").value = lead.eventDate || "";
  $("leadValue").value = lead.value || "";
  $("leadSource").value = lead.source || "";
  $("leadStatus").value = lead.status || "new";
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

  const bookedRevenue = state.leads
    .filter((lead) => lead.status === "booked")
    .reduce((sum, lead) => sum + Number(lead.value || 0), 0);
  const openFollowUps = state.followUps.filter((item) => item.status !== "done").length;

  $("ownerTeamCount").textContent = state.users.length;
  $("ownerLeadCount").textContent = state.leads.length;
  $("ownerRevenue").textContent = money(bookedRevenue);
  $("ownerOpenFollowUps").textContent = openFollowUps;

  $("ownerTeamList").innerHTML = state.users.map((user) => {
    const leads = state.leads.filter((lead) => lead.ownerId === user.uid);
    const reports = state.reports.filter((report) => report.ownerId === user.uid);
    const revenue = leads.filter((lead) => lead.status === "booked").reduce((sum, lead) => sum + Number(lead.value || 0), 0);
    return `
      <article class="record-card">
        <div class="record-title">${escapeHtml(user.displayName || user.email)}</div>
        <div class="record-meta">
          <span class="badge">${escapeHtml(user.role)}</span>
          <span>Leads: ${leads.length}</span>
          <span>Reports: ${reports.length}</span>
          <span>Booked: ${money(revenue)}</span>
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
  return found?.name || "Deleted lead";
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
