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
const dashboardSections = document.querySelectorAll('.hero, .section-heading, .grid, #status');
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
  if (!signedIn) {
    authorisedClients = [];
    selectedClient = null;
    savedNotes = [];
    showDashboard();
  }
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
  clientDetail.hidden = true;
  noteEditor.hidden = true;
}

async function showFollowupsWorkspace() {
  dashboardSections.forEach((section) => { section.hidden = true; });
  clientsWorkspace.hidden = true;
  securityWorkspace.hidden = true;
  followupsWorkspace.hidden = false;
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
    if (item.status === 'scheduled') { const done = document.createElement('button'); done.type = 'button'; done.className = 'secondary-button'; done.textContent = 'Complete'; done.addEventListener('click', () => completeFollowup(item.id)); row.append(done); }
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

async function completeFollowup(id) {
  const { error } = await supabase.from('appointments').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', id);
  if (error) { setMessage(followupListMessage, 'The follow-up could not be completed.', 'error'); return; }
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
  securityWorkspace.hidden = false;
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
    .select('id, preferred_name, family_name, date_of_birth, status, created_at')
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
}
