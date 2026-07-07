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
import { APPROVED_USER_EMAILS, OWNER_EMAILS } from "./app-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const state = {
  mode: "login",
  user: null,
  profile: null,
  users: [],
  leads: [],
  calendarLeads: [],
  bookingSlots: [],
  followUps: [],
  reports: [],
  checklist: {},
  teamChecklists: [],
  playbookLanguage: "en",
  playbookSearch: "",
  templateSearch: "",
  templateCategory: "",
  calendarDate: new Date(),
  availabilityFilters: {
    character: "",
    date: "",
    status: ""
  },
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
const PIPELINE_STATUSES = [
  { value: "new_lead", label: "New Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "follow_up", label: "Follow-up" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" }
];
const BOOKING_STATUSES = [
  { value: "inquiry", label: "Inquiry" },
  { value: "tentative", label: "Tentative" },
  { value: "booked", label: "Booked" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" }
];
const PACKAGE_OPTIONS = [
  { value: "birthday_option_1", label: "Option 1 - $200 - 30 minutes - 1 character" },
  { value: "birthday_special_option", label: "Special Option - $350 - 45 minutes - bear drum show" },
  { value: "birthday_option_2", label: "Option 2 - $550 - 60 minutes - host + character" },
  { value: "birthday_option_3", label: "Option 3 - $700 - 90 minutes - silver show" },
  { value: "festival_most_popular", label: "Festival/corporate - $2400 - up to 6 hours" },
  { value: "custom", label: "Custom package" }
];
const CHARACTER_OPTIONS = [
  { value: "giant_bear", label: "Giant bear" },
  { value: "white_bear", label: "White bear" },
  { value: "panda", label: "Panda" },
  { value: "brown_bear", label: "Brown bear" },
  { value: "mirror_tiger", label: "Mirror tiger" },
  { value: "custom_character", label: "Other / custom" }
];
const ADD_ON_OPTIONS = [
  { value: "additional_character", label: "Additional character - $150" },
  { value: "extra_30_minutes", label: "Additional 30 minutes - $100" },
  { value: "desserts_cake", label: "Desserts & cake - from $150" },
  { value: "flower_bouquet", label: "Flower bouquet - from $90" },
  { value: "decorations", label: "Decorations - from $750" },
  { value: "helium_balloons", label: "Helium balloons - $120" },
  { value: "bubble_machine", label: "Bubble machine - $40" },
  { value: "face_painting", label: "Face painting - $150/hour" },
  { value: "balloon_sticks", label: "Balloon sticks - $4 per child" }
];
const DAILY_GOALS = [
  { key: "newCrmContacts", label: "New CRM contacts", target: 20, range: "20" },
  { key: "newOutreaches", label: "New outreaches", target: 15, range: "15-20" },
  { key: "followUps", label: "Follow-ups", target: 30, range: "30" },
  { key: "facebookGroupsReviewed", label: "Facebook groups reviewed", target: 20, range: "20-30" },
  { key: "relevantPostsFound", label: "Relevant posts found", target: 10, range: "10-15" },
  { key: "dailyReportSubmitted", label: "Daily report submitted", target: 1, range: "yes", type: "boolean" }
];
const PLAYBOOK_CONTENT = {
  en: [
    {
      title: "Company overview",
      points: [
        "We provide event entertainment programs for kids, families, schools, churches, corporate events, and grand openings.",
        "Position the company as reliable, joyful, organized, and easy to work with.",
        "Always explain the outcome: guests are engaged, the event feels special, and the host has less stress.",
        "Use CRM notes to record event type, city, decision maker, budget signs, and next step."
      ]
    },
    {
      title: "Services",
      points: [
        "Core services can include character entertainment, interactive shows, games, bubbles, crafts, music, photo moments, and themed programs.",
        "Ask what kind of event they are planning before recommending a package.",
        "For businesses, frame services as traffic, attention, family-friendly atmosphere, and memorable launch experience.",
        "For schools, daycares, and churches, emphasize safety, structure, age-appropriate engagement, and easy coordination."
      ]
    },
    {
      title: "Target audiences",
      points: [
        "Parents, grandparents, godparents, and family members planning birthdays or private events.",
        "Business owners, marketing managers, office managers, HR, and event coordinators.",
        "Schools, daycares, churches, museums, city events, festivals, and community organizations.",
        "Prioritize leads with a clear date, location, audience size, decision maker, and urgency."
      ]
    },
    {
      title: "Facebook strategy",
      points: [
        "Review local parent groups, city groups, business groups, school/community groups, and event recommendation posts daily.",
        "Look for posts asking for birthday ideas, entertainment, vendors, grand openings, and family events.",
        "Respond warmly, briefly, and from a helpful personal tone. Avoid sounding like spam.",
        "Track promising conversations in CRM and schedule follow-up if they reply or show interest."
      ]
    },
    {
      title: "Instagram strategy",
      points: [
        "Search local businesses, family venues, schools, churches, kids spaces, photographers, cafes, restaurants, and event planners.",
        "Engage before pitching: follow, like relevant posts, reply to stories when natural.",
        "Send concise DMs focused on their event needs, not a long company description.",
        "Save handles, contact names, city, and response status in CRM."
      ]
    },
    {
      title: "Grand opening strategy",
      points: [
        "Target new restaurants, cafes, dental offices, gyms, salons, kids spaces, boutiques, museums, and local businesses.",
        "Pitch entertainment as a way to attract families, create photos/videos, and make opening day memorable.",
        "Ask for opening date, expected audience, location, timing, and whether they want kid-friendly or all-ages activation.",
        "Offer a clear next step: quick call, package recommendation, or quote."
      ]
    },
    {
      title: "Schools/daycares/churches",
      points: [
        "Focus on enrichment days, family nights, festivals, holiday events, summer programs, VBS, fundraisers, and appreciation events.",
        "Use a professional tone and mention safety, timing, setup needs, and age range.",
        "Ask who approves vendors and whether they require insurance, invoice, W-9, or background checks.",
        "Follow up politely because institutional decisions often take longer."
      ]
    },
    {
      title: "Objection handling",
      points: [
        "Too expensive: acknowledge budget, ask what range they had in mind, and offer the best-fit option without over-discounting.",
        "Need to think: ask what information would help them decide and set a follow-up date.",
        "Already have entertainment: ask if they need backup, extra activity, or future event support.",
        "Not sure yet: clarify date, guest count, venue, and decision timeline."
      ]
    },
    {
      title: "Closing",
      points: [
        "Summarize what they asked for, confirm date/time/location, and recommend one clear option.",
        "Use confident but soft language: 'Based on your event, I would recommend...'",
        "Always ask for the next action: deposit, booking form, call, or approval from decision maker.",
        "After closing, update CRM status to Won and add any setup notes."
      ]
    },
    {
      title: "SOP",
      points: [
        "Start each day by checking Follow-up Queue, then review CRM filters and daily goals.",
        "Add every new potential client as a lead with source, category, city, status, manager, and next follow-up date.",
        "Complete daily checklist and daily report before ending work.",
        "Owner reviews manager reports, checklist progress, follow-up queue, and pipeline counters daily."
      ]
    }
  ],
  ru: [
    {
      title: "О компании",
      points: [
        "Мы предоставляем event entertainment программы для детей, семей, школ, церквей, corporate events и grand openings.",
        "Позиционируй компанию как надежную, радостную, организованную и удобную в работе.",
        "Всегда объясняй результат: гости вовлечены, событие выглядит особенным, а организатору легче.",
        "В CRM записывай тип события, город, decision maker, признаки бюджета и следующий шаг."
      ]
    },
    {
      title: "Услуги",
      points: [
        "Основные услуги могут включать character entertainment, интерактивные шоу, игры, bubbles, crafts, music, photo moments и тематические программы.",
        "Сначала спроси, какое событие планируется, и только потом рекомендуй пакет.",
        "Для бизнеса объясняй услуги как способ привлечь внимание, создать трафик, семейную атмосферу и запоминающийся запуск.",
        "Для schools, daycares и churches подчеркивай безопасность, структуру, возрастную уместность и простую координацию."
      ]
    },
    {
      title: "Целевая аудитория",
      points: [
        "Родители, бабушки, дедушки, крестные и родственники, которые планируют birthdays или private events.",
        "Business owners, marketing managers, office managers, HR и event coordinators.",
        "Schools, daycares, churches, museums, city events, festivals и community organizations.",
        "Приоритетные leads: есть дата, локация, размер аудитории, decision maker и срочность."
      ]
    },
    {
      title: "Facebook стратегия",
      points: [
        "Каждый день просматривай local parent groups, city groups, business groups, school/community groups и posts с рекомендациями vendors.",
        "Ищи запросы про birthday ideas, entertainment, vendors, grand openings и family events.",
        "Отвечай тепло, коротко и как живой человек. Не пиши как спам.",
        "Все перспективные диалоги заноси в CRM и ставь follow-up, если человек ответил или проявил интерес."
      ]
    },
    {
      title: "Instagram стратегия",
      points: [
        "Ищи local businesses, family venues, schools, churches, kids spaces, photographers, cafes, restaurants и event planners.",
        "Перед pitch сделай легкое engagement: follow, лайк релевантных постов, ответ на stories, если уместно.",
        "DM должен быть коротким и про их возможную потребность, а не длинным описанием компании.",
        "Сохраняй handles, contact names, city и response status в CRM."
      ]
    },
    {
      title: "Grand opening стратегия",
      points: [
        "Ищи новые restaurants, cafes, dental offices, gyms, salons, kids spaces, boutiques, museums и local businesses.",
        "Подавай entertainment как способ привлечь семьи, создать фото/видео-контент и сделать opening day запоминающимся.",
        "Уточняй opening date, ожидаемую аудиторию, location, timing и формат: kid-friendly или all-ages activation.",
        "Всегда предлагай понятный следующий шаг: quick call, package recommendation или quote."
      ]
    },
    {
      title: "Schools/daycares/churches",
      points: [
        "Фокусируйся на enrichment days, family nights, festivals, holiday events, summer programs, VBS, fundraisers и appreciation events.",
        "Пиши профессионально и упоминай safety, timing, setup needs и age range.",
        "Спроси, кто утверждает vendors и нужны ли insurance, invoice, W-9 или background checks.",
        "Follow-up делай спокойно и регулярно, потому что организации часто принимают решения дольше."
      ]
    },
    {
      title: "Работа с возражениями",
      points: [
        "Дорого: признай бюджет, спроси, на какой range они рассчитывали, и предложи подходящий вариант без сильного обесценивания.",
        "Нужно подумать: спроси, какая информация поможет принять решение, и поставь дату follow-up.",
        "Уже есть entertainment: спроси, нужен ли backup, extra activity или помощь на будущих events.",
        "Пока не уверены: уточни дату, guest count, venue и timeline решения."
      ]
    },
    {
      title: "Closing",
      points: [
        "Кратко повтори, что клиенту нужно, подтверди date/time/location и предложи один ясный вариант.",
        "Говори уверенно, но мягко: 'Based on your event, I would recommend...'",
        "Всегда проси следующий шаг: deposit, booking form, call или approval от decision maker.",
        "После закрытия обнови CRM status на Won и добавь setup notes."
      ]
    },
    {
      title: "SOP",
      points: [
        "Каждый день начинай с Follow-up Queue, затем проверяй CRM filters и daily goals.",
        "Каждый новый potential client добавляется как lead с source, category, city, status, manager и next follow-up date.",
        "Daily checklist и daily report нужно заполнить до конца рабочего дня.",
        "Owner каждый день проверяет manager reports, checklist progress, follow-up queue и pipeline counters."
      ]
    }
  ]
};
const TEMPLATE_LIBRARY = [
  {
    category: "Facebook group reply",
    title: "Parent asking for birthday entertainment",
    text: "Hi! We offer fun interactive kids entertainment for birthdays, including games, themed activities, music, bubbles, and photo moments. I would be happy to send you options based on the age, date, and city. Feel free to message me."
  },
  {
    category: "Facebook group reply",
    title: "Business looking for grand opening ideas",
    text: "Congratulations on the opening! We help grand openings feel more exciting and family-friendly with interactive entertainment, photo moments, and activities that keep guests engaged. I can send a few options if you share the date, location, and expected crowd."
  },
  {
    category: "Facebook DM",
    title: "Warm DM after group reply",
    text: "Hi [Name], thank you for your comment! I wanted to send a quick message here too. What date and city is your event in, and what age group are you planning for? I can recommend the best option."
  },
  {
    category: "Facebook DM",
    title: "Grand opening DM",
    text: "Hi [Name], I saw your business is opening soon. Congratulations! We provide entertainment that helps make openings more memorable and family-friendly. Would you like me to send a simple package idea for your opening day?"
  },
  {
    category: "Instagram DM",
    title: "Local business outreach",
    text: "Hi [Name]! I love what you are building with [Business]. We provide event entertainment for grand openings, family days, and community events. If you ever plan an opening or special event, I would be happy to send ideas."
  },
  {
    category: "Instagram DM",
    title: "Event venue outreach",
    text: "Hi! Your venue looks like a great place for family events. We offer interactive entertainment for birthdays, school events, and business celebrations. Would you be open to connecting for possible event collaboration?"
  },
  {
    category: "Email",
    title: "School/church introduction",
    text: "Subject: Event entertainment for [Organization]\n\nHi [Name],\n\nMy name is [Your Name], and we provide interactive event entertainment for schools, churches, and family events. We can support family nights, festivals, holiday events, fundraisers, and appreciation events.\n\nCould you let me know who coordinates events or vendor bookings for your organization?\n\nThank you,\n[Your Name]"
  },
  {
    category: "Email",
    title: "Proposal follow-up",
    text: "Subject: Following up on your event options\n\nHi [Name],\n\nI wanted to follow up on the options I sent for [Event]. Based on your date, location, and audience, I think [Package] would be the best fit.\n\nWould you like me to hold the date or send the next booking step?\n\nBest,\n[Your Name]"
  },
  {
    category: "SMS",
    title: "Quick event info request",
    text: "Hi [Name], this is [Your Name] from [Company]. Thanks for reaching out! What date, city, and age group is your event for? I can send the best option."
  },
  {
    category: "SMS",
    title: "Simple follow-up",
    text: "Hi [Name], just checking in about [Event date]. Would you still like entertainment options for your event?"
  },
  {
    category: "Phone scripts",
    title: "Discovery call opener",
    text: "Hi [Name], this is [Your Name] from [Company]. I saw you were interested in entertainment for your event. I just want to ask a few quick questions so I can recommend the right option: what is the date, city, age group, and approximate guest count?"
  },
  {
    category: "Phone scripts",
    title: "Closing call",
    text: "Based on what you told me, I recommend [Package]. It fits your event because [reason]. The next step is [deposit/booking form/approval]. Would you like me to send that now?"
  },
  {
    category: "Follow-up messages",
    title: "After no response",
    text: "Hi [Name], I wanted to follow up once more about [Event]. If you are still looking for entertainment, I can send a simple option. If plans changed, no worries at all."
  },
  {
    category: "Follow-up messages",
    title: "After proposal sent",
    text: "Hi [Name], did you have a chance to look over the proposal for [Event]? I can adjust the option if needed, or send the booking step if everything looks good."
  },
  {
    category: "Objection responses",
    title: "Too expensive",
    text: "I completely understand wanting to stay within budget. To help you best, what price range were you hoping for? I can recommend the option that gives you the strongest impact without adding things you do not need."
  },
  {
    category: "Objection responses",
    title: "Need to think",
    text: "Of course. What information would help you decide? I can also check back on [date] so you do not have to remember to reach out."
  }
];

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
  authSubmit: $("authSubmit"),
  authMessage: $("authMessage"),
  globalMessage: $("globalMessage"),
  loadingOverlay: $("loadingOverlay"),
  loadingText: $("loadingText"),
  userSummary: $("userSummary"),
  logoutBtn: $("logoutBtn"),
  refreshBtn: $("refreshBtn"),
  adminNavBtn: $("adminNavBtn"),
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
  $("refreshKpiBtn").addEventListener("click", loadData);
  $("calendarPrevBtn").addEventListener("click", () => changeCalendarMonth(-1));
  $("calendarNextBtn").addEventListener("click", () => changeCalendarMonth(1));
  $("calendarTodayBtn").addEventListener("click", goToCalendarToday);
  $("availabilityCharacter").addEventListener("change", updateAvailabilityFilters);
  $("availabilityDate").addEventListener("change", updateAvailabilityFilters);
  $("availabilityStatus").addEventListener("change", updateAvailabilityFilters);
  $("availabilityTodayBtn").addEventListener("click", resetAvailabilityDate);
  ["leadEventDate", "leadEventTime", "leadEventEndTime", "leadEventDuration", "leadBookingStatus", "leadMainCharacter", "leadAdditionalCharacters"].forEach((id) => {
    $(id).addEventListener("change", updateLeadConflictWarning);
    $(id).addEventListener("input", updateLeadConflictWarning);
  });
  els.leadForm.addEventListener("submit", saveLead);
  $("clearLeadBtn").addEventListener("click", clearLeadForm);
  $("leadSearch").addEventListener("input", updateLeadFilters);
  $("filterStatus").addEventListener("change", updateLeadFilters);
  $("filterSource").addEventListener("change", updateLeadFilters);
  $("filterCategory").addEventListener("change", updateLeadFilters);
  $("filterManager").addEventListener("change", updateLeadFilters);
  $("clearLeadFiltersBtn").addEventListener("click", clearLeadFilters);
  $("exportLeadsBtn").addEventListener("click", () => exportCsv("leads"));
  $("exportReportsBtn").addEventListener("click", () => exportCsv("reports"));
  $("exportFollowUpsBtn").addEventListener("click", () => exportCsv("followUps"));
  $("exportChecklistsBtn").addEventListener("click", () => exportCsv("checklists"));
  $("playbookSearch").addEventListener("input", updatePlaybookSearch);
  $("playbookLanguage").addEventListener("change", updatePlaybookLanguage);
  $("clearPlaybookSearchBtn").addEventListener("click", clearPlaybookSearch);
  $("templateSearch").addEventListener("input", updateTemplateFilters);
  $("templateCategory").addEventListener("change", updateTemplateFilters);
  $("clearTemplateSearchBtn").addEventListener("click", clearTemplateFilters);
  els.followUpForm.addEventListener("submit", saveFollowUp);
  $("clearFollowUpBtn").addEventListener("click", clearFollowUpForm);
  els.reportForm.addEventListener("submit", saveReport);
  els.saveChecklistBtn.addEventListener("click", saveChecklist);

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => showSection(button.dataset.section));
  });

  $("reportDate").value = today();
  $("followUpDate").value = today();
  $("availabilityDate").value = today();
}

