const statusPanel = document.querySelector('#status');

const moduleMessages = {
  clients: ['Clients', 'Phase One will connect secure client search, creation and authorised access here.'],
  notes: ['Session Notes', 'This room will hold structured DARP and SOAP notes linked to an authorised client.'],
  whare: ['Te Whare Tapa Whā', 'The interactive whare is preserved as a core AWHI feature, but it follows the secure clinical foundation.'],
  reports: ['Reports', 'Report generation is deliberately deferred until saved clinical information and permissions are reliable.'],
  manaaki: ['Manaaki', 'Manaaki AI comes later. No sensitive clinical information should be sent to an AI workflow until governance and privacy controls are defined.'],
  settings: ['Settings', 'Authentication, practitioner profile and security controls will live here.']
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
