import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm';

const SUPABASE_URL = 'https://otwsbuzwtavmdieaaiwz.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_EItXG2wbrQ2JwF9HNIqGkQ_CjChkh3B';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

const authView = document.querySelector('#auth-view');
const appView = document.querySelector('#app-view');
const loginForm = document.querySelector('#login-form');
const loginButton = document.querySelector('#login-button');
const logoutButton = document.querySelector('#logout-button');
const authMessage = document.querySelector('#auth-message');
const signedInUser = document.querySelector('#signed-in-user');
const statusPanel = document.querySelector('#status');
const dashboardSections = document.querySelectorAll('.hero, .section-heading, .grid, #status, #dashboard-summary, #reminder-banner');
const clientsWorkspace = document.querySelector('#clients-workspace');
const closeClientsButton = document.querySelector('#close-clients');
const clientForm = document.querySelector('#client-form');
const createClientButton = document.querySelector('#create-client-button');
const clientFormMessage = document.querySelector('#client-form-message');
const clientSearch = document.querySelector('#client-search');
const clientList = document.querySelector('#client-list');
const clientListMessage = document.querySelector('#client-list-message');
const refreshClientsButton = document.querySelector('#refresh-clients');
const clientDetail = document.querySelector('#client-detail');
const clientDetailTitle = document.querySelector('#client-detail-title');
const detailDateOfBirth = document.querySelector('#detail-date-of-birth');
const detailStatus = document.querySelector('#detail-status');
const detailCreatedAt = document.querySelector('#detail-created-at');
const newNoteButton = document.querySelector('#new-note-button');
const notesCount = document.querySelector('#notes-count');
const notesMessage = document.querySelector('#notes-message');
const notesList = document.querySelector('#notes-list');
const noteEditor = document.querySelector('#note-editor');
const noteEditorTitle = document.querySelector('#note-editor-title');
const noteClientName = document.querySelector('#note-client-name');
const closeNoteEditorButton = document.querySelector('#close-note-editor');
const noteForm = document.querySelector('#note-form');
const noteType = document.querySelector('#note-type');
const sessionAt = document.querySelector('#session-at');
const noteStatus = document.querySelector('#note-status');
const saveNoteButton = document.querySelector('#save-note-button');
const clearNoteButton = document.querySelector('#clear-note-button');
const noteFormMessage = document.querySelector('#note-form-message');
const noteLabels = [1, 2, 3, 4].map((number) => document.querySelector(`#note-label-${number}`));
const noteFields = [1, 2, 3, 4].map((number) => document.querySelector(`#note-field-${number}`));
const securityWorkspace = document.querySelector('#security-workspace');
const closeSecurityButton = document.querySelector('#close-security');
const refreshAuditButton = document.querySelector('#refresh-audit');
const auditMessage = document.querySelector('#audit-message');
const auditList = document.querySelector('#audit-list');
const followupsWorkspace = document.querySelector('#followups-workspace');
const closeFollowupsButton = document.querySelector('#close-followups');
const followupSummary = document.querySelector('#followup-summary');
const followupForm = document.querySelector('#followup-form');
const followupClient = document.querySelector('#followup-client');
const followupTime = document.querySelector('#followup-time');
const followupType = document.querySelector('#followup-type');
const followupPurpose = document.querySelector('#followup-purpose');
const saveFollowupButton = document.querySelector('#save-followup');
const followupFormMessage = document.querySelector('#followup-form-message');
const followupListMessage = document.querySelector('#followup-list-message');
const followupList = document.querySelector('#followup-list');
const refreshFollowupsButton = document.querySelector('#refresh-followups');
const whareWorkspace = document.querySelector('#whare-workspace');
const reportsWorkspace = document.querySelector('#reports-workspace');
const manaakiWorkspace = document.querySelector('#manaaki-workspace');
const extraWorkspaces = [whareWorkspace, reportsWorkspace, manaakiWorkspace];
const whareForm = document.querySelector('#whare-form');
const whareClient = document.querySelector('#whare-client');
const pouInputs = ['tinana','hinengaro','whanau','wairua'].map((name) => document.querySelector(`#pou-${name}`));
const mauriScore = document.querySelector('#mauri-score');
const whareFields = ['strengths','needs','risks','plan'].map((name) => document.querySelector(`#whare-${name}`));
const whareMessage = document.querySelector('#whare-message');
const reportClient = document.querySelector('#report-client');
const reportPreview = document.querySelector('#report-preview');
const reportMessage = document.querySelector('#report-message');
const manaakiSummary = document.querySelector('#manaaki-summary');
const manaakiPriorities = document.querySelector('#manaaki-priorities');
const safetyForm = document.querySelector('#safety-form');
const clientConsent = document.querySelector('#client-consent');
const clientRisk = document.querySelector('#client-risk');
const clientAlert = document.querySelector('#client-alert');
const clientSafetyPlan = document.querySelector('#client-safety-plan');
const safetyMessage = document.querySelector('#safety-message');
const profileForm = document.querySelector('#profile-form');
const profileName = document.querySelector('#profile-name');
const profileMessage = document.querySelector('#profile-message');
const passwordForm = document.querySelector('#password-form');
const passwordMessage = document.querySelector('#password-message');
const toggleClientStatusButton = document.querySelector('#toggle-client-status');
const reminderBanner = document.querySelector('#reminder-banner');
const exportMessage = document.querySelector('#export-message');

