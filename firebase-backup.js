/* ============================================================
   TSUKI V1 — OPTIONAL FIREBASE CLOUD BACKUP
   Backup, not live sync. Requires explicit user opt-in.
   ============================================================ */

const TSUKI_BACKUP_SDK_VERSION = "12.16.0";
const TSUKI_BACKUP_APP_VERSION = "1.0.0";
const TSUKI_DATA_KEY = "tsuki-data-v4";
const TSUKI_RECOVERY_KEY = "tsuki-last-good-data-v1";
const BACKUP_SETTINGS_PREFIX = "tsuki-cloud-backup-v1:";
const BACKUP_CONSENT_VERSION = 2;
const BACKUP_HOUR = 8;
const RETAINED_SNAPSHOTS = 7;
const FIRESTORE_CHUNK_BYTES = 550000;
const MAX_ASSET_BYTES = 25 * 1024 * 1024;

const cloudState = {
  uid: "",
  db: null,
  fs: null,
  busy: false,
  serviceError: "",
  snapshots: [],
  pendingRestoreId: "",
  timer: null,
  retryAfter: 0
};

const $ = id => document.getElementById(id);
const cloudUser = () => window.TsukiAuth?.user || null;

function localDayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function afterBackupHour(date = new Date()) {
  return date.getHours() >= BACKUP_HOUR;
}

