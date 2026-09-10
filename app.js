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

let authorisedClients = [];
let selectedClient = null;
let selectedNoteId = null;
let savedNotes = [];

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
  clientDetail.hidden = true;
  noteEditor.hidden = true;
}

async function showClientsWorkspace() {
  dashboardSections.forEach((section) => { section.hidden = true; });
  clientsWorkspace.hidden = false;
  clientsWorkspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
  await loadClients();
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
}