let authorisedClients = [];
let selectedClient = null;
let selectedNoteId = null;
let savedNotes = [];
let followups = [];
let followupFilter = 'open';

const noteTemplates = {
  DARP: ['Data', 'Assessment', 'Response', 'Plan'],
  SOAP: ['Subjective', 'Objective', 'Assessment', 'Plan']
};

function renderSession(session) {
  const signedIn = Boolean(session?.user);
  authView.hidden = signedIn;
  appView.hidden = !signedIn;
  signedInUser.textContent = signedIn ? session.user.email ?? 'Practitioner' : '';
  if (!signedIn) loginForm.reset();
  if (signedIn) loadDashboardSummary();
  if (!signedIn) {
    authorisedClients = [];
    selectedClient = null;
    savedNotes = [];
    showDashboard();
  }
}

async function loadDashboardSummary() {
  const { data:userData }=await supabase.auth.getUser(); if(!userData.user)return;
  const userId=userData.user.id;
  const [clientsResult,appointmentsResult,notesResult]=await Promise.all([
    supabase.from('clients').select('id,status'),
    supabase.from('appointments').select('scheduled_at,status').eq('practitioner_id',userId),
    supabase.from('case_notes').select('status').eq('practitioner_id',userId)
  ]);
  if(clientsResult.error||appointmentsResult.error||notesResult.error)return;
  const now=new Date(); const today=new Date(now.getFullYear(),now.getMonth(),now.getDate()); const tomorrow=new Date(today);tomorrow.setDate(tomorrow.getDate()+1);
  const open=(appointmentsResult.data??[]).filter((item)=>item.status==='scheduled');
  const overdue=open.filter((item)=>new Date(item.scheduled_at)<now).length;
  const dueToday=open.filter((item)=>{const due=new Date(item.scheduled_at);return due>=now&&due<tomorrow;}).length;
  document.querySelector('#summary-clients').textContent=(clientsResult.data??[]).filter((item)=>item.status==='active').length;
  document.querySelector('#summary-overdue').textContent=overdue;
  document.querySelector('#summary-today').textContent=dueToday;
  document.querySelector('#summary-drafts').textContent=(notesResult.data??[]).filter((item)=>item.status==='draft').length;
  reminderBanner.hidden=overdue+dueToday===0;
  reminderBanner.textContent=overdue+dueToday ? `Manaaki reminder: ${overdue} overdue and ${dueToday} due today. Review your Follow-ups room.` : '';
}

function setMessage(element, message = '', state = '') {
  element.textContent = message;
  element.className = `form-message${state ? ` ${state}` : ''}`;
}

function showDashboard() {
  dashboardSections.forEach((section) => { section.hidden = false; });
  clientsWorkspace.hidden = true;
  securityWorkspace.hidden = true;
  followupsWorkspace.hidden = true;
  extraWorkspaces.forEach((workspace) => { workspace.hidden = true; });
  clientDetail.hidden = true;
  noteEditor.hidden = true;
  loadDashboardSummary();
}

async function showFollowupsWorkspace() {
  dashboardSections.forEach((section) => { section.hidden = true; });
  clientsWorkspace.hidden = true;
  securityWorkspace.hidden = true;
  followupsWorkspace.hidden = false;
  extraWorkspaces.forEach((workspace) => { workspace.hidden = true; });
  await loadClients();
  followupClient.replaceChildren();
  authorisedClients.forEach((client) => {
    const option = document.createElement('option');
    option.value = client.id;
    option.textContent = formatClientName(client);
    followupClient.append(option);
  });
  followupTime.value = localDateTimeValue();
  saveFollowupButton.disabled = authorisedClients.length === 0;
  setMessage(followupFormMessage, authorisedClients.length ? '' : 'Create a demo client before scheduling a follow-up.');
  await loadFollowups();
}

function fillClientSelect(select) {
  select.replaceChildren();
  authorisedClients.forEach((client) => {
    const option = document.createElement('option'); option.value = client.id; option.textContent = formatClientName(client); select.append(option);
  });
}