function setAuthMode(mode) {
  state.mode = mode;
  const isRegister = mode === "register";
  els.loginTab.classList.toggle("active", !isRegister);
  els.registerTab.classList.toggle("active", isRegister);
  els.displayNameField.classList.toggle("hidden", !isRegister);
  els.authSubmit.textContent = isRegister ? "Create account" : "Login";
  els.authMessage.textContent = "";
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  setMessage(els.authMessage, "Working...");

  const email = normalizeEmail(els.authEmail.value);
  const password = els.authPassword.value;

  try {
    await withLoading(state.mode === "register" ? "Creating account..." : "Logging in...", async () => {
      if (!isApprovedEmail(email)) {
        throw new Error("This email is not approved for company access.");
      }

      if (state.mode === "register") {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const name = els.displayName.value.trim() || email;
        await updateProfile(credential.user, { displayName: name });
        await setDoc(doc(db, "users", credential.user.uid), {
          uid: credential.user.uid,
          email,
          displayName: name,
          role: roleForEmail(email),
          disabled: false,
          createdAt: serverTimestamp()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    });
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

  try {
    await withLoading("Loading workspace...", async () => {
      await ensureUserProfile(user);
      if (!state.profile || state.profile.disabled) return;
      els.authView.classList.add("hidden");
      els.hubView.classList.remove("hidden");
      await loadData();
    });
  } catch (error) {
    setGlobalMessage(cleanError(error), true);
  }
}

async function ensureUserProfile(user) {
  const email = normalizeEmail(user.email);
  if (!isApprovedEmail(email)) {
    state.profile = null;
    await signOut(auth);
    setMessage(els.authMessage, "This email is not approved for company access.", true);
    return;
  }

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email,
      displayName: user.displayName || email,
      role: roleForEmail(email),
      disabled: false,
      createdAt: serverTimestamp()
    });
  }

  const fresh = await getDoc(ref);
  state.profile = fresh.data();
  if (state.profile.disabled) {
    await signOut(auth);
    setMessage(els.authMessage, "This user has been disabled. Please contact the owner.", true);
    return;
  }
  els.userSummary.textContent = `${state.profile.displayName || state.user.email} | ${labelRole(state.profile.role)}`;
  els.ownerNavBtn.classList.toggle("hidden", !isOwner());
  els.adminNavBtn.classList.toggle("hidden", !isOwner());
}

function isOwner() {
  return state.profile?.role === "owner" && OWNER_EMAILS.map(normalizeEmail).includes(normalizeEmail(state.profile?.email || state.user?.email));
}

async function loadData() {
  if (!state.user || !state.profile) return;

  try {
    await withLoading("Syncing latest data...", async () => {
      const scopeField = isOwner() ? null : where("ownerId", "==", state.user.uid);
      const [users, leads, calendarLeads, bookingSlots, followUps, reports, teamChecklists] = await Promise.all([
        isOwner() ? getDocs(collection(db, "users")) : Promise.resolve({ docs: [] }),
        getDocs(buildScopedQuery("leads", scopeField)),
        isOwner() ? getDocs(query(collection(db, "leads"))) : Promise.resolve({ docs: [] }),
        getDocs(query(collection(db, "bookingSlots"))),
        getDocs(buildScopedQuery("followUps", scopeField)),
        getDocs(buildScopedQuery("dailyReports", scopeField)),
        isOwner() ? getDocs(query(collection(db, "dailyChecklists"), where("date", "==", today()))) : Promise.resolve({ docs: [] })
      ]);

      state.users = users.docs.map(toRecord);
      state.leads = leads.docs.map(toLeadRecord).sort(sortBy("createdAt", "desc"));
      state.calendarLeads = isOwner() ? calendarLeads.docs.map(toLeadRecord) : state.leads;
      state.bookingSlots = bookingSlots.docs.map(toRecord);
      state.followUps = followUps.docs.map(toRecord).sort(sortBy("dueDate", "asc"));
      state.reports = reports.docs.map(toRecord).sort(sortBy("date", "desc"));
      state.teamChecklists = teamChecklists.docs.map(toRecord);

      if (isOwner()) await syncBookingSlots();
      await loadChecklist();
      renderAll();
    });
    setGlobalMessage("Data synced.");
  } catch (error) {
    setGlobalMessage(cleanError(error), true);
  }
}

function buildScopedQuery(name, scopeField) {
  const base = collection(db, name);
  return scopeField ? query(base, scopeField) : query(base);
}

function toRecord(snap) {
  return { id: snap.id, ...snap.data() };
}

function toLeadRecord(snap) {
  return normalizeLegacyBooking(toRecord(snap));
}

function normalizeLegacyBooking(lead) {
  const normalized = { ...lead };
  const notes = String(normalized.notes || "").toLowerCase();

  if (!normalized.bookingStatus && normalizeStatus(normalized.status) === "won") {
    normalized.bookingStatus = "booked";
    normalized.bookingConfirmed = true;
  }

  if (!normalized.eventDate && normalized.nextFollowUpDate && normalized.bookingStatus === "booked") {
    normalized.eventDate = normalized.nextFollowUpDate;
  }

  if (!normalized.eventTime) {
    const timeMatch = notes.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
    if (timeMatch) normalized.eventTime = toTimeInputValue(timeMatch[1], timeMatch[2], timeMatch[3]);
  }

  if (!normalized.eventDuration) {
    const durationMatch = notes.match(/(\d+)\s*(minutes|min|hours|hour)/);
    if (durationMatch) normalized.eventDuration = `${durationMatch[1]} ${durationMatch[2]}`;
  }

  if (!normalized.eventEndTime && normalized.eventTime && normalized.eventDuration) {
    normalized.eventEndTime = addMinutesToTime(normalized.eventTime, parseDurationMinutes(normalized.eventDuration) || 60);
  }

  if (!normalized.packageOption && notes.includes("special option")) {
    normalized.packageOption = "birthday_special_option";
  }

  if (!normalized.mainCharacter && !normalized.character && notes.includes("bear")) {
    normalized.mainCharacter = "giant_bear";
    normalized.character = "giant_bear";
  }

  if (!Array.isArray(normalized.additionalCharacters)) {
    normalized.additionalCharacters = [];
  }

  return normalized;
}

function toTimeInputValue(hourValue, minuteValue, meridiem) {
  let hours = Number(hourValue);
  const minutes = Number(minuteValue || 0);
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function addMinutesToTime(timeValue, minutesToAdd) {
  const start = timeToMinutes(timeValue);
  if (start === null) return "";
  const total = start + minutesToAdd;
  const hours = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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
  state.checklist = snap.exists() ? snap.data() : { goals: {} };
}

function renderAll() {
  renderStats();
  renderKpiDashboard();
  renderCalendar();
  renderAvailability();
  renderLeads();
  renderFollowUps();
  renderFollowUpQueue();
  renderReports();
  renderChecklist();
  renderPlaybook();
  renderTemplates();
  renderOwnerDashboard();
  renderAdminPanel();
}

function renderStats() {
  const normalizedLeads = state.leads.map(normalizeLead);
  const openLeads = normalizedLeads.filter((lead) => !["won", "lost"].includes(lead.status));
  const dueFollowUps = state.followUps.filter((item) => item.status !== "done" && item.dueDate <= today());
  const reportsToday = state.reports.filter((report) => report.date === today());

  $("statTotalLeads").textContent = normalizedLeads.length;
  $("statOpenLeads").textContent = openLeads.length;
  $("statDueFollowUps").textContent = dueFollowUps.length;
  $("statReportsToday").textContent = reportsToday.length;
  renderPipelineFunnel(normalizedLeads);

  $("dashboardFollowUps").innerHTML = renderMiniList(
    state.followUps.filter((item) => item.status !== "done").slice(0, 5),
    (item) => `${leadName(item.leadId)} - ${item.type} - ${formatDisplayDate(item.dueDate)}`
  );
  $("dashboardLeads").innerHTML = renderMiniList(
    state.leads.slice(0, 5),
    (lead) => `${leadTitle(lead)} - ${statusLabel(lead.status)} - ${labelValue(lead.category || "No category")}`
  );
  renderDashboardBookedEvents();
}

function renderDashboardBookedEvents() {
  const bookings = getUpcomingBookedEvents(state.leads);
  $("dashboardBookedCount").textContent = `${bookings.length} ${bookings.length === 1 ? "event" : "events"}`;
  $("dashboardBookedEvents").innerHTML = bookings.length
    ? bookings.slice(0, 8).map((lead) => renderUpcomingBookedEvent(lead)).join("")
    : `<article class="record-card"><p class="muted">No upcoming booked events.</p></article>`;
}

function getUpcomingBookedEvents(leads) {
  return leads
    .filter((lead) => lead.bookingStatus === "booked")
    .filter((lead) => lead.eventDate && lead.eventDate >= today())
    .sort((first, second) => String(first.eventDate || "").localeCompare(String(second.eventDate || "")) || sortCalendarBookings(first, second));
}

function renderUpcomingBookedEvent(lead) {
  return `
    <article class="record-card">
      <div class="record-title">${escapeHtml(leadTitle(lead))}</div>
      <div class="record-meta">
        <span class="badge booking-badge booked">Booked</span>
        <span>${escapeHtml(formatDisplayDate(lead.eventDate) || "No date")}</span>
        <span>${escapeHtml(formatCalendarTime(lead))}</span>
        <span>${escapeHtml(characterLabel(lead.mainCharacter || lead.character || ""))}</span>
        <span>${escapeHtml(lead.city || "No city")}</span>
        <span>${escapeHtml(packageLabel(lead.packageOption || ""))}</span>
        <span>Manager: ${escapeHtml(lead.ownerName || lead.assignedManagerName || userName(lead.ownerId))}</span>
        <span>Deposit: ${escapeHtml(booleanLabel(lead.depositPaid))}</span>
        <span>Balance: ${escapeHtml(formatMoneyField(lead.balanceDue))}</span>
      </div>
    </article>
  `;
}

function renderMiniList(items, mapper) {
  if (!items.length) return `<p class="muted">Nothing yet.</p>`;
  return items.map((item) => `<div class="record-card">${escapeHtml(mapper(item))}</div>`).join("");
}

function changeCalendarMonth(offset) {
  const nextDate = new Date(state.calendarDate);
  nextDate.setDate(1);
  nextDate.setMonth(nextDate.getMonth() + offset);
  state.calendarDate = nextDate;
  renderCalendar();
}

function goToCalendarToday() {
  state.calendarDate = new Date();
  renderCalendar();
}

function renderCalendar() {
  if (!$("bookingCalendar")) return;

  const year = state.calendarDate.getFullYear();
  const month = state.calendarDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  const monthBookings = getCalendarBookings().filter((lead) => {
    const eventDate = parseIsoDate(lead.eventDate);
    return eventDate && eventDate.getFullYear() === year && eventDate.getMonth() === month;
  });

  $("calendarMonthLabel").textContent = firstDay.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  $("calendarCount").textContent = `${monthBookings.length} ${monthBookings.length === 1 ? "booking" : "bookings"}`;

  const cells = [];
  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - startOffset + 1;
    const cellDate = new Date(year, month, dayNumber);
    const inMonth = dayNumber >= 1 && dayNumber <= lastDay.getDate();
    const isoDate = inMonth ? formatLocalIsoDate(cellDate) : "";
    const dayBookings = inMonth
      ? monthBookings.filter((lead) => lead.eventDate === isoDate).sort(sortCalendarBookings)
      : [];

    cells.push(`
      <article class="calendar-day ${inMonth ? "" : "muted-day"} ${isoDate === today() ? "today" : ""}">
        <div class="calendar-day-number">${inMonth ? dayNumber : ""}</div>
        <div class="calendar-events">
          ${dayBookings.map(renderCalendarBooking).join("")}
        </div>
      </article>
    `);
  }

  $("bookingCalendar").innerHTML = cells.join("");
}

function getCalendarBookings() {
  return getBookingSources().filter((lead) => {
    const bookingStatus = lead.bookingStatus || "";
    return lead.eventDate && ["booked", "tentative", "completed"].includes(bookingStatus);
  });
}

function getBookingSources() {
  if (isOwner()) return state.calendarLeads;
  const ownLeadIds = new Set(state.leads.map((lead) => lead.id));
  const busySlots = state.bookingSlots
    .filter((slot) => !ownLeadIds.has(slot.leadId || slot.id))
    .map((slot) => ({ ...slot, id: slot.leadId || slot.id, limited: true }));
  return [...state.leads, ...busySlots];
}

async function syncBookingSlots() {
  const writes = state.calendarLeads.map((lead) => updateBookingSlot(lead.id, lead));
  await Promise.all(writes);
}

async function updateBookingSlot(leadId, lead) {
  if (!leadId) return;
  const slotRef = doc(db, "bookingSlots", leadId);
  const bookingStatus = lead.bookingStatus || "";
  const shouldHaveSlot = lead.eventDate && ["booked", "tentative", "completed"].includes(bookingStatus);

  if (!shouldHaveSlot) {
    await deleteDoc(slotRef).catch(() => {});
    return;
  }

  await setDoc(slotRef, {
    leadId,
    ownerId: lead.ownerId,
    eventDate: lead.eventDate || "",
    eventTime: lead.eventTime || "",
    eventEndTime: lead.eventEndTime || "",
    eventDuration: lead.eventDuration || "",
    bookingStatus,
    mainCharacter: lead.mainCharacter || lead.character || "",
    additionalCharacters: Array.isArray(lead.additionalCharacters) ? lead.additionalCharacters : [],
    character: lead.mainCharacter || lead.character || "",
    updatedAt: serverTimestamp()
  });
}

function renderCalendarBooking(lead) {
  const isOwnLead = lead.ownerId === state.user?.uid;
  const canSeeDetails = !lead.limited && (isOwner() || isOwnLead);
  const bookingClass = lead.bookingStatus === "completed" ? "completed" : lead.bookingStatus === "tentative" ? "tentative" : "booked";
  const timeRange = formatCalendarTime(lead);
  const conflicts = findConflictingBookings(lead);
  const visibleConflictNotice = conflicts.length
    ? `
      <div class="calendar-conflicts">
        <strong>Conflict warning</strong>
        ${conflicts.map((conflict) => `<span>${escapeHtml(formatConflictDetail(conflict))}</span>`).join("")}
      </div>
    `
    : "";
  const busyConflictNotice = conflicts.length ? `<span class="conflict-line">Conflict warning</span>` : "";

  if (!canSeeDetails) {
    return `
      <div class="calendar-event busy ${conflicts.length ? "has-conflict" : ""}">
        <strong>${escapeHtml(timeRange)}</strong>
        <span>Busy</span>
        ${busyConflictNotice}
      </div>
    `;
  }

  return `
    <div class="calendar-event ${bookingClass} ${conflicts.length ? "has-conflict" : ""}">
      <strong>${escapeHtml(timeRange)} - ${escapeHtml(leadTitle(lead))}</strong>
      <span>${escapeHtml(bookingStatusLabel(lead.bookingStatus))}</span>
      <span>${escapeHtml(characterLabel(lead.mainCharacter || lead.character || ""))}</span>
      <span>${escapeHtml(lead.city || "No city")} · ${escapeHtml(packageLabel(lead.packageOption || ""))}</span>
      <span>Manager: ${escapeHtml(lead.ownerName || lead.assignedManagerName || userName(lead.ownerId))}</span>
      ${visibleConflictNotice}
    </div>
  `;
}

function sortCalendarBookings(first, second) {
  return (first.eventTime || "").localeCompare(second.eventTime || "") || leadTitle(first).localeCompare(leadTitle(second));
}

function formatCalendarTime(lead) {
  if (lead.eventTime && lead.eventEndTime) return `${lead.eventTime}-${lead.eventEndTime}`;
  if (lead.eventTime) return lead.eventTime;
  if (lead.eventEndTime) return `Ends ${lead.eventEndTime}`;
  return "Time TBD";
}

function updateAvailabilityFilters() {
  state.availabilityFilters = {
    character: $("availabilityCharacter").value,
    date: $("availabilityDate").value || today(),
    status: $("availabilityStatus").value
  };
  renderAvailability();
}

function resetAvailabilityDate() {
  $("availabilityDate").value = today();
  updateAvailabilityFilters();
}

function renderAvailability() {
  if (!$("availabilityList")) return;

  const filters = state.availabilityFilters;
  const selectedDate = filters.date || today();
  const characters = CHARACTER_OPTIONS.filter((character) => !filters.character || character.value === filters.character);
  const rangeDates = getAvailabilityRange(selectedDate);
  const allFilteredBookings = getAvailabilityBookings().filter((lead) => {
    if (filters.status && lead.bookingStatus !== filters.status) return false;
    return rangeDates.includes(lead.eventDate);
  });

  $("availabilityRangeLabel").textContent = `${formatReadableDate(rangeDates[0])} - ${formatReadableDate(rangeDates[rangeDates.length - 1])}`;
  $("availabilityCount").textContent = `${allFilteredBookings.length} ${allFilteredBookings.length === 1 ? "booking" : "bookings"}`;
  $("availabilitySummary").innerHTML = characters.map((character) => renderAvailabilitySummaryCard(character, selectedDate)).join("");
  $("availabilityList").innerHTML = characters.length
    ? characters.map((character) => renderCharacterAvailability(character, rangeDates)).join("")
    : `<article class="record-card"><p class="muted">No characters match this filter.</p></article>`;
}

function getAvailabilityRange(startDate) {
  return Array.from({ length: 7 }, (_, index) => addDays(startDate, index));
}

function getAvailabilityBookings() {
  return getBookingSources().filter((lead) => {
    if (!lead.eventDate) return false;
    const statuses = ["booked", "tentative", "completed"];
    return statuses.includes(lead.bookingStatus || "");
  });
}

function renderAvailabilitySummaryCard(character, selectedDate) {
  const dayBookings = getCharacterBookingsForDate(character.value, selectedDate);
  const busy = dayBookings.length > 0;
  return `
    <article class="availability-card ${busy ? "busy" : "available"}">
      <span>${escapeHtml(character.label)}</span>
      <strong>${busy ? "Busy" : "Available"}</strong>
      <small>${escapeHtml(formatReadableDate(selectedDate))}${busy ? ` · ${dayBookings.length} booking${dayBookings.length === 1 ? "" : "s"}` : ""}</small>
    </article>
  `;
}

function renderCharacterAvailability(character, rangeDates) {
  return `
    <article class="character-availability">
      <div class="character-availability-header">
        <h3>${escapeHtml(character.label)}</h3>
        <span class="muted">${escapeHtml(formatCharacterStatus(character.value, state.availabilityFilters.date || today()))}</span>
      </div>
      <div class="character-week">
        ${rangeDates.map((date) => renderCharacterDay(character.value, date)).join("")}
      </div>
    </article>
  `;
}

function renderCharacterDay(characterValue, date) {
  const bookings = getCharacterBookingsForDate(characterValue, date);
  const isBusy = bookings.length > 0;
  return `
    <div class="character-day ${isBusy ? "busy" : "available"}">
      <div class="character-day-title">
        <strong>${escapeHtml(formatDayLabel(date))}</strong>
        <span>${isBusy ? "Busy" : "Free"}</span>
      </div>
      <div class="character-day-events">
        ${isBusy ? bookings.map((lead) => renderAvailabilityBooking(lead)).join("") : `<span class="muted">No bookings</span>`}
      </div>
    </div>
  `;
}

function getCharacterBookingsForDate(characterValue, date) {
  const filters = state.availabilityFilters;
  return getAvailabilityBookings()
    .filter((lead) => lead.eventDate === date)
    .filter((lead) => !filters.status || lead.bookingStatus === filters.status)
    .filter((lead) => bookingUsesCharacter(lead, characterValue))
    .sort(sortCalendarBookings);
}

function bookingUsesCharacter(lead, characterValue) {
  return getLeadCharacters(lead).includes(characterValue);
}

function renderAvailabilityBooking(lead) {
  const canSeeDetails = !lead.limited && (isOwner() || lead.ownerId === state.user?.uid);
  if (!canSeeDetails) {
    return `
      <div class="availability-booking limited">
        <strong>${escapeHtml(formatCalendarTime(lead))}</strong>
        <span>Busy slot</span>
        <span>${escapeHtml(bookingStatusLabel(lead.bookingStatus))}</span>
      </div>
    `;
  }

  return `
    <div class="availability-booking">
      <strong>${escapeHtml(formatCalendarTime(lead))} - ${escapeHtml(leadTitle(lead))}</strong>
      <span>${escapeHtml(bookingStatusLabel(lead.bookingStatus))}</span>
      <span>${escapeHtml(lead.city || "No city")} · ${escapeHtml(packageLabel(lead.packageOption || ""))}</span>
      <span>Manager: ${escapeHtml(lead.ownerName || lead.assignedManagerName || userName(lead.ownerId))}</span>
    </div>
  `;
}

function formatCharacterStatus(characterValue, date) {
  const bookings = getCharacterBookingsForDate(characterValue, date);
  return bookings.length ? `Busy on ${formatReadableDate(date)}` : `Available on ${formatReadableDate(date)}`;
}

function formatDayLabel(dateString) {
  const date = parseIsoDate(dateString);
  if (!date) return dateString;
  return `${date.toLocaleDateString(undefined, { weekday: "short" })} ${formatDisplayDate(dateString)}`;
}

function formatReadableDate(dateString) {
  return formatDisplayDate(dateString);
}

function formatDisplayDate(dateString) {
  const date = parseIsoDate(dateString);
  if (!date) return dateString || "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}/${date.getFullYear()}`;
}

function updateLeadConflictWarning() {
  const warning = $("leadConflictWarning");
  if (!warning) return [];
  const payload = getLeadFormPayload();
  const conflicts = findConflictingBookings({ ...payload, id: $("leadId").value });
  renderLeadConflictWarning(conflicts);
  return conflicts;
}

function renderLeadConflictWarning(conflicts) {
  const warning = $("leadConflictWarning");
  if (!warning) return;
  warning.classList.toggle("hidden", !conflicts.length);
  warning.innerHTML = conflicts.length
    ? `
      <strong>Conflict warning</strong>
      <p>This character already has a booked/tentative event during overlapping time.</p>
      <ul>
        ${conflicts.map((conflict) => `<li>${escapeHtml(formatConflictDetail(conflict))}</li>`).join("")}
      </ul>
    `
    : "";
}

function findConflictingBookings(lead, options = {}) {
  const targetStatuses = options.includeCompletedTarget ? ["booked", "tentative", "completed"] : ["booked", "tentative"];
  if (!targetStatuses.includes(lead.bookingStatus || "")) return [];

  const targetRange = getLeadTimeRange(lead);
  const targetCharacters = getLeadCharacters(lead);
  if (!lead.eventDate || !targetRange || !targetCharacters.length) return [];

  return getBookingSources()
    .filter((booking) => booking.id !== lead.id)
    .filter((booking) => booking.eventDate === lead.eventDate)
    .filter((booking) => ["booked", "tentative"].includes(booking.bookingStatus || ""))
    .map((booking) => {
      const bookingRange = getLeadTimeRange(booking);
      const sharedCharacters = intersectValues(targetCharacters, getLeadCharacters(booking));
      if (!bookingRange || !sharedCharacters.length || !rangesOverlap(targetRange, bookingRange)) return null;
      return { booking, sharedCharacters };
    })
    .filter(Boolean)
    .sort((first, second) => sortCalendarBookings(first.booking, second.booking));
}

function getLeadCharacters(lead) {
  return [
    lead.mainCharacter || lead.character || "",
    ...(Array.isArray(lead.additionalCharacters) ? lead.additionalCharacters : [])
  ].filter(Boolean);
}

function getLeadTimeRange(lead) {
  const start = timeToMinutes(lead.eventTime);
  if (start === null) return null;
  const explicitEnd = timeToMinutes(lead.eventEndTime);
  const duration = parseDurationMinutes(lead.eventDuration) ?? 60;
  const end = explicitEnd ?? start + duration;
  return end > start ? { start, end } : null;
}

function timeToMinutes(value) {
  if (!value || !value.includes(":")) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function parseDurationMinutes(value) {
  if (!value) return null;
  const text = String(value).toLowerCase();
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)/);
  const minuteMatch = text.match(/(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes)/);
  const plainNumber = text.match(/^\s*(\d+(?:\.\d+)?)\s*$/);
  const hours = hourMatch ? Number(hourMatch[1]) * 60 : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  if (hours || minutes) return hours + minutes;
  return plainNumber ? Number(plainNumber[1]) : null;
}