function nextBackupTime(now = new Date()) {
  const next = new Date(now);
  next.setHours(BACKUP_HOUR, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

function settingsKey(uid) {
  return `${BACKUP_SETTINGS_PREFIX}${uid}`;
}

function loadBackupSettings(uid) {
  const fallback = {
    enabled: false,
    consentVersion: 0,
    lastAutoDate: "",
    lastSuccessAt: ""
  };
  if (!uid) return fallback;
  try {
    const parsed = JSON.parse(localStorage.getItem(settingsKey(uid)) || "null");
    return { ...fallback, ...(parsed || {}) };
  } catch (_) {
    return fallback;
  }
}

function saveBackupSettings(uid, settings) {
  if (!uid) return;
  try { localStorage.setItem(settingsKey(uid), JSON.stringify(settings)); } catch (_) {}
}

function currentSettings() {
  return loadBackupSettings(cloudState.uid || cloudUser()?.uid || "");
}

function friendlyCloudError(error) {
  const code = String(error?.code || "");
  if (code.includes("permission-denied")) return "Cloud Backup needs Tsuki’s private Firestore backup rules enabled for this Firebase project.";
  if (code.includes("failed-precondition")) return "Cloud Backup needs a Cloud Firestore database enabled in Firebase first.";
  if (code.includes("unavailable") || code.includes("network")) return "Cloud Backup can’t reach Firebase right now. Your local Tsuki data is safe.";
  if (code.includes("resource-exhausted")) return "Firebase’s storage or request limit was reached. Your local Tsuki data is still safe.";
  return error?.message ? `Cloud Backup couldn’t finish: ${error.message}` : "Cloud Backup couldn’t finish. Your local Tsuki data is still safe.";
}

function setCloudMessage(text = "", kind = "") {
  const el = $("cloudBackupMessage");
  if (!el) return;
  el.textContent = text;
  el.className = `firebase-auth-message${kind ? ` ${kind}` : ""}${text ? "" : " hidden"}`;
}

function setBusy(busy) {
  cloudState.busy = Boolean(busy);
  ["cloudBackupNow", "cloudRestorePreviewButton", "cloudRestoreConfirm", "cloudDeleteBackups", "cloudBackupEnabled"].forEach(id => {
    const el = $(id);
    if (el) el.disabled = cloudState.busy;
  });
  renderCloudBackupUI();
}

function formatBackupStamp(ms) {
  if (!ms) return "—";
  try { return new Date(ms).toLocaleString(); } catch (_) { return "—"; }
}

function renderHistoryOptions() {
  const select = $("cloudBackupHistorySelect");
  if (!select) return;
  const selected = select.value;
  select.innerHTML = cloudState.snapshots.length
    ? cloudState.snapshots.map(item => `<option value="${item.id}">${item.kind === "auto" ? "Daily" : "Manual"} · ${formatBackupStamp(item.createdAtMillis)}</option>`).join("")
    : '<option value="">No cloud backups yet</option>';
  if (selected && cloudState.snapshots.some(item => item.id === selected)) select.value = selected;
}

function renderCloudBackupUI() {
  const user = cloudUser();
  const panel = $("firebaseCloudBackupPanel");
  if (!panel) return;
  panel.classList.toggle("hidden", !user);
  if (!user) return;

  const settings = currentSettings();
  const enabled = Boolean(settings.enabled);
  const toggle = $("cloudBackupEnabled");
  if (toggle) toggle.checked = enabled;

  const pill = $("cloudBackupStatusPill");
  if (pill) {
    pill.textContent = cloudState.busy ? "Backing up…" : cloudState.serviceError ? "Needs setup" : enabled ? "Daily · 8 AM" : "Off";
    pill.classList.toggle("active", enabled && !cloudState.serviceError);
  }

  const fact = $("firebaseCloudBackupFact");
  if (fact) fact.textContent = enabled ? "On · 8 AM" : "Off";

  const latest = cloudState.snapshots[0];
  const last = $("cloudBackupLastText");
  if (last) {
    last.textContent = latest
      ? `Latest cloud backup: ${formatBackupStamp(latest.createdAtMillis)}${latest.mediaMissing ? ` · ${latest.mediaMissing} local file${latest.mediaMissing === 1 ? "" : "s"} not included` : " · complete"}`
      : settings.lastSuccessAt
        ? `Last successful backup on this device: ${formatBackupStamp(Date.parse(settings.lastSuccessAt))}`
        : "No cloud backup has been created yet.";
  }

  const note = $("cloudBackupScheduleNote");
  if (note) note.textContent = enabled
    ? "Due once each day at 8:00 AM on this device. If Tsuki was closed, the backup runs the next time you open or resume it after 8:00 AM."
    : "Turn this on to create one backup per day, due at 8:00 AM local device time.";

  renderHistoryOptions();
  const restoreButton = $("cloudRestorePreviewButton");
  if (restoreButton) restoreButton.disabled = cloudState.busy || !cloudState.snapshots.length;
  const deleteButton = $("cloudDeleteBackups");
  if (deleteButton) deleteButton.disabled = cloudState.busy || !cloudState.snapshots.length;
}

async function ensureFirestore() {
  if (cloudState.db && cloudState.fs) return;
  const app = window.TsukiAuth?.app;
  if (!app) throw new Error("Firebase account services are still loading.");
  const fs = await import(`https://www.gstatic.com/firebasejs/${TSUKI_BACKUP_SDK_VERSION}/firebase-firestore.js`);
  cloudState.fs = fs;
  cloudState.db = fs.getFirestore(app);
}

function snapshotDoc(uid, snapshotId) {
  return cloudState.fs.doc(cloudState.db, "tsukiCloudBackups", uid, "snapshots", snapshotId);
}
function snapshotChunkDoc(uid, snapshotId, index) {
  return cloudState.fs.doc(cloudState.db, "tsukiCloudBackups", uid, "snapshots", snapshotId, "chunks", String(index).padStart(4, "0"));
}
function assetDoc(uid, assetId) {
  return cloudState.fs.doc(cloudState.db, "tsukiCloudBackups", uid, "assets", assetId);
}
function assetChunkDoc(uid, assetId, index) {
  return cloudState.fs.doc(cloudState.db, "tsukiCloudBackups", uid, "assets", assetId, "chunks", String(index).padStart(4, "0"));
}

function chunkBytes(bytes) {
  const chunks = [];
  for (let offset = 0; offset < bytes.byteLength; offset += FIRESTORE_CHUNK_BYTES) {
    chunks.push(bytes.slice(offset, Math.min(offset + FIRESTORE_CHUNK_BYTES, bytes.byteLength)));
  }
  return chunks.length ? chunks : [new Uint8Array()];
}

async function sha256Hex(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
}

function collectAssetKeys(value) {
  const keys = new Set();
  const seen = new WeakSet();
  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);
    if (typeof node.assetKey === "string" && node.assetKey.trim()) keys.add(node.assetKey);
    if (Array.isArray(node)) node.forEach(walk);
    else Object.values(node).forEach(walk);
  }
  walk(value);
  if (value?.settings?.wallpaperEnabled) keys.add("wallpaper");
  return [...keys];
}

