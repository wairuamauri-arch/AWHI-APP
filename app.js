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

function renderSession(session) {
  const signedIn = Boolean(session?.user);
  authView.hidden = signedIn;
  appView.hidden = !signedIn;
  signedInUser.textContent = signedIn ? session.user.email ?? 'Practitioner' : '';
  if (!signedIn) loginForm.reset();
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
  button.addEventListener('click', () => {
    const [title, body] = moduleMessages[button.dataset.module];
    statusPanel.innerHTML = `<p class="eyebrow">Selected room</p><h2>${title}</h2><p>${body}</p>`;
    statusPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
}