function rangesOverlap(first, second) {
  return first.start < second.end && second.start < first.end;
}

function intersectValues(first, second) {
  const secondSet = new Set(second);
  return first.filter((value, index) => first.indexOf(value) === index && secondSet.has(value));
}

function formatConflictSummary(conflicts) {
  return conflicts.map((conflict) => characterLabels(conflict.sharedCharacters).join(", ")).join("; ");
}

function formatConflictDetail(conflict) {
  const booking = conflict.booking;
  const characterText = characterLabels(conflict.sharedCharacters).join(", ");
  const isOwnLead = booking.ownerId === state.user?.uid;
  const canSeeDetails = !booking.limited && (isOwner() || isOwnLead);
  if (!canSeeDetails) {
    return `${formatCalendarTime(booking)} - Busy slot`;
  }
  return `${formatCalendarTime(booking)} - ${leadTitle(booking)} - ${characterText} - ${bookingStatusLabel(booking.bookingStatus)} - ${booking.city || "No city"} - ${packageLabel(booking.packageOption || "")} - Manager: ${booking.ownerName || booking.assignedManagerName || userName(booking.ownerId)}`;
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
  document.querySelectorAll("[data-booking-transition]").forEach((button) => {
    button.addEventListener("click", () => transitionBookingStatus(button.dataset.bookingTransition, button.dataset.nextBookingStatus));
  });
}