async function readLocalAsset(key) {
  if (typeof appearanceAssetGet !== "function") return null;
  try {
    const value = await appearanceAssetGet(key);
    return value instanceof Blob ? value : null;
  } catch (_) {
    return null;
  }
}

async function uploadAsset(uid, key, blob) {
  const buffer = await blob.arrayBuffer();
  if (buffer.byteLength > MAX_ASSET_BYTES) {
    return { key, backedUp: false, reason: "too-large", size: buffer.byteLength };
  }
  const hash = await sha256Hex(buffer);
  const assetId = await sha256Hex(`${key}\n${hash}`);
  const ref = assetDoc(uid, assetId);
  const existing = await cloudState.fs.getDoc(ref);
  if (existing.exists()) {
    return { key, assetId, backedUp: true, size: buffer.byteLength, type: blob.type || "application/octet-stream" };
  }

  const bytes = new Uint8Array(buffer);
  const chunks = chunkBytes(bytes);
  for (let i = 0; i < chunks.length; i += 1) {
    await cloudState.fs.setDoc(assetChunkDoc(uid, assetId, i), {
      index: i,
      payload: cloudState.fs.Bytes.fromUint8Array(chunks[i])
    });
  }
  await cloudState.fs.setDoc(ref, {
    key,
    hash,
    size: bytes.byteLength,
    type: blob.type || "application/octet-stream",
    name: typeof blob.name === "string" ? blob.name : "",
    lastModified: Number(blob.lastModified || 0),
    chunkCount: chunks.length,
    updatedAtMillis: Date.now()
  });
  return { key, assetId, backedUp: true, size: bytes.byteLength, type: blob.type || "application/octet-stream" };
}

function backupSummary(data) {
  return {
    mode: data?.mode || "cycle",
    periods: Array.isArray(data?.periods) ? data.periods.length : 0,
    cycleLogs: data?.logs && typeof data.logs === "object" ? Object.keys(data.logs).length : 0,
    journal: Array.isArray(data?.journal) ? data.journal.length : 0,
    pregnancyLogs: data?.pregnancy?.logs && typeof data.pregnancy.logs === "object" ? Object.keys(data.pregnancy.logs).length : 0,
    pregnancyAppointments: Array.isArray(data?.pregnancy?.appointments) ? data.pregnancy.appointments.length : 0,
    pregnancyJournal: Array.isArray(data?.pregnancy?.journal) ? data.pregnancy.journal.length : 0,
    postpartumFeeds: Array.isArray(data?.postpartum?.feedingLogs) ? data.postpartum.feedingLogs.length : 0,
    personalHealthEntries: ["fertilitySigns","healthContexts","contraceptionHistory","concerns"].reduce((sum,key)=>sum+(Array.isArray(data?.personalHealth?.[key])?data.personalHealth[key].length:0),0)
  };
}

