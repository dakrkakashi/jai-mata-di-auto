/* ─── Settings Module ─── */
'use strict';

let settingsData = {};

const SETTINGS_FIELDS = [
  'siteName','tagline','description',
  'phone','whatsapp','waNumber2','email','address',
  'instagram','facebook','youtube','twitter','linkedin',
  'gaId','fbPixelId','headerCode','footerCode',
  'robotsTxt','maintenanceMode'
];

async function loadSettings() {
  try {
    settingsData = await API.get('/api/admin/settings');
    populateSettings(settingsData);
  } catch { Toast.error('Failed to load settings'); }
}

function populateSettings(s) {
  SETTINGS_FIELDS.forEach(f => {
    const el = document.getElementById('set-' + f);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!s[f];
    else el.value = s[f] || '';
  });
  const robotsTxt = document.getElementById('set-robotsTxt');
  if (robotsTxt && s.robotsTxt) robotsTxt.value = s.robotsTxt;
}

async function saveSettings() {
  const payload = {};
  SETTINGS_FIELDS.forEach(f => {
    const el = document.getElementById('set-' + f);
    if (!el) return;
    if (el.type === 'checkbox') payload[f] = el.checked;
    else if (el.type === 'number') payload[f] = parseFloat(el.value) || 0;
    else payload[f] = el.value;
  });
  try {
    await API.post('/api/admin/settings', payload);
    settingsData = { ...settingsData, ...payload };
    Toast.success('Settings saved!');
  } catch { Toast.error('Failed to save settings'); }
}

async function saveRobots() {
  const val = document.getElementById('set-robotsTxt')?.value;
  if (val === undefined) return;
  await API.post('/api/admin/settings', { robotsTxt: val });
  Toast.success('robots.txt saved');
}

async function testSMTP() {
  const btn = document.getElementById('btn-test-smtp');
  if (btn) { btn.textContent = '⏳ Testing…'; btn.disabled = true; }
  try {
    const res = await API.post('/api/admin/test-smtp', {});
    if (res?.success) Toast.success('SMTP works! Test email sent.');
    else Toast.error(res?.error || 'SMTP test failed');
  } catch { Toast.error('SMTP test failed'); }
  if (btn) { btn.textContent = '📧 Test SMTP Connection'; btn.disabled = false; }
}

async function changePassword() {
  const np = document.getElementById('new-password')?.value;
  const cp = document.getElementById('confirm-password')?.value;
  if (!np || np.length < 6) { Toast.warning('Password must be at least 6 characters'); return; }
  if (np !== cp) { Toast.error('Passwords do not match'); return; }
  await API.post('/api/admin/settings', { newPassword: np });
  document.getElementById('new-password').value = '';
  document.getElementById('confirm-password').value = '';
  Toast.success('Password updated!');
}

async function downloadBackup() {
  try {
    const blob = await window.api('/api/admin/backup', { responseType: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `jmd-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    Toast.success('Backup downloaded!');
  } catch { Toast.error('Backup failed'); }
}

async function deleteAllData() {
  if (prompt('Type DELETE to confirm permanently deleting all leads:') !== 'DELETE') return;
  await API.post('/api/admin/leads/bulk', { ids: [], action: 'deleteAll' }).catch(() => {});
  Toast.success('Data cleared');
}

function showSettingsSection(id, el) {
  document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.settings-nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('section-' + id)?.classList.add('active');
  el?.classList.add('active');
}
