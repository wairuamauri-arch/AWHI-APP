const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
function harness({ currentLevel = 'aal1', nextLevel = 'aal2', invalidCode = false, sessionError = false, missingSession = false, throws = false } = {}) {
  const element = () => ({ hidden: false, disabled: false, textContent: '', value: '123456', reset() {}, focus() {} });
  const state = { currentLevel, nextLevel };
  const session = { user: { email: 'test@example.invalid' } };
  const context = { state, session, console };
  for (const name of ['authView', 'appView', 'loginForm', 'recoveryForm', 'signedInUser', 'authMessage', 'recoveryMessage', 'mfaChallengeCode', 'mfaChallengeMessage', 'mfaChallengeButton']) context[name] = element();
  context.mfaChallengeForm = { ...element(), addEventListener(event, callback) { context.submit = callback; } };
  context.supabase = { auth: {
    getSession: async () => ({ data: { session: missingSession ? null : session }, error: sessionError ? new Error('session unavailable') : null }),
    signOut: async () => {},
    mfa: {
      getAuthenticatorAssuranceLevel: async () => ({ data: { ...state }, error: null }),
      listFactors: async () => ({ data: { totp: [{ id: 'test-factor', status: 'verified' }] }, error: null }),
      challengeAndVerify: async () => {
        if (throws) throw new Error('network failure');
        if (invalidCode) return { data: null, error: new Error('invalid code') };
        state.currentLevel = 'aal2';
        return { data: { ...session, access_token: 'synthetic-test-only' }, error: null };
      }
    }
  }};
  vm.createContext(context);
  const functions = source.slice(source.indexOf('function renderSession('), source.indexOf('\nfunction showRecoveryForm('));
  const showLogin = source.slice(source.indexOf('function showLoginForm('), source.indexOf('\n}', source.indexOf('function showLoginForm(')) + 2);
  const handler = source.slice(source.indexOf("mfaChallengeForm.addEventListener('submit'"), source.indexOf('\nmfaSignoutButton.addEventListener'));
  vm.runInContext('let passwordRecoveryMode=false,mfaChallengeFactorId=null,authorisedClients=[],selectedClient=null,savedNotes=[]; function loadDashboardSummary(){} function showDashboard(){}\n' + functions + '\n' + showLogin + '\n' + handler, context);
  return context;
}
test('account without verified MFA opens at AAL1', async () => {
  const h = harness({ nextLevel: 'aal1' }); await h.checkMfaAndRender(h.session);
  assert.equal(h.appView.hidden, false); assert.equal(h.mfaChallengeForm.hidden, true);
});
test('enrolled account requires challenge at AAL1', async () => {
  const h = harness(); await h.checkMfaAndRender(h.session);
  assert.equal(h.appView.hidden, true); assert.equal(h.mfaChallengeForm.hidden, false);
});
test('incorrect code remains blocked and allows retry', async () => {
  const h = harness({ invalidCode: true }); await h.checkMfaAndRender(h.session); await h.submit({ preventDefault() {} });
  assert.equal(h.appView.hidden, true); assert.equal(h.mfaChallengeForm.hidden, false); assert.equal(h.mfaChallengeButton.disabled, false);
});
test('valid flat MFA response opens saved session without depending on auth callback', async () => {
  const h = harness(); await h.checkMfaAndRender(h.session); await h.submit({ preventDefault() {} });
  assert.equal(h.appView.hidden, false); assert.equal(h.authView.hidden, true); assert.equal(h.mfaChallengeForm.hidden, true);
});
for (const scenario of ['sessionError', 'missingSession']) test(scenario + ' returns usable sign-in form', async () => {
  const h = harness({ [scenario]: true }); await h.checkMfaAndRender(h.session); await h.submit({ preventDefault() {} });
  assert.equal(h.appView.hidden, true); assert.equal(h.loginForm.hidden, false); assert.equal(h.mfaChallengeForm.hidden, true); assert.match(h.authMessage.textContent, /sign in again/);
});
test('thrown request failure leaves retry enabled', async () => {
  const h = harness({ throws: true }); await h.checkMfaAndRender(h.session); await h.submit({ preventDefault() {} });
  assert.equal(h.appView.hidden, true); assert.equal(h.mfaChallengeButton.disabled, false); assert.match(h.mfaChallengeMessage.textContent, /try again/);
});
test('restored AAL2 session opens after refresh', async () => {
  const h = harness({ currentLevel: 'aal2' }); await h.checkMfaAndRender(h.session); assert.equal(h.appView.hidden, false);
});
test('sign-out after MFA restores login and subsequent sign-in challenges again', async () => {
  const h = harness(); await h.checkMfaAndRender(h.session); await h.submit({ preventDefault() {} }); await h.checkMfaAndRender(null);
  assert.equal(h.appView.hidden, true); assert.equal(h.loginForm.hidden, false);
  h.state.currentLevel = 'aal1'; await h.checkMfaAndRender(h.session); assert.equal(h.mfaChallengeForm.hidden, false); assert.equal(h.appView.hidden, true);
});