function makeSnapshotId(kind) {
  const now = new Date();
  const stamp = `${localDayKey(now).replaceAll("-", "")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  return `${stamp}-${kind}-${Math.random().toString(36).slice(2, 8)}`;
}

async function listSnapshots(uid) {
  await ensureFirestore();
  const col = cloudState.fs.collection(cloudState.db, "tsukiCloudBackups", uid, "snapshots");
  const q = cloudState.fs.query(col, cloudState.fs.orderBy("createdAtMillis", "desc"), cloudState.fs.limit(20));
  const snap = await cloudState.fs.getDocs(q);
  return snap.docs
    .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
    .filter(item => item.status === "complete");
}

async function refreshCloudHistory() {
  const user = cloudUser();
  if (!user) return;
  cloudState.uid = user.uid;
  try {
    cloudState.snapshots = await listSnapshots(user.uid);
    cloudState.serviceError = "";
    setCloudMessage();
  } catch (error) {
    cloudState.snapshots = [];
    cloudState.serviceError = friendlyCloudError(error);
    setCloudMessage(cloudState.serviceError, "error");
  }
  renderCloudBackupUI();
}

async function deleteSnapshot(uid, item) {
  const count = Number(item.chunkCount || 0);
  for (let i = 0; i < count; i += 1) {
    await cloudState.fs.deleteDoc(snapshotChunkDoc(uid, item.id, i)).catch(() => {});
  }
  await cloudState.fs.deleteDoc(snapshotDoc(uid, item.id)).catch(() => {});
}

async function deleteAsset(uid, asset) {
  const count = Number(asset.chunkCount || 0);
  for (let i = 0; i < count; i += 1) {
    await cloudState.fs.deleteDoc(assetChunkDoc(uid, asset.id, i)).catch(() => {});
  }
  await cloudState.fs.deleteDoc(assetDoc(uid, asset.id)).catch(() => {});
}

async function cleanupCloudBackup(uid) {
  const all = await listSnapshots(uid);
  const keep = all.slice(0, RETAINED_SNAPSHOTS);
  const remove = all.slice(RETAINED_SNAPSHOTS);
  for (const item of remove) await deleteSnapshot(uid, item);

  const usedAssets = new Set(keep.flatMap(item => Array.isArray(item.assetIds) ? item.assetIds : []));
  const assetsSnap = await cloudState.fs.getDocs(cloudState.fs.collection(cloudState.db, "tsukiCloudBackups", uid, "assets"));
  for (const docSnap of assetsSnap.docs) {
    if (!usedAssets.has(docSnap.id)) await deleteAsset(uid, { id: docSnap.id, ...docSnap.data() });
  }
}

async function ensureConsent(settings) {
  if (Number(settings.consentVersion || 0) >= BACKUP_CONSENT_VERSION) return true;
  const accepted = window.confirm(
    "Cloud Backup may contain highly private period, sexual-activity, fertility-sign, contraception, pregnancy, postpartum, feeding/pumping, baby, medication, concern, journal and locally saved media data. It is protected by your Firebase account and UID-scoped Firestore Security Rules, but it is not end-to-end encrypted. Signing in alone uploads nothing. Enable Cloud Backup?"
  );
  if (!accepted) return false;
  settings.consentVersion = BACKUP_CONSENT_VERSION;
  saveBackupSettings(cloudState.uid, settings);
  return true;
}

async function runCloudBackup(kind = "manual") {
  const user = cloudUser();
  if (!user || cloudState.busy) return false;
  cloudState.uid = user.uid;
  const settings = currentSettings();
  if (!(await ensureConsent(settings))) return false;
  if (!navigator.onLine) {
    setCloudMessage("You’re offline. Tsuki will keep your local data safe and try cloud backup when you’re online.", "error");
    return false;
  }

  setBusy(true);
  setCloudMessage(kind === "auto" ? "Creating today’s cloud backup…" : "Creating cloud backup…");
  const snapshotId = makeSnapshotId(kind);
  const writtenSnapshotChunks = [];
  try {
    await ensureFirestore();
    const raw = localStorage.getItem(TSUKI_DATA_KEY);
    if (!raw) throw new Error("Tsuki does not have local tracker data to back up yet.");
    const data = JSON.parse(raw);

    const assetKeys = collectAssetKeys(data);
    const assetResults = [];
    for (const key of assetKeys) {
      const blob = await readLocalAsset(key);
      if (!blob) {
        assetResults.push({ key, backedUp: false, reason: "missing-local" });
        continue;
      }
      try {
        assetResults.push(await uploadAsset(user.uid, key, blob));
      } catch (error) {
        console.warn("Tsuki cloud media backup skipped one asset:", key, error?.message || error);
        assetResults.push({ key, backedUp: false, reason: "upload-failed" });
      }
    }

    const assetIds = assetResults.filter(item => item.backedUp && item.assetId).map(item => item.assetId);
    const payload = {
      app: "Tsuki",
      version: TSUKI_BACKUP_APP_VERSION,
      exportedAt: new Date().toISOString(),
      data
    };
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    const chunks = chunkBytes(bytes);
    for (let i = 0; i < chunks.length; i += 1) {
      await cloudState.fs.setDoc(snapshotChunkDoc(user.uid, snapshotId, i), {
        index: i,
        payload: cloudState.fs.Bytes.fromUint8Array(chunks[i])
      });
      writtenSnapshotChunks.push(i);
    }

    const missingMedia = assetResults.filter(item => !item.backedUp).length;
    await cloudState.fs.setDoc(snapshotDoc(user.uid, snapshotId), {
      status: "complete",
      app: "Tsuki",
      version: TSUKI_BACKUP_APP_VERSION,
      kind: kind === "auto" ? "auto" : "manual",
      createdAtMillis: Date.now(),
      chunkCount: chunks.length,
      structuredBytes: bytes.byteLength,
      assetIds,
      mediaExpected: assetResults.length,
      mediaBackedUp: assetIds.length,
      mediaMissing: missingMedia,
      summary: backupSummary(data)
    });

    settings.lastSuccessAt = new Date().toISOString();
    if (afterBackupHour()) settings.lastAutoDate = localDayKey();
    saveBackupSettings(user.uid, settings);

    await cleanupCloudBackup(user.uid).catch(error => console.warn("Tsuki cloud cleanup skipped:", error?.message || error));
    await refreshCloudHistory();
    setCloudMessage(
      missingMedia
        ? `Cloud backup saved. ${missingMedia} local file${missingMedia === 1 ? " was" : "s were"} not included; structured Tsuki data is safe.`
        : "Cloud backup saved 🌙",
      missingMedia ? "" : "success"
    );
    if (typeof window.showToast === "function") window.showToast(kind === "auto" ? "Daily cloud backup saved 🌙" : "Cloud backup saved 🌙");
    return true;
  } catch (error) {
    for (const index of writtenSnapshotChunks) {
      await cloudState.fs?.deleteDoc(snapshotChunkDoc(user.uid, snapshotId, index)).catch(() => {});
    }
    cloudState.serviceError = friendlyCloudError(error);
    setCloudMessage(cloudState.serviceError, "error");
    cloudState.retryAfter = Date.now() + 5 * 60 * 1000;
    return false;
  } finally {
    setBusy(false);
    scheduleDailyBackup();
  }
}

async function loadSnapshotPayload(uid, item) {
  const parts = [];
  const count = Number(item.chunkCount || 0);
  if (!count) throw new Error("This cloud backup has no data chunks.");
  for (let i = 0; i < count; i += 1) {
    const chunk = await cloudState.fs.getDoc(snapshotChunkDoc(uid, item.id, i));
    if (!chunk.exists()) throw new Error("A cloud backup data chunk is missing.");
    const bytes = chunk.data()?.payload?.toUint8Array?.();
    if (!bytes) throw new Error("A cloud backup data chunk could not be read.");
    parts.push(bytes);
  }
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) { merged.set(part, offset); offset += part.byteLength; }
  const parsed = JSON.parse(new TextDecoder().decode(merged));
  if (!parsed || parsed.app !== "Tsuki" || !parsed.data || typeof parsed.data !== "object") throw new Error("This is not a valid Tsuki cloud backup.");
  return parsed;
}

async function restoreAsset(uid, assetId) {
  const metaSnap = await cloudState.fs.getDoc(assetDoc(uid, assetId));
  if (!metaSnap.exists()) return false;
  const meta = metaSnap.data();
  const count = Number(meta.chunkCount || 0);
  const parts = [];
  for (let i = 0; i < count; i += 1) {
    const chunk = await cloudState.fs.getDoc(assetChunkDoc(uid, assetId, i));
    if (!chunk.exists()) return false;
    const bytes = chunk.data()?.payload?.toUint8Array?.();
    if (!bytes) return false;
    parts.push(bytes);
  }
  if (typeof appearanceAssetPut !== "function") return false;
  const blob = new Blob(parts, { type: meta.type || "application/octet-stream" });
  await appearanceAssetPut(meta.key, blob);
  return true;
}

function selectedSnapshot() {
  const id = $("cloudBackupHistorySelect")?.value || cloudState.snapshots[0]?.id || "";
  return cloudState.snapshots.find(item => item.id === id) || null;
}

function showRestorePreview() {
  const item = selectedSnapshot();
  if (!item) return;
  cloudState.pendingRestoreId = item.id;
  const summary = item.summary || {};
  const preview = $("cloudRestorePreview");
  const content = $("cloudRestorePreviewContent");
  if (content) content.innerHTML = `
    <p><strong>${item.kind === "auto" ? "Daily" : "Manual"} backup:</strong> ${formatBackupStamp(item.createdAtMillis)}</p>
    <div class="restore-count-grid cloud-restore-counts">
      <span>${Number(summary.periods || 0)}<small>Periods</small></span>
      <span>${Number(summary.cycleLogs || 0)}<small>Cycle check-ins</small></span>
      <span>${Number(summary.pregnancyLogs || 0)}<small>Pregnancy check-ins</small></span>
      <span>${Number(summary.pregnancyAppointments || 0)}<small>Appointments</small></span>
      <span>${Number(item.mediaBackedUp || 0)}<small>Media files</small></span>
      <span>${String(summary.mode || "cycle")}<small>Life mode</small></span>
    </div>
    <p class="muted small-text">Restore replaces the current Tsuki tracker data on this device. Your device-specific App Lock PIN stays unchanged. ${Number(item.mediaMissing || 0) ? `${Number(item.mediaMissing)} local media file(s) were not available when this snapshot was created.` : "Backed-up local media will also be restored."}</p>`;
  preview?.classList.remove("hidden");
}

function hideRestorePreview() {
  cloudState.pendingRestoreId = "";
  $("cloudRestorePreview")?.classList.add("hidden");
}

async function restoreSelectedBackup() {
  const user = cloudUser();
  const item = cloudState.snapshots.find(snapshot => snapshot.id === cloudState.pendingRestoreId);
  if (!user || !item || cloudState.busy) return;
  const confirmed = window.confirm("Restore this cloud backup now? Tsuki will replace the current tracker data on this device, then reload.");
  if (!confirmed) return;

  setBusy(true);
  setCloudMessage("Restoring cloud backup…");
  try {
    await ensureFirestore();
    const payload = await loadSnapshotPayload(user.uid, item);
    const currentRaw = localStorage.getItem(TSUKI_DATA_KEY);
    if (currentRaw) {
      if (typeof appearanceAssetPut !== "function") throw new Error("Local recovery storage is unavailable, so restore was cancelled before changing your data.");
      await appearanceAssetPut(TSUKI_RECOVERY_KEY, currentRaw);
    }

    let restoredMedia = 0;
    for (const assetId of Array.isArray(item.assetIds) ? item.assetIds : []) {
      try { if (await restoreAsset(user.uid, assetId)) restoredMedia += 1; } catch (_) {}
    }

    localStorage.setItem(TSUKI_DATA_KEY, JSON.stringify(payload.data));
    localStorage.removeItem("tsuki-recovery-needed");
    setCloudMessage(`Backup restored${item.assetIds?.length ? ` · ${restoredMedia}/${item.assetIds.length} media files` : ""}. Reloading…`, "success");
    setTimeout(() => location.reload(), 350);
  } catch (error) {
    setCloudMessage(friendlyCloudError(error), "error");
    setBusy(false);
  }
}

async function deleteAllCloudBackups() {
  const user = cloudUser();
  if (!user || cloudState.busy) return;
  const confirmed = window.confirm("Delete every Tsuki cloud backup for this account? Local Tsuki data on this device will not be deleted.");
  if (!confirmed) return;
  setBusy(true);
  setCloudMessage("Deleting cloud backups…");
  try {
    await ensureFirestore();
    const snapshots = await listSnapshots(user.uid);
    for (const item of snapshots) await deleteSnapshot(user.uid, item);
    const assets = await cloudState.fs.getDocs(cloudState.fs.collection(cloudState.db, "tsukiCloudBackups", user.uid, "assets"));
    for (const docSnap of assets.docs) await deleteAsset(user.uid, { id: docSnap.id, ...docSnap.data() });
    const settings = currentSettings();
    settings.enabled = false;
    settings.lastAutoDate = "";
    settings.lastSuccessAt = "";
    saveBackupSettings(user.uid, settings);
    cloudState.snapshots = [];
    cloudState.serviceError = "";
    hideRestorePreview();
    setCloudMessage("Cloud backups deleted. Your local Tsuki data is still on this device.", "success");
  } catch (error) {
    setCloudMessage(friendlyCloudError(error), "error");
  } finally {
    setBusy(false);
    renderCloudBackupUI();
  }
}

async function maybeRunDailyBackup(reason = "resume") {
  const user = cloudUser();
  if (!user || cloudState.busy || document.visibilityState === "hidden") return;
  const settings = loadBackupSettings(user.uid);
  if (!settings.enabled || Number(settings.consentVersion || 0) < BACKUP_CONSENT_VERSION) return;
  const now = new Date();
  if (!afterBackupHour(now) || settings.lastAutoDate === localDayKey(now)) return;
  if (!navigator.onLine || Date.now() < cloudState.retryAfter) return;
  await runCloudBackup("auto");
}

function scheduleDailyBackup() {
  clearTimeout(cloudState.timer);
  cloudState.timer = null;
  const user = cloudUser();
  if (!user) return;
  const settings = loadBackupSettings(user.uid);
  if (!settings.enabled) return;
  const now = new Date();
  if (afterBackupHour(now) && settings.lastAutoDate !== localDayKey(now)) {
    cloudState.timer = setTimeout(() => maybeRunDailyBackup("due"), 1200);
    return;
  }
  const delay = Math.max(1000, nextBackupTime(now).getTime() - now.getTime());
  cloudState.timer = setTimeout(() => maybeRunDailyBackup("8am"), delay);
}

async function toggleDailyBackup(event) {
  const user = cloudUser();
  if (!user) return;
  cloudState.uid = user.uid;
  const settings = loadBackupSettings(user.uid);
  if (event.target.checked) {
    const accepted = await ensureConsent(settings);
    if (!accepted) {
      event.target.checked = false;
      settings.enabled = false;
      saveBackupSettings(user.uid, settings);
      renderCloudBackupUI();
      return;
    }
    settings.enabled = true;
    saveBackupSettings(user.uid, settings);
    setCloudMessage("Daily cloud backup is on. Tsuki will create one backup per day, due at 8:00 AM.", "success");
    await refreshCloudHistory();
    await maybeRunDailyBackup("enabled");
  } else {
    settings.enabled = false;
    saveBackupSettings(user.uid, settings);
    setCloudMessage("Daily cloud backup is off. Manual cloud backup is still available while you’re signed in.");
  }
  scheduleDailyBackup();
  renderCloudBackupUI();
}

async function handleAuthChange() {
  const user = cloudUser();
  clearTimeout(cloudState.timer);
  cloudState.timer = null;
  cloudState.pendingRestoreId = "";
  if (!user) {
    cloudState.uid = "";
    cloudState.snapshots = [];
    cloudState.serviceError = "";
    renderCloudBackupUI();
    return;
  }
  cloudState.uid = user.uid;
  renderCloudBackupUI();
  await refreshCloudHistory();
  scheduleDailyBackup();
  await maybeRunDailyBackup("sign-in");
}

function bindCloudBackupUI() {
  $("cloudBackupEnabled")?.addEventListener("change", toggleDailyBackup);
  $("cloudBackupNow")?.addEventListener("click", () => runCloudBackup("manual"));
  $("cloudRestorePreviewButton")?.addEventListener("click", showRestorePreview);
  $("cloudRestoreCancel")?.addEventListener("click", hideRestorePreview);
  $("cloudRestoreConfirm")?.addEventListener("click", restoreSelectedBackup);
  $("cloudBackupHistorySelect")?.addEventListener("change", hideRestorePreview);
  $("cloudDeleteBackups")?.addEventListener("click", deleteAllCloudBackups);

  window.addEventListener("tsuki-auth-changed", handleAuthChange);
  window.addEventListener("online", () => { refreshCloudHistory(); maybeRunDailyBackup("online"); });
  window.addEventListener("pageshow", () => maybeRunDailyBackup("pageshow"));
  window.addEventListener("focus", () => maybeRunDailyBackup("focus"));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") maybeRunDailyBackup("resume");
  });
}

window.TsukiCloudBackup = {
  get enabled() { return currentSettings().enabled; },
  get busy() { return cloudState.busy; },
  get snapshots() { return cloudState.snapshots.slice(); },
  backupNow: () => runCloudBackup("manual"),
  refresh: refreshCloudHistory,
  maybeRunDailyBackup,
  test: {
    localDayKey,
    afterBackupHour,
    nextBackupTime,
    chunkBytes,
    collectAssetKeys
  }
};

bindCloudBackupUI();
renderCloudBackupUI();
setTimeout(handleAuthChange, 0);