async function showWhareWorkspace() {
  dashboardSections.forEach((section) => { section.hidden = true; });
  clientsWorkspace.hidden = true; securityWorkspace.hidden = true; followupsWorkspace.hidden = true;
  extraWorkspaces.forEach((workspace) => { workspace.hidden = workspace !== whareWorkspace; });
  await loadClients(); fillClientSelect(whareClient); updateMauriScore();
  setMessage(whareMessage, authorisedClients.length ? '' : 'Create a demo client before recording wellbeing.');
}

async function showReportsWorkspace() {
  dashboardSections.forEach((section) => { section.hidden = true; });
  clientsWorkspace.hidden = true; securityWorkspace.hidden = true; followupsWorkspace.hidden = true;
  extraWorkspaces.forEach((workspace) => { workspace.hidden = workspace !== reportsWorkspace; });
  await loadClients(); fillClientSelect(reportClient); reportPreview.replaceChildren(); setMessage(reportMessage);
}

async function showManaakiWorkspace() {
  dashboardSections.forEach((section) => { section.hidden = true; });
  clientsWorkspace.hidden = true; securityWorkspace.hidden = true; followupsWorkspace.hidden = true;
  extraWorkspaces.forEach((workspace) => { workspace.hidden = workspace !== manaakiWorkspace; });
  await loadClients(); await loadFollowups();
  const open = followups.filter((item) => item.status === 'scheduled'); const overdue = open.filter((item) => followupBucket(item) === 'overdue');
  manaakiSummary.replaceChildren();
  [['Demo clients',authorisedClients.length],['Open follow-ups',open.length],['Overdue',overdue.length]].forEach(([label,count]) => { const card=document.createElement('div'); const strong=document.createElement('strong'); const span=document.createElement('span'); strong.textContent=count; span.textContent=label; card.append(strong,span); manaakiSummary.append(card); });
  manaakiPriorities.replaceChildren();
  const priorities=[overdue.length ? `Review ${overdue.length} overdue follow-up${overdue.length===1?'':'s'}.` : 'No overdue follow-ups — ka pai.', open.length ? 'Review today’s scheduled contacts.' : 'Schedule the next appropriate demo follow-up.', 'Complete outstanding case-note drafts and check safety plans.'];
  priorities.forEach((item) => { const li=document.createElement('li'); li.textContent=item; manaakiPriorities.append(li); });
}

function updateMauriScore() {
  const total = pouInputs.reduce((sum,input) => sum + Number(input.value), 0);
  mauriScore.textContent = `Mauri: ${total} / 20 · ${total * 5}%`;
}

function followupBucket(item) {
  if (item.status !== 'scheduled') return item.status;
  const now = new Date();
  const due = new Date(item.scheduled_at);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  if (due < now) return 'overdue';
  if (due < tomorrow) return 'today';
  return 'upcoming';
}

function renderFollowups() {
  const counts = { overdue: 0, today: 0, upcoming: 0 };
  followups.forEach((item) => { const bucket = followupBucket(item); if (bucket in counts) counts[bucket] += 1; });
  followupSummary.replaceChildren();
  [['Overdue', counts.overdue], ['Due today', counts.today], ['Upcoming', counts.upcoming]].forEach(([label, count]) => {
    const card = document.createElement('div'); const number = document.createElement('strong'); const text = document.createElement('span');
    number.textContent = count; text.textContent = label; card.append(number, text); followupSummary.append(card);
  });
  const visible = followupFilter === 'open' ? followups.filter((item) => item.status === 'scheduled') : followups;
  followupList.replaceChildren();
  setMessage(followupListMessage, visible.length ? `${visible.length} ${followupFilter === 'open' ? 'open' : 'total'} follow-up${visible.length === 1 ? '' : 's'}.` : 'No follow-ups in this view.');
  visible.forEach((item) => {
    const row = document.createElement('article'); row.className = 'followup-row';
    const badge = document.createElement('span'); badge.className = `due-badge ${followupBucket(item)}`; badge.textContent = followupBucket(item).replace('_', ' ');
    const detail = document.createElement('div'); const name = document.createElement('strong'); const meta = document.createElement('small');
    name.textContent = formatClientName(item.clients); meta.textContent = `${new Intl.DateTimeFormat('en-NZ', { dateStyle:'medium', timeStyle:'short' }).format(new Date(item.scheduled_at))} · ${item.contact_type.replace('_', ' ')} · ${item.purpose}`;
    detail.append(name, meta); row.append(badge, detail);
    if (item.status === 'scheduled') {
      const actions=document.createElement('div');actions.className='outcome-actions';
      [['Complete','completed'],['No show','no_show'],['Cancel','cancelled']].forEach(([label,status])=>{const button=document.createElement('button');button.type='button';button.className='secondary-button';button.textContent=label;button.addEventListener('click',()=>setFollowupOutcome(item.id,status));actions.append(button);});
      row.append(actions);
    }
    followupList.append(row);
  });
}

