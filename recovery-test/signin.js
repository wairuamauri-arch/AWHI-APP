import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm';
const client = createClient('https://zkdrqrjwzvyxewzyzqid.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprZHJxcmp3enZ5eGV3enl6cWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NTQ4NTMsImV4cCI6MjEwNTEzMDg1M30.ly0kOJw20utWDIELK_OvG41Ilg-7OmHP4GSfhtOmiUE', {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'awhi-recovery-test' }
});
const el = id => document.getElementById(id);
let factorId = null;
let busy = false;
async function run(action) {
  if (busy) return;
  busy = true;
  ['signin','verify','signout'].forEach(id => el(id).disabled = true);
  try { await action(); }
  catch { el('status').textContent = 'The test could not finish. Sign out and try again.'; }
  finally { busy = false; ['signin','verify','signout'].forEach(id => el(id).disabled = false); }
}
async function checkAccess() {
  const { data, error } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data?.currentLevel) throw new Error('Assurance unavailable');
  el('signout').hidden = false;
  el('login').hidden = true;
  if (data.nextLevel === 'aal2' && data.currentLevel !== 'aal2') {
    const factors = await client.auth.mfa.listFactors();
    factorId = factors.data?.totp?.find(f => f.status === 'verified')?.id;
    if (factors.error || !factorId) throw new Error('Authenticator unavailable');
    el('mfa').hidden = false;
    el('status').textContent = 'Password accepted. Enter your recovery account’s authenticator code.';
    return;
  }
  el('mfa').hidden = true;
  const tables = ['practitioners','clients','case_notes','appointments'];
  const results = await Promise.all(tables.map(table => client.from(table).select('id', { count: 'exact', head: true })));
  if (results.some(result => result.error) || results[0].count !== 1) {
    el('status').textContent = 'Sign-in accepted, but restored-record access did not pass. Tell Manaaki this message.';
    return;
  }
  el('status').textContent = 'PASS — recovery sign-in and record access.\n' +
    (data.currentLevel === 'aal2' ? 'Authenticator verified.' : 'Password-only session; MFA has not been verified in this session.') +
    '\nPractitioner profile: ' + results[0].count + '\nClients: ' + results[1].count +
    '\nNotes: ' + results[2].count + '\nAppointments: ' + results[3].count +
    '\nThis result does not certify the full recovery exercise.';
}
el('login').addEventListener('submit', event => {
  event.preventDefault();
  run(async () => {
    el('status').textContent = 'Checking recovery sign-in…';
    const email = el('email').value.trim();
    const password = el('password').value;
    const { error } = await client.auth.signInWithPassword({ email, password });
    el('password').value = '';
    if (error) { el('status').textContent = 'Sign-in was not accepted. Check the practitioner email and password used at the backup date.'; return; }
    el('signout').hidden = false;
    await checkAccess();
  });
});
el('mfa').addEventListener('submit', event => {
  event.preventDefault();
  run(async () => {
    const { error } = await client.auth.mfa.challengeAndVerify({ factorId, code: el('code').value.trim() });
    el('code').value = '';
    if (error) { el('status').textContent = 'Code not accepted. Wait for a new code and try again.'; return; }
    await checkAccess();
  });
});
el('signout').addEventListener('click', () => run(async () => {
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) throw error;
  factorId = null;
  el('login').reset(); el('mfa').reset();
  el('login').hidden = false; el('mfa').hidden = true; el('signout').hidden = true;
  el('status').textContent = 'Signed out of the recovery test.';
}));
el('signin').disabled = false;
el('status').textContent = 'Ready to test the recovery copy.';
