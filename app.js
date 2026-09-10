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

let authorisedClients = [];

function renderSession(session) {
  const signedIn = Boolean(session?.user);
  authView.hidden = signedIn;
  appView.hidden = !signedIn;
  signedInUser.textContent = signedIn ? session.user.email ?? 'Practitioner' : '';
  if (!signedIn) loginForm.reset();
  if (!signedIn) {
    authorisedClients = [];
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

function openClient(client) {
  clientDetailTitle.textContent = formatClientName(client);
  detailDateOfBirth.textContent = client.date_of_birth
    ? new Intl.DateTimeFormat('en-NZ', { dateStyle: 'long' }).format(new Date(`${client.date_of_birth}T00:00:00`))
    : 'Not recorded';
  detailStatus.textContent = client.status;
  detailCreatedAt.textContent = new Intl.DateTimeFormat('en-NZ', { dateStyle: 'medium' }).format(new Date(client.created_at));
  clientDetail.hidden = false;
  clientDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
}