async function loadFollowups() {
  setMessage(followupListMessage, 'Loading your secure schedule…');
  refreshFollowupsButton.disabled = true;
  const { data, error } = await supabase.from('appointments').select('id, scheduled_at, contact_type, purpose, status, clients(preferred_name, family_name)').order('scheduled_at', { ascending: true });
  refreshFollowupsButton.disabled = false;
  if (error) { setMessage(followupListMessage, 'AWHI could not load follow-ups.', 'error'); return; }
  followups = data ?? []; renderFollowups();
}

async function setFollowupOutcome(id,status) {
  const { error } = await supabase.from('appointments').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) { setMessage(followupListMessage, 'The follow-up outcome could not be saved.', 'error'); return; }
  await loadFollowups();
}

async function showClientsWorkspace() {
  dashboardSections.forEach((section) => { section.hidden = true; });
  followupsWorkspace.hidden = true;
  securityWorkspace.hidden = true;
  clientsWorkspace.hidden = false;
  clientsWorkspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
  await loadClients();
}

async function showSecurityWorkspace() {
  dashboardSections.forEach((section) => { section.hidden = true; });
  clientsWorkspace.hidden = true;
  followupsWorkspace.hidden = true;
  extraWorkspaces.forEach((workspace) => { workspace.hidden = true; });
  securityWorkspace.hidden = false;
  const { data } = await supabase.from('practitioners').select('display_name').single();
  profileName.value = data?.display_name ?? '';
  await loadAuditEvents();
}

async function loadAuditEvents() {
  setMessage(auditMessage, 'Loading your security activity…');
  refreshAuditButton.disabled = true;
  const { data, error } = await supabase.from('audit_events')
    .select('id, action, entity_type, metadata, occurred_at')
    .order('occurred_at', { ascending: false }).limit(50);
  refreshAuditButton.disabled = false;
  auditList.replaceChildren();
  if (error) { setMessage(auditMessage, 'AWHI could not load the activity register.', 'error'); return; }
  if (!data?.length) { setMessage(auditMessage, 'No activity has been recorded yet.'); return; }
  setMessage(auditMessage, `${data.length} recent event${data.length === 1 ? '' : 's'}.`);
  data.forEach((event) => {
    const row = document.createElement('div'); row.className = 'audit-row';
    const icon = document.createElement('span'); icon.className = 'audit-icon'; icon.textContent = ({ client: 'C', case_note: 'N', appointment: 'F' })[event.entity_type] ?? 'A';
    const detail = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = event.action.split('.').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
    const meta = document.createElement('small'); meta.textContent = [event.metadata?.note_type, event.metadata?.contact_type?.replace('_', ' '), event.metadata?.status].filter(Boolean).join(' · ') || 'No clinical content stored';
    detail.append(title, meta);
    const time = document.createElement('time'); time.textContent = new Intl.DateTimeFormat('en-NZ', { dateStyle:'medium', timeStyle:'short' }).format(new Date(event.occurred_at));
    row.append(icon, detail, time); auditList.append(row);
  });
}

function formatClientName(client) {
  return [client.preferred_name, client.family_name].filter(Boolean).join(' ');
}

function renderClientList() {
  const term = clientSearch.value.trim().toLocaleLowerCase();
  const filteredClients = authorisedClients.filter((client) => formatClientName(client).toLocaleLowerCase().includes(term));
  clientList.replaceChildren();

  if (!filteredClients.length) {
    setMessage(clientListMessage, term ? 'No matching demo clients.' : 'No demo clients yet. Create one using the form.');
    return;
  }

  setMessage(clientListMessage, `${filteredClients.length} authorised demo client${filteredClients.length === 1 ? '' : 's'}.`);
  filteredClients.forEach((client) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'client-row';

    const name = document.createElement('strong');
    name.textContent = formatClientName(client);
    const status = document.createElement('span');
    status.textContent = client.status;
    button.append(name, status);
    button.addEventListener('click', () => openClient(client));
    clientList.append(button);
  });
}

