from pathlib import Path

# Current production shell (Smart Reminders 2.0 baseline)
app=Path('app.js'); text=app.read_text()
text=text.replace('tsuki-cache-v1-pre-smart-reminders-11','tsuki-cache-v1-pre-cloud-backup-12')
needle='const RELEASE_NOTES = [\n'
entry='  { icon: "☁️", title: "Optional Cloud Backup", text: "Signed-in users can explicitly opt in to Firebase backup with latest-seven history, restore preview and cloud deletion. Signing in alone never uploads health data." },\n'
if entry not in text: text=text.replace(needle, needle+entry, 1)
app.write_text(text)

# Firebase auth exposes the initialized app to the separate backup module.
auth=Path('firebase-tsuki.js'); text=auth.read_text()
text=text.replace('const authState = {\n  auth: null,','const authState = {\n  app: null,\n  auth: null,',1)
text=text.replace('    authState.auth = auth;','    authState.app = firebaseApp;\n    authState.auth = auth;',1)
text=text.replace('window.TsukiAuth = {\n  get sdkReady()', 'window.TsukiAuth = {\n  get app() { return authState.app; },\n  get sdkReady()',1)
text=text.replace('Your health entries are still stored locally on this device.','Your tracker stays local unless you explicitly enable Cloud Backup below.')
text=text.replace('Sign in if you want an account identity. Your cycle, pregnancy, journal and other health entries stay on this device in this release.','Sign in if you want an account identity. Your tracker stays local unless you explicitly enable Cloud Backup after signing in.')
auth.write_text(text)

# Rebuild old backup module for current v1 data model and actual IndexedDB helpers.
cloud=Path('firebase-backup.js'); text=cloud.read_text()
text=text.replace('TSUKI 7.5 — OPTIONAL FIREBASE CLOUD BACKUP','TSUKI V1 — OPTIONAL FIREBASE CLOUD BACKUP')
text=text.replace('const TSUKI_BACKUP_APP_VERSION = "7.5.0";','const TSUKI_BACKUP_APP_VERSION = "1.0.0";')
text=text.replace('const BACKUP_CONSENT_VERSION = 1;','const BACKUP_CONSENT_VERSION = 2;')
text=text.replace('typeof window.appearanceAssetGet !== "function"','typeof appearanceAssetGet !== "function"')
text=text.replace('window.appearanceAssetGet(key)','appearanceAssetGet(key)')
text=text.replace('typeof window.appearanceAssetPut !== "function"','typeof appearanceAssetPut !== "function"')
text=text.replace('window.appearanceAssetPut(meta.key, blob)','appearanceAssetPut(meta.key, blob)')
text=text.replace('typeof window.appearanceAssetPut === "function"','typeof appearanceAssetPut === "function"')
text=text.replace('await window.appearanceAssetPut(TSUKI_RECOVERY_KEY, currentRaw).catch(() => {});','await appearanceAssetPut(TSUKI_RECOVERY_KEY, currentRaw);')
old='Cloud Backup contains private cycle, pregnancy, wellness, journal and locally saved media data. It is protected by your Firebase account and private Security Rules, but it is not end-to-end encrypted. Enable cloud backup?'
new='Cloud Backup may contain highly private period, sexual-activity, fertility-sign, contraception, pregnancy, postpartum, feeding/pumping, baby, medication, concern, journal and locally saved media data. It is protected by your Firebase account and UID-scoped Firestore Security Rules, but it is not end-to-end encrypted. Signing in alone uploads nothing. Enable Cloud Backup?'
text=text.replace(old,new)
text=text.replace('    pregnancyJournal: Array.isArray(data?.pregnancy?.journal) ? data.pregnancy.journal.length : 0\n  };','    pregnancyJournal: Array.isArray(data?.pregnancy?.journal) ? data.pregnancy.journal.length : 0,\n    postpartumFeeds: Array.isArray(data?.postpartum?.feedingLogs) ? data.postpartum.feedingLogs.length : 0,\n    personalHealthEntries: ["fertilitySigns","healthContexts","contraceptionHistory","concerns"].reduce((sum,key)=>sum+(Array.isArray(data?.personalHealth?.[key])?data.personalHealth[key].length:0),0)\n  };')
text=text.replace('    if (currentRaw && typeof appearanceAssetPut === "function") {\n      await appearanceAssetPut(TSUKI_RECOVERY_KEY, currentRaw);\n    }','    if (currentRaw) {\n      if (typeof appearanceAssetPut !== "function") throw new Error("Local recovery storage is unavailable, so restore was cancelled before changing your data.");\n      await appearanceAssetPut(TSUKI_RECOVERY_KEY, currentRaw);\n    }')
cloud.write_text(text)