function renderLeadCard(lead) {
  const normalizedLead = normalizeLead(lead);
  const createdDate = formatDateTime(lead.createdAt) || formatDisplayDate(lead.createdDate) || "-";
  const updatedDate = formatDateTime(lead.updatedAt) || formatDisplayDate(lead.updatedDate) || "-";
  const bookingStatus = lead.bookingStatus || "inquiry";
  const conflicts = findConflictingBookings(lead);
  const conflictBlock = conflicts.length
    ? `
      <div class="conflict-warning compact-warning">
        <strong>Conflict warning</strong>
        <ul>
          ${conflicts.map((conflict) => `<li>${escapeHtml(formatConflictDetail(conflict))}</li>`).join("")}
        </ul>
      </div>
    `
    : "";

  return `
    <article class="record-card">
      <div class="record-header">
        <div>
          <div class="record-title">${escapeHtml(leadTitle(lead))}</div>
          <div class="record-meta">
            <span class="badge ${normalizedLead.status === "won" ? "success" : normalizedLead.status === "lost" ? "danger" : ""}">${escapeHtml(statusLabel(normalizedLead.status))}</span>
            <span class="badge booking-badge ${escapeHtml(bookingStatusClass(bookingStatus))}">${escapeHtml(bookingStatusLabel(bookingStatus))}</span>
            <span>${escapeHtml(labelValue(lead.category || "No category"))}</span>
            <span>${escapeHtml(labelValue(lead.source || "No source"))}</span>
            <span>${escapeHtml(lead.city || "No city")}</span>
            <span>Event: ${escapeHtml(formatEventSchedule(lead))}</span>
            <span>${escapeHtml(packageLabel(lead.packageOption || ""))}</span>
            <span>Next: ${escapeHtml(formatDisplayDate(lead.nextFollowUpDate) || "No date")}</span>
            <span>Manager: ${escapeHtml(userName(lead.ownerId))}</span>
          </div>
        </div>
        <div class="record-actions">
          <button data-edit-lead="${lead.id}" type="button">Edit</button>
          <button data-delete-lead="${lead.id}" class="danger" type="button">Delete</button>
        </div>
      </div>
      ${renderBookingWorkflowActions(lead)}
      <p class="muted">${escapeHtml(lead.notes || "No notes")}</p>
      ${conflictBlock}
      <div class="record-meta">
        <span>Contact: ${escapeHtml(lead.contactName || lead.name || "No contact")}</span>
        <span>${escapeHtml(lead.phone || "No phone")}</span>
        <span>${escapeHtml(lead.email || "No email")}</span>
        <span>Address: ${escapeHtml(lead.eventAddress || "Not specified")}</span>
        <span>Duration: ${escapeHtml(lead.eventDuration || "Not specified")}</span>
        <span>Child: ${escapeHtml(formatChildInfo(lead))}</span>
        <span>Guests: ${escapeHtml(lead.guestCount || "Not specified")}</span>
        <span>Theme: ${escapeHtml(lead.eventTheme || "Not specified")}</span>
        <span>Main character: ${escapeHtml(characterLabel(lead.mainCharacter || lead.character || ""))}</span>
        <span>Additional characters: ${escapeHtml(characterLabels(lead.additionalCharacters).join(", ") || "None")}</span>
        <span>Add-ons: ${escapeHtml(addOnLabels(lead.addOns).join(", ") || "None")}</span>
        <span>Deposit paid: ${escapeHtml(booleanLabel(lead.depositPaid))}</span>
        <span>Deposit amount: ${escapeHtml(formatMoneyField(lead.depositAmount))}</span>
        <span>Balance due: ${escapeHtml(formatMoneyField(lead.balanceDue))}</span>
        <span>Confirmed: ${escapeHtml(booleanLabel(lead.bookingConfirmed))}</span>
        <span>Created: ${escapeHtml(createdDate)}</span>
        <span>Updated: ${escapeHtml(updatedDate)}</span>
      </div>
    </article>
  `;
}