async function openClient(client) {
  selectedClient = client;
  clientDetailTitle.textContent = formatClientName(client);
  detailDateOfBirth.textContent = client.date_of_birth
    ? new Intl.DateTimeFormat('en-NZ', { dateStyle: 'long' }).format(new Date(`${client.date_of_birth}T00:00:00`))
    : 'Not recorded';
  detailStatus.textContent = client.status;
  detailCreatedAt.textContent = new Intl.DateTimeFormat('en-NZ', { dateStyle: 'medium' }).format(new Date(client.created_at));
  document.querySelector('#detail-consent').textContent = client.consent_status.replace('_', ' ');
  document.querySelector('#detail-risk').textContent = client.risk_level.replace('_', ' ');
  document.querySelector('#detail-alert').textContent = client.alert_active ? 'Active' : 'None';
  clientConsent.value = client.consent_status; clientRisk.value = client.risk_level; clientAlert.checked = client.alert_active; clientSafetyPlan.value = client.safety_plan ?? '';
  toggleClientStatusButton.textContent = client.status === 'archived' ? 'Restore demo client' : 'Archive demo client';
  clientDetail.hidden = false;
  noteEditor.hidden = true;
  await loadNotes();
  clientDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function localDateTimeValue(date = new Date()) {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
}

function setNoteTemplate(type) {
  noteTemplates[type].forEach((label, index) => { noteLabels[index].textContent = label; });
}

function resetNoteEditor() {
  selectedNoteId = null;
  noteEditorTitle.textContent = 'New session note';
  noteType.value = 'DARP';
  noteStatus.value = 'draft';
  sessionAt.value = localDateTimeValue();
  noteFields.forEach((field) => {
    field.value = '';
    field.disabled = false;
  });
  noteType.disabled = false;
  sessionAt.disabled = false;
  noteStatus.disabled = false;
  saveNoteButton.hidden = false;
  clearNoteButton.hidden = true;
  setNoteTemplate('DARP');
  setMessage(noteFormMessage);
}

function showNewNote() {
  if (!selectedClient) return;
  resetNoteEditor();
  noteClientName.textContent = `Demo client: ${formatClientName(selectedClient)}`;
  noteEditor.hidden = false;
  noteEditor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function noteContentForForm() {
  const keys = noteTemplates[noteType.value].map((label) => label.toLocaleLowerCase());
  return Object.fromEntries(keys.map((key, index) => [key, noteFields[index].value.trim()]));
}

function renderNotes() {
  notesList.replaceChildren();
  notesCount.textContent = `${savedNotes.length} note${savedNotes.length === 1 ? '' : 's'}`;
  if (!savedNotes.length) {
    setMessage(notesMessage, 'No demo session notes saved for this client.');
    return;
  }
  setMessage(notesMessage);
  savedNotes.forEach((note) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'note-row';
    const badge = document.createElement('span');
    badge.className = 'note-type-badge';
    badge.textContent = note.note_type;
    const summary = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = new Intl.DateTimeFormat('en-NZ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(note.session_at));
    const hint = document.createElement('small');
    hint.textContent = note.status === 'draft' ? 'Open to continue editing' : 'Final — read only';
    summary.append(title, hint);
    const status = document.createElement('span');
    status.className = 'note-status';
    status.textContent = note.status;
    button.append(badge, summary, status);
    button.addEventListener('click', () => openNote(note));
    notesList.append(button);
  });
}

async function loadNotes() {
  if (!selectedClient) return;
  setMessage(notesMessage, 'Loading authorised demo notes…');
  const { data, error } = await supabase
    .from('case_notes')
    .select('id, session_at, note_type, content, status, created_at, updated_at')
    .eq('client_id', selectedClient.id)
    .order('session_at', { ascending: false });
  if (error) {
    setMessage(notesMessage, 'AWHI could not load session notes.', 'error');
    return;
  }
  savedNotes = data ?? [];
  renderNotes();
}

function openNote(note) {
  selectedNoteId = note.id;
  noteEditorTitle.textContent = `${note.note_type} session note`;
  noteClientName.textContent = `Demo client: ${formatClientName(selectedClient)}`;
  noteType.value = note.note_type;
  noteStatus.value = note.status;
  sessionAt.value = localDateTimeValue(new Date(note.session_at));
  setNoteTemplate(note.note_type);
  noteTemplates[note.note_type].forEach((label, index) => {
    noteFields[index].value = note.content?.[label.toLocaleLowerCase()] ?? '';
  });
  const readOnly = note.status === 'final';
  noteFields.forEach((field) => { field.disabled = readOnly; });
  noteType.disabled = readOnly;
  sessionAt.disabled = readOnly;
  noteStatus.disabled = readOnly;
  saveNoteButton.hidden = readOnly;
  clearNoteButton.hidden = false;
  setMessage(noteFormMessage, readOnly ? 'This note is final and opens as read-only.' : 'Draft reopened for editing.');
  noteEditor.hidden = false;
  noteEditor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadClients() {
  setMessage(clientListMessage, 'Loading authorised demo clients…');
  refreshClientsButton.disabled = true;

  const { data, error } = await supabase
    .from('clients')
    .select('id, preferred_name, family_name, date_of_birth, status, consent_status, risk_level, alert_active, safety_plan, created_at')
    .order('preferred_name', { ascending: true });

  refreshClientsButton.disabled = false;
  if (error) {
    setMessage(clientListMessage, 'AWHI could not load clients. Please sign out and try again.', 'error');
    return;
  }

  authorisedClients = data ?? [];
  renderClientList();
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  authMessage.textContent = '';
  loginButton.disabled = true;
  loginButton.textContent = 'Signing in…';

  const form = new FormData(loginForm);
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    authMessage.textContent = 'Sign in was not successful. Check your email and password.';
  } else {
    renderSession(data.session);
  }

  loginButton.disabled = false;
  loginButton.textContent = 'Sign in securely';
});

logoutButton.addEventListener('click', async () => {
  logoutButton.disabled = true;
  const { error } = await supabase.auth.signOut();
  if (error) {
    alert('AWHI could not sign you out. Please try again.');
  }
  logoutButton.disabled = false;
});

supabase.auth.onAuthStateChange((_event, session) => {
  renderSession(session);
});

const { data: initialSession } = await supabase.auth.getSession();
renderSession(initialSession.session);

const moduleMessages = {
  clients: ['Clients', 'Phase One will connect secure client search, creation and authorised access here.'],
  notes: ['Session Notes', 'This room will hold structured DARP and SOAP notes linked to an authorised client.'],
  whare: ['Te Whare Tapa Whā', 'The interactive whare is preserved as a core AWHI feature, but it follows the secure clinical foundation.'],
  reports: ['Reports', 'Report generation is deliberately deferred until saved clinical information and permissions are reliable.'],
  manaaki: ['Manaaki', 'Manaaki AI comes later. No sensitive clinical information should be sent to an AI workflow until governance and privacy controls are defined.'],
  settings: ['Settings', 'Authentication, practitioner profile and security controls live here.']
};

document.querySelectorAll('.module').forEach((button) => {
  button.addEventListener('click', async () => {
    if (button.dataset.module === 'clients') {
      await showClientsWorkspace();
      return;
    }
    if (button.dataset.module === 'settings') {
      await showSecurityWorkspace();
      return;
    }
    if (button.dataset.module === 'followups') {
      await showFollowupsWorkspace();
      return;
    }
    if (button.dataset.module === 'whare') { await showWhareWorkspace(); return; }
    if (button.dataset.module === 'reports') { await showReportsWorkspace(); return; }
    if (button.dataset.module === 'manaaki') { await showManaakiWorkspace(); return; }
    const [title, body] = moduleMessages[button.dataset.module];
    statusPanel.innerHTML = `<p class="eyebrow">Selected room</p><h2>${title}</h2><p>${body}</p>`;
    statusPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
});

clientForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage(clientFormMessage);
  createClientButton.disabled = true;
  createClientButton.textContent = 'Creating securely…';

  const form = new FormData(clientForm);
  const preferredName = String(form.get('preferred_name') ?? '').trim();
  const familyName = String(form.get('family_name') ?? '').trim() || null;
  const dateOfBirth = String(form.get('date_of_birth') ?? '') || null;

  const { data: clientId, error } = await supabase.rpc('create_demo_client', {
    p_preferred_name: preferredName,
    p_family_name: familyName,
    p_date_of_birth: dateOfBirth
  });

  createClientButton.disabled = false;
  createClientButton.textContent = 'Create demo client';

  if (error) {
    setMessage(clientFormMessage, 'The demo client could not be created. Check your session and try again.', 'error');
    return;
  }

  clientForm.reset();
  setMessage(clientFormMessage, 'Demo client created securely.', 'success');
  await loadClients();
  const createdClient = authorisedClients.find((client) => client.id === clientId);
  if (createdClient) openClient(createdClient);
});

clientSearch.addEventListener('input', renderClientList);
refreshClientsButton.addEventListener('click', loadClients);
closeClientsButton.addEventListener('click', showDashboard);
closeSecurityButton.addEventListener('click', showDashboard);
refreshAuditButton.addEventListener('click', loadAuditEvents);
closeFollowupsButton.addEventListener('click', showDashboard);
refreshFollowupsButton.addEventListener('click', loadFollowups);
document.querySelectorAll('[data-followup-filter]').forEach((button) => button.addEventListener('click', () => {
  followupFilter = button.dataset.followupFilter;
  document.querySelectorAll('[data-followup-filter]').forEach((item) => item.classList.toggle('active', item === button));
  renderFollowups();
}));
document.querySelector('#close-whare').addEventListener('click', showDashboard);
document.querySelector('#close-reports').addEventListener('click', showDashboard);
document.querySelector('#close-manaaki').addEventListener('click', showDashboard);
pouInputs.forEach((input) => input.addEventListener('input', updateMauriScore));
newNoteButton.addEventListener('click', showNewNote);
clearNoteButton.addEventListener('click', showNewNote);
closeNoteEditorButton.addEventListener('click', () => { noteEditor.hidden = true; });
noteType.addEventListener('change', () => setNoteTemplate(noteType.value));

noteForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!selectedClient) return;
  setMessage(noteFormMessage);
  saveNoteButton.disabled = true;
  saveNoteButton.textContent = 'Saving securely…';

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    setMessage(noteFormMessage, 'Your session has expired. Please sign in again.', 'error');
    saveNoteButton.disabled = false;
    saveNoteButton.textContent = 'Save demo note';
    return;
  }

  const noteRecord = {
    client_id: selectedClient.id,
    practitioner_id: userData.user.id,
    session_at: new Date(sessionAt.value).toISOString(),
    note_type: noteType.value,
    content: noteContentForForm(),
    status: noteStatus.value,
    updated_at: new Date().toISOString()
  };

  const response = selectedNoteId
    ? await supabase.from('case_notes').update(noteRecord).eq('id', selectedNoteId).select('id').single()
    : await supabase.from('case_notes').insert(noteRecord).select('id').single();

  saveNoteButton.disabled = false;
  saveNoteButton.textContent = 'Save demo note';
  if (response.error) {
    setMessage(noteFormMessage, 'The demo note could not be saved. Check the fields and try again.', 'error');
    return;
  }

  selectedNoteId = response.data.id;
  setMessage(noteFormMessage, noteStatus.value === 'final' ? 'Demo note saved as final.' : 'Demo draft saved securely.', 'success');
  await loadNotes();
  const savedNote = savedNotes.find((note) => note.id === selectedNoteId);
  if (savedNote) openNote(savedNote);
});

followupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  saveFollowupButton.disabled = true;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const { error } = userError ? { error: userError } : await supabase.from('appointments').insert({
    client_id: followupClient.value,
    practitioner_id: userData.user.id,
    scheduled_at: new Date(followupTime.value).toISOString(),
    contact_type: followupType.value,
    purpose: followupPurpose.value.trim(),
    status: 'scheduled'
  });
  saveFollowupButton.disabled = false;
  if (error) { setMessage(followupFormMessage, 'The follow-up could not be scheduled.', 'error'); return; }
  followupPurpose.value = 'Follow-up'; followupTime.value = localDateTimeValue();
  setMessage(followupFormMessage, 'Demo follow-up scheduled securely.', 'success');
  await loadFollowups();
});

safetyForm.addEventListener('submit', async (event) => {
  event.preventDefault(); if (!selectedClient) return;
  const updates={consent_status:clientConsent.value,risk_level:clientRisk.value,alert_active:clientAlert.checked,safety_plan:clientSafetyPlan.value.trim()||null,updated_at:new Date().toISOString()};
  const { error }=await supabase.from('clients').update(updates).eq('id',selectedClient.id);
  if(error){setMessage(safetyMessage,'Safety details could not be saved.','error');return;}
  Object.assign(selectedClient,updates); setMessage(safetyMessage,'Demo safety details saved.','success'); await openClient(selectedClient);
});