# Add signed-in Cloud Backup panel to current auth modal.
index=Path('index.html'); text=index.read_text()
text=text.replace('<article class="firebase-auth-privacy-note">\n        <span>🌙</span><div><strong>Your health data stays local</strong><p>Signing in creates an account identity in Firebase Authentication. This release does not upload your cycle, pregnancy, Between Moons, journal, photo or other health entries.</p></div>\n      </article>', '<article class="firebase-auth-privacy-note">\n        <span>🌙</span><div><strong>Your tracker is local by default</strong><p>Signing in creates an account identity only. Health data is uploaded only if you separately enable Cloud Backup after signing in.</p></div>\n      </article>')
old='''        <div class="firebase-account-facts">\n          <div><small>Email status</small><strong id="firebaseEmailStatus">—</strong></div>\n          <div><small>Health data sync</small><strong>Off · local only</strong></div>\n        </div>'''
panel='''        <div class="firebase-account-facts">\n          <div><small>Email status</small><strong id="firebaseEmailStatus">—</strong></div>\n          <div><small>Cloud backup</small><strong id="firebaseCloudBackupFact">Off</strong></div>\n        </div>\n        <section id="firebaseCloudBackupPanel" class="firebase-cloud-backup-panel hidden" aria-label="Cloud Backup">\n          <div class="cloud-backup-heading"><div><p class="eyebrow">CLOUD BACKUP</p><h3>Keep your Tsuki safe</h3></div><span id="cloudBackupStatusPill" class="cloud-backup-status">Off</span></div>\n          <p class="muted small-text">Optional backup, not live sync. Signing in alone never uploads your tracker. Enabling backup requires separate consent.</p>\n          <label class="cloud-backup-toggle-row"><span><strong>Daily automatic backup</strong><small>Due once per day at 8:00 AM while Tsuki can run</small></span><input type="checkbox" id="cloudBackupEnabled" aria-label="Enable daily cloud backup"></label>\n          <div class="cloud-backup-schedule"><span>🕗</span><div><strong>8:00 AM daily</strong><small id="cloudBackupScheduleNote">If Tsuki was closed, a due backup runs when the app next opens or resumes after 8:00 AM.</small></div></div>\n          <button type="button" id="cloudBackupNow" class="primary-button full-width">Back up now</button>\n          <label class="cloud-backup-history-label" for="cloudBackupHistorySelect">Backup history</label><select id="cloudBackupHistorySelect" class="cloud-backup-history-select"><option value="">No cloud backups yet</option></select>\n          <button type="button" id="cloudRestorePreviewButton" class="secondary-button full-width" disabled>Preview selected restore</button>\n          <div id="cloudRestorePreview" class="cloud-restore-preview hidden"><div id="cloudRestorePreviewContent"></div><div class="cloud-restore-actions"><button type="button" id="cloudRestoreCancel" class="secondary-button">Cancel</button><button type="button" id="cloudRestoreConfirm" class="primary-button">Restore safely</button></div></div>\n          <p id="cloudBackupLastText" class="muted small-text">No cloud backup has been created yet.</p>\n          <p class="cloud-backup-privacy-note">🔐 Firebase Authentication + UID-scoped Firestore rules. Not end-to-end encrypted. Latest 7 snapshots are retained. Individual local media over 25 MB stays on this device.</p>\n          <div id="cloudBackupMessage" class="firebase-auth-message hidden"></div><button type="button" id="cloudDeleteBackups" class="cloud-delete-backups" disabled>Delete cloud backups</button>\n        </section>'''
if 'id="firebaseCloudBackupPanel"' not in text: text=text.replace(old,panel,1)
line='<script type="module" src="./firebase-backup.js"></script>\n'
needle='<script type="module" src="./firebase-tsuki.js"></script>\n'
if line not in text: text=text.replace(needle,needle+line,1)
index.write_text(text)

style=Path('style.css'); text=style.read_text()
marker='/* TSUKI V1 — FIREBASE CLOUD BACKUP */'
if marker not in text:
    text += '''\n\n/* TSUKI V1 — FIREBASE CLOUD BACKUP */\n.firebase-cloud-backup-panel{margin:16px 0;padding:16px;border:1px solid var(--line);border-radius:var(--radius-lg);background:rgba(255,255,255,.88);box-shadow:var(--shadow-soft)}\n.cloud-backup-heading,.cloud-backup-toggle-row,.cloud-backup-schedule,.cloud-restore-actions{display:flex;align-items:center;gap:12px}.cloud-backup-heading{justify-content:space-between;margin-bottom:8px}.cloud-backup-status{padding:6px 10px;border-radius:999px;background:var(--pink-100);font-size:11px;font-weight:800}.cloud-backup-status.active{background:var(--green)}\n.cloud-backup-toggle-row{justify-content:space-between;margin:14px 0 10px;padding:12px;border-radius:var(--radius-md);background:rgba(255,255,255,.72)}.cloud-backup-toggle-row span,.cloud-backup-schedule div{display:grid;gap:3px}.cloud-backup-toggle-row input{width:22px;height:22px;accent-color:var(--pink-500)}.cloud-backup-schedule{align-items:flex-start;margin-bottom:12px;padding:11px 12px;border-radius:var(--radius-md);background:var(--lavender-100)}\n.cloud-backup-history-label{display:block;margin:13px 0 6px;font-size:12px;font-weight:800}.cloud-backup-history-select{width:100%;min-height:44px;margin-bottom:10px;padding:0 12px;border:1px solid var(--line);border-radius:var(--radius-sm);background:#fff}.cloud-restore-preview{margin:11px 0;padding:13px;border:1px solid var(--line);border-radius:var(--radius-md);background:var(--pink-50)}.cloud-restore-actions{justify-content:flex-end;margin-top:12px}.cloud-restore-actions button{flex:1}.cloud-backup-privacy-note{margin:10px 0;padding:10px 11px;border-radius:var(--radius-sm);background:rgba(255,240,199,.42);font-size:11px;line-height:1.45}.cloud-delete-backups{width:100%;min-height:42px;border:0;background:transparent;color:var(--danger);font-weight:800}.cloud-delete-backups:disabled{opacity:.45}@media(max-width:390px){.firebase-cloud-backup-panel{padding:14px}.cloud-restore-actions{flex-direction:column-reverse}.cloud-restore-actions button{width:100%}}\n'''
style.write_text(text)

sw=Path('service-worker.js'); text=sw.read_text().replace('tsuki-cache-v1-pre-smart-reminders-11','tsuki-cache-v1-pre-cloud-backup-12')
needle='  "./release-readiness.js",\n'; line='  "./firebase-backup.js",\n'
if text.count(line)<2: text=text.replace(needle,needle+line)
sw.write_text(text)
