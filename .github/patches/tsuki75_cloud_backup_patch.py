from pathlib import Path
import re


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f"missing replacement target: {label}")
    return text.replace(old, new, 1)

# app.js
p = Path('app.js')
s = p.read_text(encoding='utf-8')
s = replace_once(s, 'TSUKI 🌙 — BUILD 7.4', 'TSUKI 🌙 — BUILD 7.5', 'app build header')
s = replace_once(s, 'const APP_VERSION = "7.4.0";', 'const APP_VERSION = "7.5.0";', 'app version')
s = replace_once(s, 'const APP_CACHE_NAME = "tsuki-cache-v7-4";', 'const APP_CACHE_NAME = "tsuki-cache-v7-5";', 'app cache')
notes = '''const RELEASE_NOTES = [
  { icon: "☁️", title: "Optional Cloud Backup", text: "Signed-in users can explicitly enable private Firebase cloud backups without turning Tsuki into live sync." },
  { icon: "🕗", title: "Daily backup due at 8:00 AM", text: "When enabled, Tsuki creates one backup per day at 8:00 AM local device time while the app is available; if it was closed, the backup runs the next time Tsuki opens or resumes after 8:00 AM." },
  { icon: "💾", title: "Back up now + restore preview", text: "Create a manual cloud backup anytime, review the latest seven snapshots, preview a restore, and keep a local recovery snapshot before replacement." },
  { icon: "📷", title: "Local media included", text: "Wallpaper, pregnancy photos and saved pregnancy documents are backed up when available. Unchanged media is de-duplicated so daily snapshots do not repeatedly copy the same file." },
  { icon: "🔐", title: "Private by account", text: "Google and email/password sign-ins use the same Firebase UID-scoped backup system. Signing in alone still uploads nothing; Cloud Backup requires explicit consent." },
  { icon: "🫧", title: "Local-first fallback", text: "If Firestore, Firebase or the internet is unavailable, Tsuki keeps working locally and retries a due backup later instead of blocking the app." }
];'''
s, count = re.subn(r'const RELEASE_NOTES = \[\n.*?\n\];', notes, s, count=1, flags=re.S)
if count != 1:
    raise SystemExit('release notes replacement failed')
s = s.replace('Your entries stay on this device unless you export a backup yourself.', 'Your entries stay on this device unless you explicitly enable Cloud Backup or export a backup yourself.')
s = s.replace('Export backups from Me, personalize your theme, use optional App Lock, and watch for the update banner when a newer Tsuki build is ready.', 'Use local export or optional signed-in Cloud Backup from Me, personalize your theme, use optional App Lock, and watch for the update banner when a newer Tsuki build is ready.')
s = s.replace('No diagnostic data is uploaded.', 'Diagnostics do not upload data by themselves; optional Cloud Backup is controlled separately from Account.')
p.write_text(s, encoding='utf-8')