toggleClientStatusButton.addEventListener('click',async()=>{
  if(!selectedClient)return;
  const status=selectedClient.status==='archived'?'active':'archived';
  const {error}=await supabase.from('clients').update({status,updated_at:new Date().toISOString()}).eq('id',selectedClient.id);
  if(error){setMessage(safetyMessage,'The client status could not be changed.','error');return;}
  selectedClient.status=status; detailStatus.textContent=status; toggleClientStatusButton.textContent=status==='archived'?'Restore demo client':'Archive demo client'; await loadClients();
});

whareForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const { data:userData,error:userError }=await supabase.auth.getUser();
  const values=pouInputs.map((input)=>Number(input.value));
  const { error }=userError?{error:userError}:await supabase.from('wellbeing_assessments').insert({client_id:whareClient.value,practitioner_id:userData.user.id,taha_tinana:values[0],taha_hinengaro:values[1],taha_whanau:values[2],taha_wairua:values[3],strengths:whareFields[0].value.trim()||null,support_needs:whareFields[1].value.trim()||null,risk_concerns:whareFields[2].value.trim()||null,plan:whareFields[3].value.trim()||null});
  if(error){setMessage(whareMessage,'The wellbeing snapshot could not be saved.','error');return;}
  setMessage(whareMessage,'Demo wellbeing snapshot saved securely.','success'); whareFields.forEach((field)=>{field.value='';});
});