function renderBookingWorkflowActions(lead) {
  const transitions = getBookingTransitions(lead.bookingStatus || "inquiry");
  if (!transitions.length) return "";
  return `
    <div class="booking-workflow">
      <span class="muted">Booking workflow</span>
      <div class="record-actions">
        ${transitions.map((transition) => `
          <button data-booking-transition="${lead.id}" data-next-booking-status="${transition.value}" type="button">
            ${escapeHtml(transition.label)}
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function getBookingTransitions(status) {
  const transitions = {
    inquiry: [{ value: "tentative", label: "Move to tentative" }],
    tentative: [{ value: "booked", label: "Confirm booked" }],
    booked: [
      { value: "completed", label: "Mark completed" },
      { value: "cancelled", label: "Cancel booking" }
    ]
  };
  return transitions[status] || [];
}

async function transitionBookingStatus(id, nextStatus) {
  const lead = state.leads.find((item) => item.id === id);
  if (!lead || !nextStatus) return;

  const allowed = getBookingTransitions(lead.bookingStatus || "inquiry").some((transition) => transition.value === nextStatus);
  if (!allowed) {
    setGlobalMessage("This booking status transition is not allowed.", true);
    return;
  }

  const conflicts = findConflictingBookings({ ...lead, bookingStatus: nextStatus });
  if (conflicts.length) {
    const confirmed = confirm(`Conflict warning: this character has ${conflicts.length} overlapping booking${conflicts.length === 1 ? "" : "s"}. Continue anyway?`);
    if (!confirmed) return;
  }

  const message = `Move "${leadTitle(lead)}" from ${bookingStatusLabel(lead.bookingStatus || "inquiry")} to ${bookingStatusLabel(nextStatus)}?`;
  if (!confirm(message)) return;

  try {
    await withLoading("Updating booking status...", async () => {
      await updateDoc(doc(db, "leads", id), {
        bookingStatus: nextStatus,
        bookingConfirmed: nextStatus === "booked" || nextStatus === "completed" ? true : lead.bookingConfirmed || false,
        updatedDate: today(),
        updatedAt: serverTimestamp()
      });
      await updateBookingSlot(id, {
        ...lead,
        bookingStatus: nextStatus,
        bookingConfirmed: nextStatus === "booked" || nextStatus === "completed" ? true : lead.bookingConfirmed || false
      });
      await loadData();
    });
    setGlobalMessage(`Booking moved to ${bookingStatusLabel(nextStatus)}.`);
  } catch (error) {
    setGlobalMessage(cleanError(error), true);
  }
}

async function saveLead(event) {
  event.preventDefault();
  const id = $("leadId").value;
  const payload = getLeadFormPayload();
  const conflicts = findConflictingBookings({ ...payload, id });
  renderLeadConflictWarning(conflicts);

  if (conflicts.length) {
    const confirmed = confirm(`Conflict warning: this character has ${conflicts.length} overlapping booking${conflicts.length === 1 ? "" : "s"}. Save anyway?`);
    if (!confirmed) return;
  }

  try {
    await withLoading("Saving lead...", async () => {
      if (id) {
        await updateDoc(doc(db, "leads", id), payload);
        await updateBookingSlot(id, payload);
      } else {
        const newLeadRef = await addDoc(collection(db, "leads"), {
          ...payload,
          createdDate: today(),
          createdAt: serverTimestamp()
        });
        await updateBookingSlot(newLeadRef.id, payload);
      }

      clearLeadForm();
      await loadData();
    });
    setGlobalMessage("Lead saved.");
  } catch (error) {
    setGlobalMessage(cleanError(error), true);
  }
}

function getLeadFormPayload() {
  const assignedManagerId = isOwner() ? $("leadAssignedManager").value : state.user.uid;
  const assignedManagerName = userName(assignedManagerId);
  return {
    companyName: $("leadCompanyName").value.trim(),
    contactName: $("leadContactName").value.trim(),
    phone: $("leadPhone").value.trim(),
    email: $("leadEmail").value.trim(),
    city: $("leadCity").value.trim(),
    category: $("leadCategory").value,
    source: $("leadSource").value,
    status: normalizeStatus($("leadStatus").value),
    childAge: $("leadChildAge").value,
    childGender: $("leadChildGender").value,
    guestCount: $("leadGuestCount").value,
    eventDate: $("leadEventDate").value,
    eventTime: $("leadEventTime").value,
    eventEndTime: $("leadEventEndTime").value,
    eventDuration: $("leadEventDuration").value.trim(),
    eventAddress: $("leadEventAddress").value.trim(),
    eventTheme: $("leadEventTheme").value.trim(),
    packageOption: $("leadPackageOption").value,
    bookingStatus: $("leadBookingStatus").value,
    mainCharacter: $("leadMainCharacter").value,
    additionalCharacters: selectedValues("leadAdditionalCharacters"),
    character: $("leadMainCharacter").value,
    addOns: selectedValues("leadAddOns"),
    depositPaid: $("leadDepositPaid").checked,
    depositAmount: $("leadDepositAmount").value,
    balanceDue: $("leadBalanceDue").value,
    bookingConfirmed: $("leadBookingConfirmed").value === "yes",
    assignedManagerId,
    assignedManagerName,
    nextFollowUpDate: $("leadNextFollowUpDate").value,
    notes: $("leadNotes").value.trim(),
    ownerId: assignedManagerId,
    ownerName: assignedManagerName,
    updatedDate: today(),
    updatedAt: serverTimestamp()
  };
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
  $("leadStatus").value = normalizeStatus(lead.status || "new_lead");
  $("leadChildAge").value = lead.childAge || "";
  $("leadChildGender").value = lead.childGender || "";
  $("leadGuestCount").value = lead.guestCount || "";
  $("leadEventDate").value = lead.eventDate || "";
  $("leadEventTime").value = lead.eventTime || "";
  $("leadEventEndTime").value = lead.eventEndTime || "";
  $("leadEventDuration").value = lead.eventDuration || "";
  $("leadEventAddress").value = lead.eventAddress || "";
  $("leadEventTheme").value = lead.eventTheme || "";
  $("leadPackageOption").value = lead.packageOption || "";
  $("leadBookingStatus").value = lead.bookingStatus || "inquiry";
  $("leadMainCharacter").value = lead.mainCharacter || lead.character || "";
  setSelectedValues("leadAdditionalCharacters", lead.additionalCharacters || []);
  setSelectedValues("leadAddOns", lead.addOns || []);
  $("leadDepositPaid").checked = Boolean(lead.depositPaid);
  $("leadDepositAmount").value = lead.depositAmount || "";
  $("leadBalanceDue").value = lead.balanceDue || "";
  $("leadBookingConfirmed").value = lead.bookingConfirmed ? "yes" : "no";
  $("leadAssignedManager").value = lead.ownerId || state.user.uid;
  $("leadNextFollowUpDate").value = lead.nextFollowUpDate || "";
  $("leadNotes").value = lead.notes || "";
  showSection("leadsSection");
  updateLeadConflictWarning();
}

async function deleteLead(id) {
  if (!confirm("Delete this lead?")) return;
  try {
    await withLoading("Deleting lead...", async () => {
      await deleteDoc(doc(db, "leads", id));
      await deleteDoc(doc(db, "bookingSlots", id)).catch(() => {});
      await loadData();
    });
    setGlobalMessage("Lead deleted.");
  } catch (error) {
    setGlobalMessage(cleanError(error), true);
  }
}

function clearLeadForm() {
  els.leadForm.reset();
  $("leadId").value = "";
  renderLeadConflictWarning([]);
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

  const managers = state.users.filter((user) => ["owner", "sales_manager"].includes(user.role) && !user.disabled);
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

function updatePlaybookSearch() {
  state.playbookSearch = $("playbookSearch").value.trim().toLowerCase();
  renderPlaybook();
}

function updatePlaybookLanguage() {
  state.playbookLanguage = $("playbookLanguage").value;
  renderPlaybook();
}

function clearPlaybookSearch() {
  $("playbookSearch").value = "";
  state.playbookSearch = "";
  renderPlaybook();
}

function renderPlaybook() {
  const sections = PLAYBOOK_CONTENT[state.playbookLanguage] || PLAYBOOK_CONTENT.en;
  const filtered = sections.filter((section) => {
    const text = [section.title, ...section.points].join(" ").toLowerCase();
    return !state.playbookSearch || text.includes(state.playbookSearch);
  });

  $("playbookList").innerHTML = filtered.length
    ? filtered.map(renderPlaybookCard).join("")
    : `<article class="record-card"><p class="muted">No playbook sections match your search.</p></article>`;
}

function renderPlaybookCard(section) {
  return `
    <article class="playbook-card">
      <h3>${escapeHtml(section.title)}</h3>
      <ul>
        ${section.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
      </ul>
    </article>
  `;
}

function updateTemplateFilters() {
  state.templateSearch = $("templateSearch").value.trim().toLowerCase();
  state.templateCategory = $("templateCategory").value;
  renderTemplates();
}

function clearTemplateFilters() {
  $("templateSearch").value = "";
  $("templateCategory").value = "";
  state.templateSearch = "";
  state.templateCategory = "";
  renderTemplates();
}

function renderTemplates() {
  const filtered = TEMPLATE_LIBRARY.filter((template) => {
    const text = [template.category, template.title, template.text].join(" ").toLowerCase();
    if (state.templateCategory && template.category !== state.templateCategory) return false;
    if (state.templateSearch && !text.includes(state.templateSearch)) return false;
    return true;
  });

  $("templatesList").innerHTML = filtered.length
    ? filtered.map((template, index) => renderTemplateCard(template, index)).join("")
    : `<article class="record-card"><p class="muted">No templates match your filters.</p></article>`;

  document.querySelectorAll("[data-copy-template]").forEach((button) => {
    button.addEventListener("click", () => copyTemplateText(Number(button.dataset.copyTemplate)));
  });
}

function renderTemplateCard(template, index) {
  return `
    <article class="template-card">
      <div class="record-header">
        <div>
          <span class="badge">${escapeHtml(template.category)}</span>
          <h3>${escapeHtml(template.title)}</h3>
        </div>
        <button class="secondary" data-copy-template="${index}" type="button">Copy</button>
      </div>
      <pre>${escapeHtml(template.text)}</pre>
    </article>
  `;
}

async function copyTemplateText(index) {
  const template = getFilteredTemplates()[index];
  if (!template) return;
  await copyText(template.text);
  setMessage($("templateCopyMessage"), "Template copied.");
}

function getFilteredTemplates() {
  return TEMPLATE_LIBRARY.filter((template) => {
    const text = [template.category, template.title, template.text].join(" ").toLowerCase();
    if (state.templateCategory && template.category !== state.templateCategory) return false;
    if (state.templateSearch && !text.includes(state.templateSearch)) return false;
    return true;
  });
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function getFilteredLeads() {
  return state.leads.filter((lead) => {
    const normalizedLead = normalizeLead(lead);
    const haystack = [
      lead.companyName,
      lead.contactName,
      lead.name,
      lead.phone,
      lead.email,
      lead.city,
      lead.category,
      lead.source,
      normalizedLead.status,
      statusLabel(normalizedLead.status),
      lead.childAge,
      lead.childGender,
      lead.guestCount,
      lead.eventDate,
      lead.eventTime,
      lead.eventEndTime,
      lead.eventDuration,
      lead.eventAddress,
      lead.eventTheme,
      lead.bookingStatus,
      bookingStatusLabel(lead.bookingStatus || "inquiry"),
      packageLabel(lead.packageOption || ""),
      characterLabel(lead.mainCharacter || lead.character || ""),
      characterLabels(lead.additionalCharacters).join(" "),
      addOnLabels(lead.addOns).join(" "),
      booleanLabel(lead.depositPaid),
      lead.depositAmount,
      lead.balanceDue,
      booleanLabel(lead.bookingConfirmed),
      lead.notes,
      lead.ownerName,
      lead.assignedManagerName
    ].join(" ").toLowerCase();

    if (state.leadFilters.search && !haystack.includes(state.leadFilters.search)) return false;
    if (state.leadFilters.status && normalizedLead.status !== state.leadFilters.status) return false;
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

function renderFollowUpQueue() {
  const queue = state.leads
    .filter((lead) => lead.nextFollowUpDate && lead.nextFollowUpDate <= today() && !["won", "lost"].includes(normalizeStatus(lead.status)))
    .sort(sortBy("nextFollowUpDate", "asc"));

  $("followUpQueueCount").textContent = `${queue.length} ${queue.length === 1 ? "lead" : "leads"}`;
  $("followUpQueueList").innerHTML = queue.length
    ? queue.map(renderFollowUpQueueCard).join("")
    : `<article class="record-card"><p class="muted">No leads due for follow-up today.</p></article>`;

  document.querySelectorAll("[data-mark-contacted]").forEach((button) => {
    button.addEventListener("click", () => markLeadContacted(button.dataset.markContacted));
  });
}

function renderFollowUpQueueCard(lead) {
  const isOverdue = lead.nextFollowUpDate < today();
  return `
    <article class="record-card">
      <div class="record-header">
        <div>
          <div class="record-title">${escapeHtml(leadTitle(lead))}</div>
          <div class="record-meta">
            <span class="badge ${isOverdue ? "danger" : ""}">${isOverdue ? "Overdue" : "Today"}</span>
            <span>Next follow-up: ${escapeHtml(formatDisplayDate(lead.nextFollowUpDate))}</span>
            <span>Status: ${escapeHtml(statusLabel(lead.status))}</span>
            <span>Manager: ${escapeHtml(userName(lead.ownerId))}</span>
            <span>${escapeHtml(lead.phone || "No phone")}</span>
            <span>${escapeHtml(lead.email || "No email")}</span>
          </div>
        </div>
      </div>
      <div class="queue-action-grid">
        <label>
          Follow-up note
          <textarea data-queue-note="${lead.id}" rows="2" placeholder="What happened after this follow-up?"></textarea>
        </label>
        <label>
          Next follow-up date
          <input data-queue-next-date="${lead.id}" type="date" value="${addDays(today(), 3)}" />
        </label>
        <button class="primary" data-mark-contacted="${lead.id}" type="button">Mark as contacted</button>
      </div>
    </article>
  `;
}

async function markLeadContacted(id) {
  const lead = state.leads.find((item) => item.id === id);
  if (!lead) return;

  try {
    await withLoading("Updating follow-up...", async () => {
      const noteField = document.querySelector(`[data-queue-note="${id}"]`);
      const nextDateField = document.querySelector(`[data-queue-next-date="${id}"]`);
      const note = noteField?.value.trim() || "Follow-up completed.";
      const nextFollowUpDate = nextDateField?.value || addDays(today(), 3);
      const existingNotes = lead.notes ? `${lead.notes}\n\n` : "";
      const updatedNotes = `${existingNotes}[${today()}] Follow-up: ${note}`;

      await updateDoc(doc(db, "leads", id), {
        status: "contacted",
        notes: updatedNotes,
        nextFollowUpDate,
        updatedDate: today(),
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(db, "followUps"), {
        leadId: id,
        dueDate: today(),
        type: "follow_up_queue",
        status: "done",
        notes: note,
        ownerId: lead.ownerId,
        ownerName: lead.ownerName || userName(lead.ownerId),
        completedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await loadData();
    });
    setGlobalMessage("Follow-up completed.");
  } catch (error) {
    setGlobalMessage(cleanError(error), true);
  }
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
            <span>Due: ${escapeHtml(formatDisplayDate(item.dueDate))}</span>
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
  try {
    await withLoading("Saving follow-up...", async () => {
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
    });
    setGlobalMessage("Follow-up saved.");
  } catch (error) {
    setGlobalMessage(cleanError(error), true);
  }
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
  try {
    await withLoading("Completing follow-up...", async () => {
      await updateDoc(doc(db, "followUps", id), {
        status: "done",
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await loadData();
    });
    setGlobalMessage("Follow-up marked done.");
  } catch (error) {
    setGlobalMessage(cleanError(error), true);
  }
}

async function deleteFollowUp(id) {
  if (!confirm("Delete this follow-up?")) return;
  try {
    await withLoading("Deleting follow-up...", async () => {
      await deleteDoc(doc(db, "followUps", id));
      await loadData();
    });
    setGlobalMessage("Follow-up deleted.");
  } catch (error) {
    setGlobalMessage(cleanError(error), true);
  }
}

function clearFollowUpForm() {
  els.followUpForm.reset();
  $("followUpId").value = "";
  $("followUpDate").value = today();
}

async function saveChecklist() {
  try {
    await withLoading("Saving checklist...", async () => {
      const goals = {};
      document.querySelectorAll("[data-goal-key]").forEach((field) => {
        goals[field.dataset.goalKey] = field.type === "checkbox" ? field.checked : Number(field.value || 0);
      });
      const progress = calculateChecklistProgress(goals);

      await setDoc(doc(db, "dailyChecklists", `${state.user.uid}_${today()}`), {
        ownerId: state.user.uid,
        ownerName: state.profile.displayName || state.user.email,
        date: today(),
        goals,
        progress,
        updatedAt: serverTimestamp()
      });
      state.checklist = { goals, progress };
      setMessage($("checklistMessage"), "Checklist saved.");
      renderChecklist();
      await loadData();
    });
    setGlobalMessage("Checklist saved.");
  } catch (error) {
    setMessage($("checklistMessage"), cleanError(error), true);
    setGlobalMessage(cleanError(error), true);
  }
}

function renderChecklist() {
  const goals = state.checklist.goals || {};
  document.querySelectorAll("[data-goal-key]").forEach((field) => {
    const value = goals[field.dataset.goalKey];
    if (field.type === "checkbox") {
      field.checked = Boolean(value);
    } else {
      field.value = Number(value || 0);
    }
  });
  const progress = calculateChecklistProgress(goals);
  $("dailyGoalProgress").textContent = `${progress.percent}% complete`;
}

async function saveReport(event) {
  event.preventDefault();
  try {
    await withLoading("Submitting report...", async () => {
      const date = $("reportDate").value;
      const reportId = `${state.user.uid}_${date}`;
      await setDoc(doc(db, "dailyReports", reportId), {
        ownerId: state.user.uid,
        ownerName: state.profile.displayName || state.user.email,
        date,
        newLeads: Number($("reportNewLeads").value || 0),
        newOutreaches: Number($("reportNewOutreaches").value || 0),
        followUpsCompleted: Number($("reportFollowUpsCompleted").value || 0),
        callsMade: Number($("reportCallsMade").value || 0),
        messagesSent: Number($("reportMessagesSent").value || 0),
        proposalsSent: Number($("reportProposalsSent").value || 0),
        responsesReceived: Number($("reportResponsesReceived").value || 0),
        meetingsBooked: Number($("reportMeetingsBooked").value || 0),
        dealsClosed: Number($("reportDealsClosed").value || 0),
        problems: $("reportProblems").value.trim(),
        tomorrow: $("reportTomorrow").value.trim(),
        updatedAt: serverTimestamp()
      });
      els.reportForm.reset();
      $("reportDate").value = today();
      await loadData();
    });
    setGlobalMessage("Daily report submitted.");
  } catch (error) {
    setGlobalMessage(cleanError(error), true);
  }
}

function renderReports() {
  $("reportsList").innerHTML = state.reports.length
    ? state.reports.map(renderReportCard).join("")
    : `<article class="record-card"><p class="muted">No reports yet.</p></article>`;

  bindReportActions();
}

function renderReportCard(report) {
  const normalizedReport = normalizeReport(report);
  const canDelete = isOwner() || report.ownerId === state.user?.uid;
  return `
    <article class="record-card">
      <div class="record-header">
        <div>
          <div class="record-title">${escapeHtml(formatDisplayDate(report.date))}</div>
          <div class="record-meta">
            <span>New leads: ${normalizedReport.newLeads}</span>
            <span>Outreaches: ${normalizedReport.newOutreaches}</span>
            <span>Follow-ups: ${normalizedReport.followUpsCompleted}</span>
            <span>Calls: ${normalizedReport.callsMade}</span>
            <span>Messages: ${normalizedReport.messagesSent}</span>
            <span>Proposals: ${normalizedReport.proposalsSent}</span>
            <span>Responses: ${normalizedReport.responsesReceived}</span>
            <span>Meetings: ${normalizedReport.meetingsBooked}</span>
            <span>Deals: ${normalizedReport.dealsClosed}</span>
            ${isOwner() ? `<span>${escapeHtml(userName(report.ownerId))}</span>` : ""}
          </div>
        </div>
        ${canDelete ? `
          <div class="record-actions">
            <button data-delete-report="${report.id}" class="danger" type="button">Delete</button>
          </div>
        ` : ""}
      </div>
      <p><strong>Problems / objections:</strong> ${escapeHtml(normalizedReport.problems || "-")}</p>
      <p><strong>Tomorrow:</strong> ${escapeHtml(report.tomorrow || "-")}</p>
    </article>
  `;
}

function bindReportActions() {
  document.querySelectorAll("[data-delete-report]").forEach((button) => {
    if (button.dataset.boundDeleteReport) return;
    button.dataset.boundDeleteReport = "true";
    button.addEventListener("click", () => deleteReport(button.dataset.deleteReport));
  });
}

async function deleteReport(id) {
  const report = state.reports.find((item) => item.id === id);
  if (!report) return;
  if (!isOwner() && report.ownerId !== state.user?.uid) {
    setGlobalMessage("You can delete only your own reports.", true);
    return;
  }
  if (!confirm(`Delete report for ${formatDisplayDate(report.date)}?`)) return;

  try {
    await withLoading("Deleting report...", async () => {
      await deleteDoc(doc(db, "dailyReports", id));
      await loadData();
    });
    setGlobalMessage("Daily report deleted.");
  } catch (error) {
    setGlobalMessage(cleanError(error), true);
  }
}

function renderOwnerDashboard() {
  if (!isOwner()) return;

  const openFollowUps = state.followUps.filter((item) => item.status !== "done").length;

  $("ownerTeamCount").textContent = state.users.length;
  $("ownerLeadCount").textContent = state.leads.length;
  $("ownerRevenue").textContent = state.leads.filter((lead) => normalizeStatus(lead.status) === "won").length;
  $("ownerOpenFollowUps").textContent = openFollowUps;
  renderOwnerBookedEvents();

  $("ownerTeamList").innerHTML = state.users.map((user) => {
    const leads = state.leads.filter((lead) => lead.ownerId === user.uid);
    const reports = state.reports.filter((report) => report.ownerId === user.uid);
    const wonLeads = leads.filter((lead) => normalizeStatus(lead.status) === "won").length;
    return `
      <article class="record-card">
        <div class="record-title">${escapeHtml(user.displayName || user.email)}</div>
        <div class="record-meta">
          <span class="badge">${escapeHtml(user.role)}</span>
          <span>Leads: ${leads.length}</span>
          <span>Reports: ${reports.length}</span>
          <span>Won leads: ${wonLeads}</span>
        </div>
      </article>
    `;
  }).join("") || `<p class="muted">No team members yet.</p>`;
  renderOwnerChecklistProgress();
  renderOwnerReports();
}

function renderOwnerBookedEvents() {
  const bookings = getUpcomingBookedEvents(state.calendarLeads);
  $("ownerBookedCount").textContent = `${bookings.length} ${bookings.length === 1 ? "event" : "events"}`;
  $("ownerBookedEvents").innerHTML = bookings.length
    ? bookings.slice(0, 12).map((lead) => renderUpcomingBookedEvent(lead, { ownerView: true })).join("")
    : `<article class="record-card"><p class="muted">No upcoming booked events.</p></article>`;
}

function renderAdminPanel() {
  if (!isOwner()) return;
  renderAdminUsers();
  renderAdminKpi();
  renderAdminLeadAssignments();
  renderAdminReports();
}

function renderAdminUsers() {
  $("adminUsersCount").textContent = `${state.users.length} ${state.users.length === 1 ? "user" : "users"}`;
  $("adminUsersList").innerHTML = state.users.map((user) => `
    <article class="record-card">
      <div class="record-header">
        <div>
          <div class="record-title">${escapeHtml(user.displayName || user.email)}</div>
          <div class="record-meta">
            <span>${escapeHtml(user.email || "No email")}</span>
            <span class="badge ${user.disabled ? "danger" : "success"}">${user.disabled ? "Disabled" : "Active"}</span>
          </div>
        </div>
      </div>
      <div class="admin-action-grid">
        <label>
          Role
          <select data-admin-role="${user.uid}">
            <option value="sales_manager" ${user.role === "sales_manager" ? "selected" : ""}>Sales manager</option>
            <option value="owner" ${user.role === "owner" ? "selected" : ""}>Owner</option>
          </select>
        </label>
        <button class="${user.disabled ? "secondary" : "danger"}" data-admin-toggle-user="${user.uid}" type="button">
          ${user.disabled ? "Enable user" : "Disable user"}
        </button>
      </div>
    </article>
  `).join("") || `<p class="muted">No users yet.</p>`;

  document.querySelectorAll("[data-admin-role]").forEach((select) => {
    select.addEventListener("change", () => updateUserRole(select.dataset.adminRole, select.value));
  });
  document.querySelectorAll("[data-admin-toggle-user]").forEach((button) => {
    button.addEventListener("click", () => toggleUserDisabled(button.dataset.adminToggleUser));
  });
}

function renderAdminKpi() {
  const team = state.users.filter((user) => ["owner", "sales_manager"].includes(user.role));
  $("adminKpiList").innerHTML = team.map((user) => {
    const leads = state.leads.filter((lead) => lead.ownerId === user.uid);
    const reports = state.reports.filter((report) => report.ownerId === user.uid);
    const followUps = state.followUps.filter((followUp) => followUp.ownerId === user.uid);
    const won = leads.filter((lead) => normalizeStatus(lead.status) === "won").length;
    const due = leads.filter((lead) => lead.nextFollowUpDate && lead.nextFollowUpDate <= today() && !["won", "lost"].includes(normalizeStatus(lead.status))).length;
    const todayReport = reports.some((report) => report.date === today());
    return `
      <article class="record-card">
        <div class="record-title">${escapeHtml(user.displayName || user.email)}</div>
        <div class="kpi-grid">
          <span><strong>${leads.length}</strong> Leads</span>
          <span><strong>${won}</strong> Won</span>
          <span><strong>${followUps.length}</strong> Follow-ups</span>
          <span><strong>${due}</strong> Due today/overdue</span>
          <span><strong>${reports.length}</strong> Reports</span>
          <span><strong>${todayReport ? "Yes" : "No"}</strong> Report today</span>
        </div>
      </article>
    `;
  }).join("") || `<p class="muted">No manager KPI yet.</p>`;
}

function renderAdminLeadAssignments() {
  const managers = getManagerOptions();
  $("adminLeadsCount").textContent = `${state.leads.length} ${state.leads.length === 1 ? "lead" : "leads"}`;
  $("adminAssignLeadsList").innerHTML = state.leads.map((lead) => `
    <article class="record-card">
      <div class="record-header">
        <div>
          <div class="record-title">${escapeHtml(leadTitle(lead))}</div>
          <div class="record-meta">
            <span>Status: ${escapeHtml(statusLabel(lead.status))}</span>
            <span>Current manager: ${escapeHtml(userName(lead.ownerId))}</span>
            <span>Next: ${escapeHtml(formatDisplayDate(lead.nextFollowUpDate) || "No date")}</span>
          </div>
        </div>
      </div>
      <label>
        Assign manager
        <select data-admin-assign-lead="${lead.id}">
          ${managers.map((user) => `<option value="${user.uid}" ${lead.ownerId === user.uid ? "selected" : ""}>${escapeHtml(user.displayName || user.email)}</option>`).join("")}
        </select>
      </label>
    </article>
  `).join("") || `<p class="muted">No leads to assign yet.</p>`;

  document.querySelectorAll("[data-admin-assign-lead]").forEach((select) => {
    select.addEventListener("change", () => assignLeadToManager(select.dataset.adminAssignLead, select.value));
  });
}

function renderAdminReports() {
  const sortedReports = [...state.reports].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  $("adminReportsCount").textContent = `${sortedReports.length} ${sortedReports.length === 1 ? "report" : "reports"}`;
  $("adminReportsList").innerHTML = sortedReports.length
    ? sortedReports.map((report) => renderReportCard(report)).join("")
    : `<p class="muted">No daily reports yet.</p>`;
  bindReportActions();
}

async function updateUserRole(uid, role) {
  try {
    await withLoading("Updating user role...", async () => {
      await updateDoc(doc(db, "users", uid), {
        role,
        updatedAt: serverTimestamp()
      });
      await loadData();
    });
    setGlobalMessage("User role updated.");
  } catch (error) {
    setGlobalMessage(cleanError(error), true);
  }
}

async function toggleUserDisabled(uid) {
  const user = state.users.find((item) => item.uid === uid);
  if (!user) return;
  try {
    await withLoading(user.disabled ? "Enabling user..." : "Disabling user...", async () => {
      await updateDoc(doc(db, "users", uid), {
        disabled: !user.disabled,
        updatedAt: serverTimestamp()
      });
      await loadData();
    });
    setGlobalMessage(user.disabled ? "User enabled." : "User disabled.");
  } catch (error) {
    setGlobalMessage(cleanError(error), true);
  }
}

async function assignLeadToManager(leadId, managerId) {
  const manager = getManagerOptions().find((user) => user.uid === managerId);
  if (!manager) return;
  try {
    await withLoading("Assigning lead...", async () => {
      await updateDoc(doc(db, "leads", leadId), {
        ownerId: manager.uid,
        ownerName: manager.displayName || manager.email,
        assignedManagerId: manager.uid,
        assignedManagerName: manager.displayName || manager.email,
        updatedDate: today(),
        updatedAt: serverTimestamp()
      });
      const lead = state.calendarLeads.find((item) => item.id === leadId) || state.leads.find((item) => item.id === leadId);
      if (lead) {
        await updateBookingSlot(leadId, {
          ...lead,
          ownerId: manager.uid,
          ownerName: manager.displayName || manager.email,
          assignedManagerId: manager.uid,
          assignedManagerName: manager.displayName || manager.email
        });
      }
      await loadData();
    });
    setGlobalMessage("Lead assigned.");
  } catch (error) {
    setGlobalMessage(cleanError(error), true);
  }
}

function showSection(sectionId) {
  if ((sectionId === "ownerSection" || sectionId === "adminSection") && !isOwner()) return;
  document.querySelectorAll(".page-section").forEach((section) => {
    section.classList.toggle("hidden", section.id !== sectionId);
  });
  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.section === sectionId);
  });
  const activeButton = document.querySelector(`.nav-btn[data-section="${sectionId}"]`);
  const activeSection = activeButton?.closest(".nav-section");
  if (activeSection) activeSection.open = true;
  const navMenu = document.querySelector(".nav-menu");
  if (navMenu && window.matchMedia("(max-width: 860px)").matches) {
    navMenu.open = false;
  }
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

function selectedValues(id) {
  return Array.from($(id).selectedOptions).map((option) => option.value);
}

function setSelectedValues(id, values) {
  const selected = new Set(Array.isArray(values) ? values : []);
  Array.from($(id).options).forEach((option) => {
    option.selected = selected.has(option.value);
  });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isApprovedEmail(email) {
  return APPROVED_USER_EMAILS.map(normalizeEmail).includes(normalizeEmail(email));
}

function roleForEmail(email) {
  return OWNER_EMAILS.map(normalizeEmail).includes(normalizeEmail(email)) ? "owner" : "sales_manager";
}

async function exportCsv(type) {
  try {
    await withLoading("Preparing CSV export...", async () => {
      const rows = await getExportRows(type);
      if (!rows.length) {
        setGlobalMessage(`No ${type} records to export.`);
        return;
      }

      const csv = toCsv(rows);
      const filename = `company-sales-hub-${type}-${today()}.csv`;
      downloadTextFile(filename, csv, "text/csv;charset=utf-8");
      setGlobalMessage(`${filename} exported.`);
    });
  } catch (error) {
    setGlobalMessage(cleanError(error), true);
  }
}

async function getExportRows(type) {
  if (type === "leads") return state.leads.map(exportLeadRow);
  if (type === "reports") return state.reports.map(exportReportRow);
  if (type === "followUps") return state.followUps.map(exportFollowUpRow);
  if (type === "checklists") {
    const scope = isOwner() ? query(collection(db, "dailyChecklists")) : query(collection(db, "dailyChecklists"), where("ownerId", "==", state.user.uid));
    const snap = await getDocs(scope);
    return snap.docs.map(toRecord).map(exportChecklistRow);
  }
  return [];
}

function exportLeadRow(lead) {
  return {
    id: lead.id,
    companyName: lead.companyName || lead.name || "",
    contactName: lead.contactName || "",
    phone: lead.phone || "",
    email: lead.email || "",
    city: lead.city || "",
    category: labelValue(lead.category || ""),
    source: labelValue(lead.source || ""),
    status: statusLabel(lead.status),
    childAge: lead.childAge || "",
    childGender: lead.childGender || "",
    guestCount: lead.guestCount || "",
    eventDate: formatDisplayDate(lead.eventDate),
    eventTime: lead.eventTime || "",
    eventEndTime: lead.eventEndTime || "",
    eventDuration: lead.eventDuration || "",
    eventAddress: lead.eventAddress || "",
    eventTheme: lead.eventTheme || "",
    bookingStatus: bookingStatusLabel(lead.bookingStatus || "inquiry"),
    packageOption: packageLabel(lead.packageOption || ""),
    mainCharacter: characterLabel(lead.mainCharacter || lead.character || ""),
    additionalCharacters: characterLabels(lead.additionalCharacters).join("; "),
    addOns: addOnLabels(lead.addOns).join("; "),
    depositPaid: booleanLabel(lead.depositPaid),
    depositAmount: lead.depositAmount || "",
    balanceDue: lead.balanceDue || "",
    bookingConfirmed: booleanLabel(lead.bookingConfirmed),
    assignedManager: userName(lead.ownerId),
    nextFollowUpDate: formatDisplayDate(lead.nextFollowUpDate),
    notes: lead.notes || "",
    createdDate: formatDisplayDate(lead.createdDate) || formatDateTime(lead.createdAt),
    updatedDate: formatDisplayDate(lead.updatedDate) || formatDateTime(lead.updatedAt)
  };
}

function exportReportRow(report) {
  const normalizedReport = normalizeReport(report);
  return {
    id: report.id,
    date: formatDisplayDate(report.date),
    manager: userName(report.ownerId),
    newLeads: normalizedReport.newLeads,
    newOutreaches: normalizedReport.newOutreaches,
    followUpsCompleted: normalizedReport.followUpsCompleted,
    callsMade: normalizedReport.callsMade,
    messagesSent: normalizedReport.messagesSent,
    proposalsSent: normalizedReport.proposalsSent,
    responsesReceived: normalizedReport.responsesReceived,
    meetingsBooked: normalizedReport.meetingsBooked,
    dealsClosed: normalizedReport.dealsClosed,
    problems: report.problems || "",
    tomorrow: report.tomorrow || ""
  };
}

function exportFollowUpRow(followUp) {
  return {
    id: followUp.id,
    lead: leadName(followUp.leadId),
    dueDate: formatDisplayDate(followUp.dueDate),
    type: followUp.type || "",
    status: followUp.status || "",
    manager: userName(followUp.ownerId),
    notes: followUp.notes || "",
    createdAt: formatDateTime(followUp.createdAt),
    updatedAt: formatDateTime(followUp.updatedAt)
  };
}

function exportChecklistRow(checklist) {
  const goals = checklist.goals || {};
  return {
    id: checklist.id,
    date: formatDisplayDate(checklist.date),
    manager: userName(checklist.ownerId),
    newCrmContacts: goals.newCrmContacts || 0,
    newOutreaches: goals.newOutreaches || 0,
    followUps: goals.followUps || 0,
    facebookGroupsReviewed: goals.facebookGroupsReviewed || 0,
    relevantPostsFound: goals.relevantPostsFound || 0,
    dailyReportSubmitted: Boolean(goals.dailyReportSubmitted),
    progressPercent: checklist.progress?.percent ?? calculateChecklistProgress(goals).percent,
    updatedAt: formatDateTime(checklist.updatedAt)
  };
}

function toCsv(rows) {
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))
  ];
  return lines.join("\n");
}

function csvCell(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadTextFile(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function setMessage(element, text, isError = false) {
  element.textContent = text;
  element.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function setGlobalMessage(text, isError = false) {
  if (!els.globalMessage) return;
  setMessage(els.globalMessage, text, isError);
}

async function withLoading(text, action) {
  setLoading(true, text);
  try {
    return await action();
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading, text = "Loading...") {
  if (!els.loadingOverlay) return;
  els.loadingText.textContent = text;
  els.loadingOverlay.classList.toggle("hidden", !isLoading);
  document.body.classList.toggle("is-loading", isLoading);
}

function cleanError(error) {
  return error?.message?.replace("Firebase: ", "") || "Something went wrong.";
}

function calculateChecklistProgress(goals = {}) {
  const completed = DAILY_GOALS.filter((goal) => {
    if (goal.type === "boolean") return Boolean(goals[goal.key]);
    return Number(goals[goal.key] || 0) >= goal.target;
  }).length;
  return {
    completed,
    total: DAILY_GOALS.length,
    percent: Math.round((completed / DAILY_GOALS.length) * 100)
  };
}

function renderOwnerChecklistProgress() {
  $("ownerChecklistDate").textContent = formatDisplayDate(today());
  const team = state.users.filter((user) => ["owner", "sales_manager"].includes(user.role));
  $("ownerChecklistProgress").innerHTML = team.map((user) => {
    const checklist = state.teamChecklists.find((item) => item.ownerId === user.uid);
    const goals = checklist?.goals || {};
    const progress = calculateChecklistProgress(goals);
    const details = DAILY_GOALS.map((goal) => {
      const rawValue = goal.type === "boolean"
        ? (goals[goal.key] ? "yes" : "no")
        : Number(goals[goal.key] || 0);
      const done = goal.type === "boolean"
        ? Boolean(goals[goal.key])
        : Number(goals[goal.key] || 0) >= goal.target;
      return `<span class="${done ? "goal-done" : "goal-open"}">${escapeHtml(goal.label)}: ${escapeHtml(rawValue)} / ${escapeHtml(goal.range)}</span>`;
    }).join("");

    return `
      <article class="record-card">
        <div class="record-header">
          <div>
            <div class="record-title">${escapeHtml(user.displayName || user.email)}</div>
            <div class="record-meta">
              <span class="badge ${progress.percent === 100 ? "success" : ""}">${progress.percent}% complete</span>
              <span>${progress.completed}/${progress.total} goals done</span>
              <span>${checklist ? "Saved today" : "Not submitted yet"}</span>
            </div>
          </div>
        </div>
        <div class="goal-summary">${details}</div>
      </article>
    `;
  }).join("") || `<p class="muted">No team members yet.</p>`;
}

function renderOwnerReports() {
  const sortedReports = [...state.reports].sort((a, b) => {
    const dateCompare = normalizeSortValue(b.date) > normalizeSortValue(a.date) ? 1 : -1;
    if (a.date !== b.date) return dateCompare;
    return normalizeSortValue(b.updatedAt) - normalizeSortValue(a.updatedAt);
  });

  $("ownerReportsCount").textContent = `${sortedReports.length} ${sortedReports.length === 1 ? "report" : "reports"}`;
  $("ownerReportsList").innerHTML = sortedReports.length
    ? sortedReports.map((report) => renderReportCard(report)).join("")
    : `<article class="record-card"><p class="muted">No manager reports yet.</p></article>`;
  bindReportActions();
}

function leadTitle(lead) {
  return lead.companyName || lead.name || lead.contactName || "Untitled lead";
}

function normalizeReport(report) {
  return {
    newLeads: Number(report.newLeads || 0),
    newOutreaches: Number(report.newOutreaches || 0),
    followUpsCompleted: Number(report.followUpsCompleted || 0),
    callsMade: Number(report.callsMade || report.calls || 0),
    messagesSent: Number(report.messagesSent || report.touches || 0),
    proposalsSent: Number(report.proposalsSent || 0),
    responsesReceived: Number(report.responsesReceived || 0),
    meetingsBooked: Number(report.meetingsBooked || report.bookings || 0),
    dealsClosed: Number(report.dealsClosed || 0),
    problems: report.problems || report.blockers || ""
  };
}

function labelValue(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function optionLabel(options, value) {
  return options.find((item) => item.value === value)?.label || (value ? labelValue(value) : "Not selected");
}

function packageLabel(value) {
  return optionLabel(PACKAGE_OPTIONS, value);
}

function bookingStatusLabel(value) {
  return optionLabel(BOOKING_STATUSES, value || "inquiry");
}

function bookingStatusClass(value) {
  return ["inquiry", "tentative", "booked", "completed", "cancelled"].includes(value) ? value : "inquiry";
}

function characterLabel(value) {
  return optionLabel(CHARACTER_OPTIONS, value);
}

function characterLabels(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => characterLabel(value));
}

function addOnLabels(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => optionLabel(ADD_ON_OPTIONS, value));
}

function booleanLabel(value) {
  return value ? "Yes" : "No";
}

function formatMoneyField(value) {
  return value === undefined || value === null || value === "" ? "Not specified" : money(value);
}

function formatChildInfo(lead) {
  const parts = [];
  if (lead.childAge) parts.push(`${lead.childAge} years old`);
  if (lead.childGender) parts.push(labelValue(lead.childGender));
  return parts.join(", ") || "Not specified";
}

function formatEventSchedule(lead) {
  const parts = [];
  if (lead.eventDate) parts.push(formatDisplayDate(lead.eventDate));
  if (lead.eventTime && lead.eventEndTime) {
    parts.push(`${lead.eventTime}-${lead.eventEndTime}`);
  } else if (lead.eventTime) {
    parts.push(lead.eventTime);
  } else if (lead.eventEndTime) {
    parts.push(`ends ${lead.eventEndTime}`);
  }
  return parts.join(" at ") || "No date/time";
}

function normalizeLead(lead) {
  return { ...lead, status: normalizeStatus(lead.status) };
}

function normalizeStatus(status) {
  const legacyMap = {
    new: "new_lead",
    proposal: "proposal_sent",
    booked: "won"
  };
  return legacyMap[status] || status || "new_lead";
}

function statusLabel(status) {
  const normalized = normalizeStatus(status);
  return PIPELINE_STATUSES.find((item) => item.value === normalized)?.label || labelValue(normalized);
}

function renderPipelineFunnel(leads) {
  const counts = PIPELINE_STATUSES.map((status) => ({
    ...status,
    count: leads.filter((lead) => normalizeStatus(lead.status) === status.value).length
  }));
  const maxCount = Math.max(1, ...counts.map((item) => item.count));

  $("pipelineTotal").textContent = `${leads.length} ${leads.length === 1 ? "lead" : "leads"}`;
  $("pipelineFunnel").innerHTML = counts.map((item, index) => {
    const width = Math.max(18, Math.round((item.count / maxCount) * 100));
    return `
      <div class="pipeline-stage">
        <div class="pipeline-stage-top">
          <span>${escapeHtml(item.label)}</span>
          <strong>${item.count}</strong>
        </div>
        <div class="pipeline-bar-track">
          <div class="pipeline-bar pipeline-${index}" style="width: ${width}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function formatDateTime(value) {
  if (!value) return "";
  const date = value.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${formatDisplayDate(formatLocalIsoDate(date))} ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseIsoDate(dateString) {
  if (!dateString) return null;
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderKpiDashboard() {
  const todayRange = getDateRange("today");
  const weekRange = getDateRange("week");
  const monthRange = getDateRange("month");

  $("kpiTodayLabel").textContent = todayRange.label;
  $("kpiWeekLabel").textContent = weekRange.label;
  $("kpiMonthLabel").textContent = monthRange.label;
  $("kpiTodayGrid").innerHTML = renderKpiGrid(calculateKpisForRange(todayRange.start, todayRange.end));
  $("kpiWeekGrid").innerHTML = renderKpiGrid(calculateKpisForRange(weekRange.start, weekRange.end));
  $("kpiMonthGrid").innerHTML = renderKpiGrid(calculateKpisForRange(monthRange.start, monthRange.end));
  renderKpiLeaderboard(monthRange.start, monthRange.end);
}

function renderKpiGrid(kpis) {
  const items = [
    ["Leads added", kpis.leadsAdded],
    ["Follow-ups", kpis.followUps],
    ["Messages sent", kpis.messagesSent],
    ["Calls made", kpis.callsMade],
    ["Proposals sent", kpis.proposalsSent],
    ["Meetings booked", kpis.meetingsBooked],
    ["Deals won", kpis.dealsWon],
    ["Conversion rate", `${kpis.conversionRate}%`]
  ];

  return items.map(([label, value]) => `
    <span>
      <strong>${escapeHtml(value)}</strong>
      ${escapeHtml(label)}
    </span>
  `).join("");
}

function calculateKpisForRange(start, end, managerId = null) {
  const leads = state.leads.filter((lead) => {
    if (managerId && lead.ownerId !== managerId) return false;
    return isDateInRange(getLeadCreatedDate(lead), start, end);
  });
  const allAssignedLeads = state.leads.filter((lead) => !managerId || lead.ownerId === managerId);
  const followUps = state.followUps.filter((followUp) => {
    if (managerId && followUp.ownerId !== managerId) return false;
    const followUpDate = followUp.completedAt ? formatIsoDate(followUp.completedAt) : followUp.dueDate;
    return isDateInRange(followUpDate, start, end);
  });
  const reports = state.reports.filter((report) => {
    if (managerId && report.ownerId !== managerId) return false;
    return isDateInRange(report.date, start, end);
  }).map(normalizeReport);

  const reportTotals = reports.reduce((totals, report) => ({
    messagesSent: totals.messagesSent + report.messagesSent,
    callsMade: totals.callsMade + report.callsMade,
    proposalsSent: totals.proposalsSent + report.proposalsSent,
    meetingsBooked: totals.meetingsBooked + report.meetingsBooked,
    dealsClosed: totals.dealsClosed + report.dealsClosed
  }), {
    messagesSent: 0,
    callsMade: 0,
    proposalsSent: 0,
    meetingsBooked: 0,
    dealsClosed: 0
  });

  const leadsWon = allAssignedLeads.filter((lead) => {
    if (normalizeStatus(lead.status) !== "won") return false;
    return isDateInRange(getLeadUpdatedDate(lead), start, end);
  }).length;
  const dealsWon = Math.max(leadsWon, reportTotals.dealsClosed);
  const conversionBase = allAssignedLeads.length || leads.length;
  const conversionRate = conversionBase ? Math.round((dealsWon / conversionBase) * 100) : 0;

  return {
    leadsAdded: leads.length,
    followUps: followUps.length + reports.reduce((sum, report) => sum + report.followUpsCompleted, 0),
    messagesSent: reportTotals.messagesSent,
    callsMade: reportTotals.callsMade,
    proposalsSent: reportTotals.proposalsSent,
    meetingsBooked: reportTotals.meetingsBooked,
    dealsWon,
    conversionRate
  };
}

function renderKpiLeaderboard(start, end) {
  const managers = isOwner()
    ? state.users.filter((user) => ["owner", "sales_manager"].includes(user.role) && !user.disabled)
    : [{ uid: state.user.uid, displayName: state.profile?.displayName, email: state.user.email }];
  const rows = managers.map((manager) => {
    const kpis = calculateKpisForRange(start, end, manager.uid);
    const score = kpis.leadsAdded + kpis.followUps + kpis.messagesSent + kpis.callsMade + (kpis.proposalsSent * 2) + (kpis.meetingsBooked * 3) + (kpis.dealsWon * 10);
    return { manager, kpis, score };
  }).sort((a, b) => b.score - a.score);

  $("kpiLeaderboardCount").textContent = `${rows.length} ${rows.length === 1 ? "manager" : "managers"}`;
  $("kpiLeaderboard").innerHTML = rows.length
    ? rows.map((row, index) => `
      <article class="record-card">
        <div class="record-header">
          <div>
            <div class="record-title">#${index + 1} ${escapeHtml(row.manager.displayName || row.manager.email)}</div>
            <div class="record-meta">
              <span class="badge">Score ${row.score}</span>
              <span>Leads ${row.kpis.leadsAdded}</span>
              <span>Follow-ups ${row.kpis.followUps}</span>
              <span>Proposals ${row.kpis.proposalsSent}</span>
              <span>Meetings ${row.kpis.meetingsBooked}</span>
              <span>Won ${row.kpis.dealsWon}</span>
              <span>Conversion ${row.kpis.conversionRate}%</span>
            </div>
          </div>
        </div>
      </article>
    `).join("")
    : `<article class="record-card"><p class="muted">No manager data yet.</p></article>`;
}

function getDateRange(period) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (period === "week") {
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);
  }

  if (period === "month") {
    start.setDate(1);
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    label: period === "today" ? today() : `${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}`
  };
}

function isDateInRange(dateString, start, end) {
  if (!dateString) return false;
  return dateString >= start && dateString <= end;
}

function getLeadCreatedDate(lead) {
  return lead.createdDate || formatIsoDate(lead.createdAt);
}

function getLeadUpdatedDate(lead) {
  return lead.updatedDate || formatIsoDate(lead.updatedAt) || getLeadCreatedDate(lead);
}

function formatIsoDate(value) {
  if (!value) return "";
  const date = value.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