# index.html
p = Path('index.html')
s = p.read_text(encoding='utf-8')
s = s.replace('Tsuki 7.4.0', 'Tsuki 7.5.0')
s = replace_once(s, '<div><small>Health data sync</small><strong>Off · local only</strong></div>', '<div><small>Cloud backup</small><strong id="firebaseCloudBackupFact">Off</strong></div>', 'account fact')
anchor = '<p id="firebaseSignedInNote" class="muted small-text">Your sign-in can persist on this browser. Signing out does not erase any local Tsuki entries.</p>'
panel = '''<section id="firebaseCloudBackupPanel" class="firebase-cloud-backup-panel hidden" aria-label="Cloud Backup">
          <div class="cloud-backup-heading">
            <div><p class="eyebrow">CLOUD BACKUP</p><h3>Keep your Tsuki safe</h3></div>
            <span id="cloudBackupStatusPill" class="cloud-backup-status">Off</span>
          </div>
          <p class="muted small-text">Cloud Backup is optional and separate from live sync. Signing in alone never uploads your tracker. When you enable it, backups are stored under your Firebase account.</p>
          <label class="cloud-backup-toggle-row">
            <span><strong>Daily automatic backup</strong><small>One backup per day, due at 8:00 AM</small></span>
            <input type="checkbox" id="cloudBackupEnabled" aria-label="Enable daily cloud backup at 8 AM">
          </label>
          <div class="cloud-backup-schedule">
            <span aria-hidden="true">🕗</span>
            <div><strong>8:00 AM daily</strong><small id="cloudBackupScheduleNote">Turn this on to create one backup per day, due at 8:00 AM local device time.</small></div>
          </div>
          <button type="button" id="cloudBackupNow" class="primary-button full-width">Back up now</button>
          <label class="cloud-backup-history-label" for="cloudBackupHistorySelect">Backup history</label>
          <select id="cloudBackupHistorySelect" class="cloud-backup-history-select"><option value="">No cloud backups yet</option></select>
          <button type="button" id="cloudRestorePreviewButton" class="secondary-button full-width" disabled>Preview selected restore</button>
          <div id="cloudRestorePreview" class="cloud-restore-preview hidden">
            <div id="cloudRestorePreviewContent"></div>
            <div class="cloud-restore-actions">
              <button type="button" id="cloudRestoreCancel" class="secondary-button">Cancel</button>
              <button type="button" id="cloudRestoreConfirm" class="primary-button">Restore safely</button>
            </div>
          </div>
          <p id="cloudBackupLastText" class="muted small-text">No cloud backup has been created yet.</p>
          <p class="cloud-backup-privacy-note">🔐 Protected by Firebase Authentication and private per-user Firestore rules. Cloud backups are not end-to-end encrypted. Tsuki keeps the latest 7 snapshots. Individual local media files over 25 MB remain on the device.</p>
          <div id="cloudBackupMessage" class="firebase-auth-message hidden"></div>
          <button type="button" id="cloudDeleteBackups" class="cloud-delete-backups" disabled>Delete cloud backups</button>
        </section>
        ''' + anchor
s = replace_once(s, anchor, panel, 'cloud backup panel insertion')
s = replace_once(s, '<script type="module" src="./firebase-tsuki.js"></script>', '<script type="module" src="./firebase-tsuki.js"></script>\n<script type="module" src="./firebase-backup.js"></script>', 'backup module script')
p.write_text(s, encoding='utf-8')

# firebase-tsuki.js
p = Path('firebase-tsuki.js')
s = p.read_text(encoding='utf-8')
s = s.replace('TSUKI 7.4 — OPTIONAL FIREBASE AUTHENTICATION', 'TSUKI 7.5 — OPTIONAL FIREBASE AUTHENTICATION')
s = s.replace('Identity only. Health data remains local in this release.', 'Identity stays separate from optional Tsuki Cloud Backup.')
s = replace_once(s, '  auth: null,\n  modules: null,', '  app: null,\n  auth: null,\n  modules: null,', 'auth app state')
s = replace_once(s, '    authState.auth = auth;\n    authState.modules = authModule;', '    authState.app = firebaseApp;\n    authState.auth = auth;\n    authState.modules = authModule;', 'auth app assignment')
s = s.replace('`${user.email || "Signed in"} · Your health entries are still stored locally on this device.`', '`${user.email || "Signed in"} · Your tracker stays local unless you explicitly enable Cloud Backup below.`')
s = s.replace('"Sign in if you want an account identity. Your cycle, pregnancy, journal and other health entries stay on this device in this release."', '"Sign in if you want an account identity. Your tracker stays local unless you explicitly enable Cloud Backup after signing in."')
s = replace_once(s, 'window.TsukiAuth = {\n  get sdkReady()', 'window.TsukiAuth = {\n  get app() { return authState.app; },\n  get sdkReady()', 'auth app getter')
p.write_text(s, encoding='utf-8')