document.querySelector('#generate-report').addEventListener('click', async () => {
  const client=authorisedClients.find((item)=>item.id===reportClient.value); if(!client){setMessage(reportMessage,'Choose a demo client.','error');return;}
  const [notesResult,wellbeingResult,appointmentsResult]=await Promise.all([
    supabase.from('case_notes').select('session_at,note_type,content,status').eq('client_id',client.id).order('session_at',{ascending:false}),
    supabase.from('wellbeing_assessments').select('assessed_at,taha_tinana,taha_hinengaro,taha_whanau,taha_wairua,strengths,support_needs,risk_concerns,plan').eq('client_id',client.id).order('assessed_at',{ascending:false}).limit(1),
    supabase.from('appointments').select('scheduled_at,contact_type,status,purpose').eq('client_id',client.id).order('scheduled_at',{ascending:true})
  ]);
  if(notesResult.error||wellbeingResult.error||appointmentsResult.error){setMessage(reportMessage,'The report information could not be loaded.','error');return;}
  reportPreview.replaceChildren();
  const heading=document.createElement('h2'); heading.textContent=`AWHI Demo Clinical Summary — ${formatClientName(client)}`; reportPreview.append(heading);
  const overview=document.createElement('p'); overview.textContent=`Consent: ${client.consent_status.replace('_',' ')} · Risk: ${client.risk_level.replace('_',' ')} · Safety alert: ${client.alert_active?'Active':'None'}`; reportPreview.append(overview);
  const latest=wellbeingResult.data?.[0]; if(latest){const h=document.createElement('h3');h.textContent='Latest Te Whare Tapa Whā snapshot';const p=document.createElement('p');const score=latest.taha_tinana+latest.taha_hinengaro+latest.taha_whanau+latest.taha_wairua;p.textContent=`Mauri ${score}/20 (${score*5}%). Strengths: ${latest.strengths||'Not recorded'}. Support needs: ${latest.support_needs||'Not recorded'}. Risk concerns: ${latest.risk_concerns||'Not recorded'}. Plan: ${latest.plan||'Not recorded'}.`;reportPreview.append(h,p);}
  const nh=document.createElement('h3');nh.textContent=`Session notes (${notesResult.data.length})`;reportPreview.append(nh);notesResult.data.forEach((note)=>{const p=document.createElement('p');p.textContent=`${new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium'}).format(new Date(note.session_at))} · ${note.note_type} · ${note.status}`;reportPreview.append(p);});
  const fh=document.createElement('h3');fh.textContent=`Follow-ups (${appointmentsResult.data.length})`;reportPreview.append(fh);appointmentsResult.data.forEach((item)=>{const p=document.createElement('p');p.textContent=`${new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short'}).format(new Date(item.scheduled_at))} · ${item.contact_type.replace('_',' ')} · ${item.status} · ${item.purpose}`;reportPreview.append(p);});
  setMessage(reportMessage,'Demo summary generated. Review it before printing.','success');
});
document.querySelector('#print-report').addEventListener('click',()=>window.print());

profileForm.addEventListener('submit',async(event)=>{event.preventDefault();const {data:user}=await supabase.auth.getUser();const {error}=await supabase.from('practitioners').update({display_name:profileName.value.trim()}).eq('id',user.user.id);setMessage(profileMessage,error?'Profile could not be saved.':'Profile saved.',error?'error':'success');});
passwordForm.addEventListener('submit',async(event)=>{event.preventDefault();const password=document.querySelector('#new-password').value;const confirm=document.querySelector('#confirm-password').value;if(password!==confirm){setMessage(passwordMessage,'The passwords do not match.','error');return;}const {error}=await supabase.auth.updateUser({password});if(error){setMessage(passwordMessage,'Password could not be updated. You may need to sign in again.','error');return;}passwordForm.reset();setMessage(passwordMessage,'Password updated securely.','success');});

document.querySelector('#export-demo-data').addEventListener('click',async()=>{
  setMessage(exportMessage,'Preparing your authorised demo records…');
  const {data:userData}=await supabase.auth.getUser(); if(!userData.user){setMessage(exportMessage,'Your session has expired.','error');return;}
  const userId=userData.user.id;
  const results=await Promise.all([
    supabase.from('practitioners').select('display_name,role,created_at').eq('id',userId),
    supabase.from('clients').select('*'),
    supabase.from('case_notes').select('*').eq('practitioner_id',userId),
    supabase.from('appointments').select('*').eq('practitioner_id',userId),
    supabase.from('wellbeing_assessments').select('*').eq('practitioner_id',userId),
    supabase.from('audit_events').select('action,entity_type,entity_id,client_id,metadata,occurred_at').eq('actor_id',userId)
  ]);
  if(results.some((result)=>result.error)){setMessage(exportMessage,'The demo export could not be prepared.','error');return;}
  const payload={exported_at:new Date().toISOString(),mode:'AWHI demo only',practitioner:results[0].data,clients:results[1].data,case_notes:results[2].data,appointments:results[3].data,wellbeing_assessments:results[4].data,audit_events:results[5].data};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=`awhi-demo-export-${new Date().toISOString().slice(0,10)}.json`;link.click();URL.revokeObjectURL(url);
  setMessage(exportMessage,'Your authorised demo export was downloaded.','success');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
}