# service-worker.js
p = Path('service-worker.js')
s = p.read_text(encoding='utf-8')
s = s.replace('TSUKI SERVICE WORKER — BUILD 7.4', 'TSUKI SERVICE WORKER — BUILD 7.5')
s = replace_once(s, 'const CACHE_NAME = "tsuki-cache-v7-4";', 'const CACHE_NAME = "tsuki-cache-v7-5";', 'sw cache')
s = replace_once(s, '  "./firebase-tsuki.js",\n  "./manifest.json",', '  "./firebase-tsuki.js",\n  "./firebase-backup.js",\n  "./manifest.json",', 'sw backup shell')
p.write_text(s, encoding='utf-8')

# style.css
p = Path('style.css')
s = p.read_text(encoding='utf-8')
marker = '/* TSUKI 7.5 — FIREBASE CLOUD BACKUP */'
if marker not in s:
    s += r'''

/* TSUKI 7.5 — FIREBASE CLOUD BACKUP */
.firebase-cloud-backup-panel {
  margin: 16px 0;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: linear-gradient(145deg, rgba(255,255,255,.94), rgba(244,239,251,.78));
  box-shadow: var(--shadow-soft);
}
.cloud-backup-heading,
.cloud-backup-toggle-row,
.cloud-backup-schedule,
.cloud-restore-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cloud-backup-heading { justify-content: space-between; margin-bottom: 8px; }
.cloud-backup-heading h3 { margin: 2px 0 0; }
.cloud-backup-status {
  flex: 0 0 auto;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--pink-100);
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
}
.cloud-backup-status.active { background: var(--green); color: var(--text); }
.cloud-backup-toggle-row {
  justify-content: space-between;
  margin: 14px 0 10px;
  padding: 12px 13px;
  border-radius: var(--radius-md);
  background: rgba(255,255,255,.72);
}
.cloud-backup-toggle-row span { display: grid; gap: 3px; }
.cloud-backup-toggle-row small,
.cloud-backup-schedule small { color: var(--muted); line-height: 1.35; }
.cloud-backup-toggle-row input { width: 22px; height: 22px; accent-color: var(--pink-500); flex: 0 0 auto; }
.cloud-backup-schedule {
  align-items: flex-start;
  margin-bottom: 12px;
  padding: 11px 12px;
  border-radius: var(--radius-md);
  background: var(--lavender-100);
}
.cloud-backup-schedule > span { font-size: 20px; }
.cloud-backup-schedule div { display: grid; gap: 2px; }
.cloud-backup-history-label {
  display: block;
  margin: 13px 0 6px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}
.cloud-backup-history-select {
  width: 100%;
  min-height: 44px;
  margin-bottom: 10px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgba(255,255,255,.9);
  color: var(--text);
}
.cloud-restore-preview {
  margin: 11px 0;
  padding: 13px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--pink-50);
}
.cloud-restore-preview p:first-child { margin-top: 0; }
.cloud-restore-counts { margin: 10px 0; }
.cloud-restore-actions { justify-content: flex-end; margin-top: 12px; }
.cloud-restore-actions button { flex: 1; }
.cloud-backup-privacy-note {
  margin: 10px 0;
  padding: 10px 11px;
  border-radius: var(--radius-sm);
  background: rgba(255,240,199,.42);
  color: var(--muted);
  font-size: 11px;
  line-height: 1.45;
}
.cloud-delete-backups {
  width: 100%;
  min-height: 42px;
  margin-top: 7px;
  border: 0;
  background: transparent;
  color: var(--danger);
  font-weight: 800;
}
.cloud-delete-backups:disabled { opacity: .45; }
@media (max-width: 390px) {
  .firebase-cloud-backup-panel { padding: 14px; }
  .cloud-backup-heading { align-items: flex-start; }
  .cloud-restore-actions { flex-direction: column-reverse; }
  .cloud-restore-actions button { width: 100%; }
}
'''
p.write_text(s, encoding='utf-8')

print('Tsuki 7.5 cloud backup patch applied')
