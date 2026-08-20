/* ============================================================
   TSUKI V1 — OPTIONAL FIREBASE CLOUD BACKUP + SAFE RESTORE
   Local-first, explicit opt-in, versioned history, restore-first guard.
   ============================================================ */

const TSUKI_CLOUD_SDK_VERSION = "12.16.0";
const TSUKI_CLOUD_APP_VERSION = "1.0.0";
const TSUKI_CLOUD_FORMAT = "tsuki-cloud-v2";
const TSUKI_DATA_KEY = "tsuki-data-v4";
const TSUKI_RECOVERY_KEY = "tsuki-last-good-data-v1";
const TSUKI_CLOUD_SETTINGS_PREFIX = "tsuki-cloud-backup-v2:";
const TSUKI_CLOUD_BASELINE_PREFIX = "tsuki-cloud-baseline-v2:";
const TSUKI_CLOUD_GUARD_PREFIX = "tsuki-cloud-restore-guard-v2:";
const TSUKI_CLOUD_DEVICE_KEY = "tsuki-cloud-device-v1";
const TSUKI_CLOUD_CONSENT_VERSION = 3;
const TSUKI_CLOUD_BACKUP_HOUR = 8;
const TSUKI_CLOUD_RETAINED = 14;
const TSUKI_CLOUD_CHUNK_BYTES = 500000;
const TSUKI_CLOUD_MAX_ASSET_BYTES = 25 * 1024 * 1024;
const TSUKI_CLOUD_READ_TIMEOUT_MS = 12000;
const TSUKI_CLOUD_AUTO_DEBOUNCE_MS = 12000;
const TSUKI_CLOUD_DESTRUCTIVE_MIN_REMOTE = 12;
const TSUKI_CLOUD_DESTRUCTIVE_MIN_LOSS = 10;
const TSUKI_CLOUD_DESTRUCTIVE_RATIO = 0.25;

const cloudState = {
  uid: "",
  db: null,
  fs: null,
  initPromise: null,
  busy: false,
  snapshots: [],
  guard: null,
  inspectionComplete: false,
  inspectionPromise: null,
  pendingRestoreId: "",
  autoTimer: null,
  dailyTimer: null,
  dirty: false,
  retryAfter: 0,
  deleteAccountBypass: false,
  renderQueued: false
};

const cloud$ = id => document.getElementById(id);
const cloudUser = () => window.TsukiAuth?.user || null;

function cloudJsonRead(key, fallback = null) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value === null ? fallback : value;
  } catch (_) {
    return fallback;
  }
}

function cloudJsonWrite(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (_) { return false; }
}

function cloudSettingsKey(uid) { return `${TSUKI_CLOUD_SETTINGS_PREFIX}${uid}`; }
function cloudBaselineKey(uid) { return `${TSUKI_CLOUD_BASELINE_PREFIX}${uid}`; }
function cloudGuardKey(uid) { return `${TSUKI_CLOUD_GUARD_PREFIX}${uid}`; }

function loadCloudSettings(uid = cloudState.uid) {
  const fallback = { enabled: false, consentVersion: 0, lastSuccessAt: "", lastAutoDate: "" };
  if (!uid) return fallback;
  return { ...fallback, ...(cloudJsonRead(cloudSettingsKey(uid), {}) || {}) };
}

function saveCloudSettings(uid, value) {
  if (!uid) return;
  cloudJsonWrite(cloudSettingsKey(uid), value);
}

function readBaseline(uid = cloudState.uid) {
  return uid ? cloudJsonRead(cloudBaselineKey(uid), null) : null;
}

function writeBaseline(uid, snapshot = {}) {
  if (!uid) return;
  cloudJsonWrite(cloudBaselineKey(uid), {
    snapshotId: snapshot.id || snapshot.snapshotId || "",
    recordCount: Number(snapshot.recordCount || 0),
    sourceDeviceId: snapshot.sourceDeviceId || "",
    savedAt: Date.now()
  });
}

function readGuard(uid = cloudState.uid) {
  return uid ? cloudJsonRead(cloudGuardKey(uid), null) : null;
}

function writeGuard(uid, snapshot, reason) {
  if (!uid || !snapshot) return null;
  const guard = {
    snapshotId: snapshot.id || "",
    recordCount: Number(snapshot.recordCount ?? snapshot.summary?.recordCount ?? 0),
    sourceDeviceId: snapshot.sourceDeviceId || "",
    createdAtMillis: Number(snapshot.createdAtMillis || 0),
    reason: reason || "restore-first",
    savedAt: Date.now()
  };
  cloudJsonWrite(cloudGuardKey(uid), guard);
  cloudState.guard = guard;
  return guard;
}

function clearGuard(uid = cloudState.uid) {
  if (!uid) return;
  try { localStorage.removeItem(cloudGuardKey(uid)); } catch (_) {}
  if (uid === cloudState.uid) cloudState.guard = null;
}

function deviceId() {
  try {
    let value = localStorage.getItem(TSUKI_CLOUD_DEVICE_KEY) || "";
    if (!value) {
      value = crypto?.randomUUID?.() || `tsuki-device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(TSUKI_CLOUD_DEVICE_KEY, value);
    }
    return value;
  } catch (_) {
    return `tsuki-session-${Math.random().toString(36).slice(2)}`;
  }
}

function localDayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function afterBackupHour(date = new Date()) { return date.getHours() >= TSUKI_CLOUD_BACKUP_HOUR; }
function nextBackupTime(now = new Date()) {
  const next = new Date(now);
  next.setHours(TSUKI_CLOUD_BACKUP_HOUR, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

function withTimeout(promise, ms = TSUKI_CLOUD_READ_TIMEOUT_MS, code = "tsuki-cloud-timeout") {
  let timer = null;
  return Promise.race([
    Promise.resolve(promise).finally(() => { if (timer) clearTimeout(timer); }),
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(code)), ms); })
  ]);
}

function friendlyCloudError(error) {
  const code = String(error?.code || error?.message || "");
  if (code.includes("permission-denied")) return "Tsuki Cloud needs its private Firestore rules deployed for this Firebase project.";
  if (code.includes("failed-precondition")) return "Cloud Firestore needs to be enabled for Tsuki first.";
  if (code.includes("unavailable") || code.includes("network") || code.includes("offline")) return "Tsuki Cloud can’t reach Firebase right now. Your data on this phone is still safe.";
  if (code.includes("resource-exhausted")) return "Firebase’s storage or request limit was reached. Your local Tsuki data is still safe.";
  if (code.includes("timeout")) return "Tsuki Cloud took too long to respond. Nothing on this phone was replaced.";
  if (code.includes("integrity")) return "That cloud backup did not pass its integrity check, so Tsuki refused to restore it.";
  return error?.message ? `Tsuki Cloud couldn’t finish: ${error.message}` : "Tsuki Cloud couldn’t finish. Your local data is still safe.";
}

function setCloudMessage(text = "", kind = "") {
  const node = cloud$("tsukiCloudMessage");
  if (!node) return;
  node.textContent = text;
  node.className = `firebase-auth-message${kind ? ` ${kind}` : ""}${text ? "" : " hidden"}`;
}

function meaningfulCount(data) {
  if (!data || typeof data !== "object") return 0;
  const arr = value => Array.isArray(value) ? value.length : 0;
  const map = value => value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value).length : 0;
  let total = 0;

  total += arr(data.periods) + map(data.logs) + arr(data.relief) + arr(data.journal) + arr(data.trips);
  total += arr(data.customSymptoms) + arr(data.pregnancyHistory);
  total += arr(data.plans) + arr(data.events) + arr(data.planEvents) + arr(data.plansEvents);
  total += arr(data.sexualActivity) + arr(data.reproductiveActivity);
  total += arr(data.insightState?.saved);

  const pregnancy = data.pregnancy || {};
  if (pregnancy.active) total += 1;
  total += map(pregnancy.logs);
  ["appointments","questions","medications","tests","journal","photos","vaccinations","bpReadings","glucoseReadings","wellbeing","movementJournal","contractions","fluidNotes","reminders","documents"].forEach(key => { total += arr(pregnancy[key]); });

  const postpartum = data.postpartum || {};
  if (postpartum.active) total += 1;
  ["logs","feedingLogs","pumpingLogs","babyLogs","recoveryLogs","appointments","medications","concerns","journal"].forEach(key => {
    total += Array.isArray(postpartum[key]) ? postpartum[key].length : map(postpartum[key]);
  });

  const personal = data.personalHealth || {};
  Object.values(personal).forEach(value => {
    if (Array.isArray(value)) total += value.length;
    else if (value && typeof value === "object") total += Object.values(value).reduce((sum, nested) => sum + (Array.isArray(nested) ? nested.length : 0), 0);
  });

  return total;
}

function backupSummary(data) {
  const pregnancy = data?.pregnancy || {};
  return {
    mode: data?.mode || "cycle",
    recordCount: meaningfulCount(data),
    periods: Array.isArray(data?.periods) ? data.periods.length : 0,
    cycleLogs: data?.logs && typeof data.logs === "object" ? Object.keys(data.logs).length : 0,
    journal: Array.isArray(data?.journal) ? data.journal.length : 0,
    trips: Array.isArray(data?.trips) ? data.trips.length : 0,
    pregnancyActive: Boolean(pregnancy.active),
    pregnancyLogs: pregnancy.logs && typeof pregnancy.logs === "object" ? Object.keys(pregnancy.logs).length : 0,
    pregnancyAppointments: Array.isArray(pregnancy.appointments) ? pregnancy.appointments.length : 0
  };
}

function localPayloadInfo() {
  const raw = localStorage.getItem(TSUKI_DATA_KEY);
  if (!raw) return { raw: "", data: null, summary: { recordCount: 0 } };
  try {
    const data = JSON.parse(raw);
    return { raw, data, summary: backupSummary(data) };
  } catch (_) {
    return { raw, data: null, summary: { recordCount: 0 } };
  }
}

function isDestructiveDrop(localCount, remoteCount) {
  const local = Number(localCount || 0);
  const remote = Number(remoteCount || 0);
  if (remote <= 0) return false;
  if (local === 0) return true;
  const lost = remote - local;
  return remote >= TSUKI_CLOUD_DESTRUCTIVE_MIN_REMOTE &&
    lost >= TSUKI_CLOUD_DESTRUCTIVE_MIN_LOSS &&
    local < remote * TSUKI_CLOUD_DESTRUCTIVE_RATIO;
}

async function ensureFirestore() {
  if (cloudState.db && cloudState.fs) return true;
  if (cloudState.initPromise) return cloudState.initPromise;
  cloudState.initPromise = (async () => {
    const [appModule, firestoreModule] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${TSUKI_CLOUD_SDK_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${TSUKI_CLOUD_SDK_VERSION}/firebase-firestore.js`)
    ]);
    const apps = appModule.getApps();
    if (!apps.length) throw new Error("Firebase account services are still loading.");
    cloudState.fs = firestoreModule;
    cloudState.db = firestoreModule.getFirestore(apps[0]);
    return true;
  })().finally(() => { cloudState.initPromise = null; });
  return cloudState.initPromise;
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
  for (let offset = 0; offset < bytes.byteLength; offset += TSUKI_CLOUD_CHUNK_BYTES) {
    chunks.push(bytes.slice(offset, Math.min(offset + TSUKI_CLOUD_CHUNK_BYTES, bytes.byteLength)));
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
    if (!node || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);
    if (typeof node.assetKey === "string" && node.assetKey.trim()) keys.add(node.assetKey.trim());
    if (Array.isArray(node)) node.forEach(walk);
    else Object.values(node).forEach(walk);
  }
  walk(value);
  if (value?.settings?.wallpaperEnabled) keys.add("wallpaper");
  return [...keys];
}

function appearanceGetter() {
  return typeof window.appearanceAssetGet === "function" ? window.appearanceAssetGet : null;
}
function appearancePutter() {
  return typeof window.appearanceAssetPut === "function" ? window.appearanceAssetPut : null;
}

async function readLocalAsset(key) {
  const get = appearanceGetter();
  if (!get) return null;
  try {
    const value = await get(key);
    return value instanceof Blob ? value : null;
  } catch (_) { return null; }
}

async function uploadAsset(uid, key, blob) {
  const buffer = await blob.arrayBuffer();
  if (buffer.byteLength > TSUKI_CLOUD_MAX_ASSET_BYTES) return { key, backedUp: false, reason: "too-large", size: buffer.byteLength };
  const hash = await sha256Hex(buffer);
  const assetId = await sha256Hex(`${key}\n${hash}`);
  const ref = assetDoc(uid, assetId);
  const existing = await withTimeout(cloudState.fs.getDoc(ref));
  if (existing.exists()) return { key, assetId, backedUp: true, size: buffer.byteLength };

  const chunks = chunkBytes(new Uint8Array(buffer));
  for (let i = 0; i < chunks.length; i += 1) {
    await cloudState.fs.setDoc(assetChunkDoc(uid, assetId, i), { index: i, payload: cloudState.fs.Bytes.fromUint8Array(chunks[i]) });
  }
  await cloudState.fs.setDoc(ref, {
    key,
    hash,
    size: buffer.byteLength,
    type: blob.type || "application/octet-stream",
    chunkCount: chunks.length,
    updatedAtMillis: Date.now()
  });
  return { key, assetId, backedUp: true, size: buffer.byteLength };
}

function makeSnapshotId(kind) {
  const now = new Date();
  const stamp = `${localDayKey(now).replaceAll("-", "")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  return `${stamp}-${kind}-${Math.random().toString(36).slice(2, 8)}`;
}

async function listSnapshots(uid = cloudState.uid) {
  if (!uid) return [];
  await ensureFirestore();
  const collection = cloudState.fs.collection(cloudState.db, "tsukiCloudBackups", uid, "snapshots");
  const query = cloudState.fs.query(collection, cloudState.fs.orderBy("createdAtMillis", "desc"), cloudState.fs.limit(30));
  const result = await withTimeout(cloudState.fs.getDocs(query));
  return result.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => item.status === "complete");
}

async function refreshSnapshots({ quiet = false } = {}) {
  const user = cloudUser();
  if (!user) return [];
  cloudState.uid = user.uid;
  try {
    cloudState.snapshots = await listSnapshots(user.uid);
    if (!quiet) setCloudMessage();
  } catch (error) {
    cloudState.snapshots = [];
    if (!quiet) setCloudMessage(friendlyCloudError(error), "error");
    throw error;
  } finally {
    scheduleRender();
  }
  return cloudState.snapshots;
}

async function deleteSnapshot(uid, item) {
  const count = Number(item.chunkCount || 0);
  for (let i = 0; i < count; i += 1) await cloudState.fs.deleteDoc(snapshotChunkDoc(uid, item.id, i)).catch(() => {});
  await cloudState.fs.deleteDoc(snapshotDoc(uid, item.id)).catch(() => {});
}

async function deleteAsset(uid, item) {
  const count = Number(item.chunkCount || 0);
  for (let i = 0; i < count; i += 1) await cloudState.fs.deleteDoc(assetChunkDoc(uid, item.id, i)).catch(() => {});
  await cloudState.fs.deleteDoc(assetDoc(uid, item.id)).catch(() => {});
}

async function cleanupCloud(uid) {
  const all = await listSnapshots(uid);
  const keep = all.slice(0, TSUKI_CLOUD_RETAINED);
  for (const item of all.slice(TSUKI_CLOUD_RETAINED)) await deleteSnapshot(uid, item);

  const used = new Set(keep.flatMap(item => Array.isArray(item.assetIds) ? item.assetIds : []));
  const assets = await withTimeout(cloudState.fs.getDocs(cloudState.fs.collection(cloudState.db, "tsukiCloudBackups", uid, "assets")));
  for (const doc of assets.docs) {
    if (!used.has(doc.id)) await deleteAsset(uid, { id: doc.id, ...doc.data() });
  }
}

async function ensureConsent(settings) {
  if (Number(settings.consentVersion || 0) >= TSUKI_CLOUD_CONSENT_VERSION) return true;
  const accepted = window.confirm(
    "Tsuki Cloud Backup can contain highly private period, sexual-activity, fertility-sign, contraception, pregnancy, postpartum, baby, medication, journal and locally saved media data. It is protected by your Firebase sign-in and private per-user Firestore rules, but it is not end-to-end encrypted. Signing in alone uploads nothing. Enable Cloud Backup?"
  );
  if (!accepted) return false;
  settings.consentVersion = TSUKI_CLOUD_CONSENT_VERSION;
  saveCloudSettings(cloudState.uid, settings);
  return true;
}

function latestSnapshot() { return cloudState.snapshots[0] || null; }

function unseenRemote(latest, localCount) {
  if (!latest || Number(latest.recordCount ?? latest.summary?.recordCount ?? 0) <= 0) return false;
  const baseline = readBaseline(cloudState.uid);
  if (baseline?.snapshotId && baseline.snapshotId === latest.id) return false;
  const source = latest.sourceDeviceId || "";
  const otherDevice = source && source !== deviceId();
  return localCount === 0 || otherDevice;
}

async function inspectCloud(reason = "auth") {
  const user = cloudUser();
  if (!user || !navigator.onLine) return null;
  if (cloudState.inspectionPromise) return cloudState.inspectionPromise;
  cloudState.uid = user.uid;
  cloudState.inspectionComplete = false;

  cloudState.inspectionPromise = (async () => {
    try {
      await refreshSnapshots({ quiet: true });
      const local = localPayloadInfo();
      const latest = latestSnapshot();
      const remoteCount = Number(latest?.recordCount ?? latest?.summary?.recordCount ?? 0);
      const localCount = Number(local.summary?.recordCount || 0);

      if (latest && remoteCount > 0 && unseenRemote(latest, localCount)) {
        writeGuard(user.uid, latest, localCount === 0 ? "empty-device-restore-first" : "unseen-cloud-copy");
      } else if (!latest || remoteCount === 0 || readBaseline(user.uid)?.snapshotId === latest.id) {
        clearGuard(user.uid);
      } else {
        cloudState.guard = readGuard(user.uid);
      }

      cloudState.inspectionComplete = true;
      scheduleRender();

      if (cloudState.guard?.reason === "empty-device-restore-first") {
        setTimeout(() => window.TsukiAuth?.open?.(), 80);
      }
      return { localCount, remoteCount, guarded: Boolean(cloudState.guard), reason };
    } catch (error) {
      cloudState.inspectionComplete = false;
      setCloudMessage(friendlyCloudError(error), "error");
      return null;
    }
  })().finally(() => { cloudState.inspectionPromise = null; });
  return cloudState.inspectionPromise;
}

async function runCloudBackup(kind = "manual", options = {}) {
  const user = cloudUser();
  if (!user || cloudState.busy) return false;
  cloudState.uid = user.uid;
  const settings = loadCloudSettings(user.uid);
  const isManual = kind === "manual" || kind === "initial";

  if (!(await ensureConsent(settings))) return false;
  if (!navigator.onLine) {
    setCloudMessage("You’re offline. Tsuki will keep your local data safe and back up when you’re online.", "error");
    return false;
  }

  if (!cloudState.inspectionComplete) await inspectCloud("before-backup");
  if (!cloudState.inspectionComplete) return false;

  const local = localPayloadInfo();
  if (!local.raw || !local.data) {
    setCloudMessage("Tsuki does not have readable local tracker data to back up yet.", "error");
    return false;
  }

  const latest = latestSnapshot();
  const localCount = Number(local.summary.recordCount || 0);
  const remoteCount = Number(latest?.recordCount ?? latest?.summary?.recordCount ?? 0);
  const protectedCloud = Boolean(cloudState.guard || readGuard(user.uid));
  const destructive = latest && isDestructiveDrop(localCount, remoteCount);

  if ((protectedCloud || destructive) && !options.force) {
    if (!isManual) {
      if (latest) writeGuard(user.uid, latest, localCount === 0 ? "empty-device-restore-first" : "destructive-drop");
      setCloudMessage("Automatic backup is paused so this phone cannot replace a fuller cloud copy. Restore or review the cloud copy first.", "error");
      scheduleRender();
      return false;
    }
    const confirmed = window.confirm(
      `Tsuki Cloud currently has a protected backup with ${remoteCount} tracked item${remoteCount === 1 ? "" : "s"}; this phone has ${localCount}. Backing up now can replace the protected cloud copy in the newest slot. Older versioned backups will still be retained.\n\nBack up this phone anyway?`
    );
    if (!confirmed) return false;
  }

  cloudState.busy = true;
  scheduleRender();
  setCloudMessage(kind === "manual" ? "Creating cloud backup…" : "Saving Tsuki to the cloud…");
  const snapshotId = makeSnapshotId(kind);
  const writtenChunks = [];

  try {
    await ensureFirestore();
    const assetResults = [];
    for (const key of collectAssetKeys(local.data)) {
      const blob = await readLocalAsset(key);
      if (!blob) { assetResults.push({ key, backedUp: false, reason: "missing-local" }); continue; }
      try { assetResults.push(await uploadAsset(user.uid, key, blob)); }
      catch (_) { assetResults.push({ key, backedUp: false, reason: "upload-failed" }); }
    }

    const assetIds = assetResults.filter(item => item.backedUp && item.assetId).map(item => item.assetId);
    const payload = {
      app: "Tsuki",
      backupFormat: TSUKI_CLOUD_FORMAT,
      version: TSUKI_CLOUD_APP_VERSION,
      ownerUid: user.uid,
      sourceDeviceId: deviceId(),
      exportedAt: new Date().toISOString(),
      recordCount: localCount,
      data: local.data
    };
    const json = JSON.stringify(payload);
    const hash = await sha256Hex(json);
    const bytes = new TextEncoder().encode(json);
    const chunks = chunkBytes(bytes);

    for (let i = 0; i < chunks.length; i += 1) {
      await cloudState.fs.setDoc(snapshotChunkDoc(user.uid, snapshotId, i), { index: i, payload: cloudState.fs.Bytes.fromUint8Array(chunks[i]) });
      writtenChunks.push(i);
    }

    const missingMedia = assetResults.filter(item => !item.backedUp).length;
    const manifest = {
      status: "complete",
      app: "Tsuki",
      backupFormat: TSUKI_CLOUD_FORMAT,
      version: TSUKI_CLOUD_APP_VERSION,
      kind,
      ownerUid: user.uid,
      sourceDeviceId: deviceId(),
      createdAtMillis: Date.now(),
      chunkCount: chunks.length,
      structuredBytes: bytes.byteLength,
      structuredSha256: hash,
      recordCount: localCount,
      assetIds,
      mediaExpected: assetResults.length,
      mediaBackedUp: assetIds.length,
      mediaMissing: missingMedia,
      summary: local.summary
    };
    await cloudState.fs.setDoc(snapshotDoc(user.uid, snapshotId), manifest);

    settings.lastSuccessAt = new Date().toISOString();
    if (afterBackupHour()) settings.lastAutoDate = localDayKey();
    saveCloudSettings(user.uid, settings);
    writeBaseline(user.uid, { id: snapshotId, ...manifest });
    clearGuard(user.uid);
    cloudState.dirty = false;

    await cleanupCloud(user.uid).catch(error => console.warn("Tsuki Cloud cleanup deferred.", error));
    await refreshSnapshots({ quiet: true });
    setCloudMessage(missingMedia ? `Cloud backup saved. ${missingMedia} local media file${missingMedia === 1 ? " was" : "s were"} not included.` : "Cloud backup saved 🌙", "success");
    if (typeof window.showToast === "function") window.showToast("Tsuki Cloud backup saved 🌙");
    return true;
  } catch (error) {
    for (const index of writtenChunks) await cloudState.fs?.deleteDoc(snapshotChunkDoc(user.uid, snapshotId, index)).catch(() => {});
    cloudState.retryAfter = Date.now() + 5 * 60 * 1000;
    setCloudMessage(friendlyCloudError(error), "error");
    return false;
  } finally {
    cloudState.busy = false;
    scheduleRender();
    scheduleDailyBackup();
  }
}

async function loadSnapshotPayload(uid, item) {
  await ensureFirestore();
  const count = Number(item?.chunkCount || 0);
  if (!count) throw new Error("This cloud backup has no data chunks.");
  const parts = [];
  for (let i = 0; i < count; i += 1) {
    const snap = await withTimeout(cloudState.fs.getDoc(snapshotChunkDoc(uid, item.id, i)));
    if (!snap.exists()) throw new Error("A cloud backup data chunk is missing.");
    const bytes = snap.data()?.payload?.toUint8Array?.();
    if (!bytes) throw new Error("A cloud backup data chunk could not be read.");
    parts.push(bytes);
  }
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) { merged.set(part, offset); offset += part.byteLength; }
  const json = new TextDecoder().decode(merged);
  if (item.structuredSha256) {
    const hash = await sha256Hex(json);
    if (hash !== item.structuredSha256) throw new Error("tsuki-cloud-integrity-failed");
  }
  const payload = JSON.parse(json);
  if (!payload || payload.app !== "Tsuki" || !payload.data || typeof payload.data !== "object") throw new Error("This is not a valid Tsuki cloud backup.");
  if (payload.ownerUid && payload.ownerUid !== uid) throw new Error("This backup belongs to a different account.");
  return payload;
}

async function restoreAsset(uid, assetId) {
  const metaSnap = await withTimeout(cloudState.fs.getDoc(assetDoc(uid, assetId)));
  if (!metaSnap.exists()) return false;
  const meta = metaSnap.data();
  const parts = [];
  for (let i = 0; i < Number(meta.chunkCount || 0); i += 1) {
    const chunk = await withTimeout(cloudState.fs.getDoc(assetChunkDoc(uid, assetId, i)));
    if (!chunk.exists()) return false;
    const bytes = chunk.data()?.payload?.toUint8Array?.();
    if (!bytes) return false;
    parts.push(bytes);
  }
  const put = appearancePutter();
  if (!put) return false;
  await put(meta.key, new Blob(parts, { type: meta.type || "application/octet-stream" }));
  return true;
}

function selectedSnapshot() {
  const id = cloud$("tsukiCloudHistory")?.value || cloudState.pendingRestoreId || cloudState.snapshots[0]?.id || "";
  return cloudState.snapshots.find(item => item.id === id) || null;
}

function showRestorePreview(item = selectedSnapshot()) {
  if (!item) return;
  cloudState.pendingRestoreId = item.id;
  const summary = item.summary || {};
  const content = cloud$("tsukiCloudRestorePreviewContent");
  if (content) content.innerHTML = `
    <p><strong>${cloudKindLabel(item.kind)} backup</strong><br>${formatCloudTime(item.createdAtMillis)}</p>
    <div class="tsuki-cloud-counts">
      <span><b>${Number(summary.periods || 0)}</b><small>Periods</small></span>
      <span><b>${Number(summary.cycleLogs || 0)}</b><small>Check-ins</small></span>
      <span><b>${Number(summary.journal || 0)}</b><small>Journal</small></span>
      <span><b>${Number(item.mediaBackedUp || 0)}</b><small>Media</small></span>
    </div>
    <p class="muted small-text">Restore replaces the Tsuki tracker on this phone only after the cloud copy passes its integrity check. This phone’s App Lock PIN is never restored from cloud.</p>`;
  cloud$("tsukiCloudRestorePreview")?.classList.remove("hidden");
  scheduleRender();
}

function hideRestorePreview() {
  cloudState.pendingRestoreId = "";
  cloud$("tsukiCloudRestorePreview")?.classList.add("hidden");
}

async function saveLocalRecovery(raw) {
  if (!raw) return true;
  const put = appearancePutter();
  if (!put) return false;
  try { await put(TSUKI_RECOVERY_KEY, raw); return true; }
  catch (_) { return false; }
}

async function restoreSelectedBackup(item = selectedSnapshot()) {
  const user = cloudUser();
  if (!user || !item || cloudState.busy) return false;
  const local = localPayloadInfo();
  const localCount = Number(local.summary.recordCount || 0);
  const confirmed = window.confirm(localCount > 0
    ? `Restore this cloud backup? Tsuki will first protect the current ${localCount} tracked item${localCount === 1 ? "" : "s"} on this phone, then replace this phone’s tracker and reload.`
    : "Restore this Tsuki Cloud backup to this phone now?");
  if (!confirmed) return false;

  cloudState.busy = true;
  scheduleRender();
  setCloudMessage("Validating cloud backup…");
  try {
    const payload = await loadSnapshotPayload(user.uid, item);
    const currentRaw = localStorage.getItem(TSUKI_DATA_KEY) || "";
    if (currentRaw && !(await saveLocalRecovery(currentRaw))) {
      throw new Error("Tsuki could not create a local recovery copy, so restore was cancelled before changing your data.");
    }

    setCloudMessage("Restoring Tsuki…");
    let restoredMedia = 0;
    for (const assetId of Array.isArray(item.assetIds) ? item.assetIds : []) {
      try { if (await restoreAsset(user.uid, assetId)) restoredMedia += 1; } catch (_) {}
    }

    localStorage.setItem(TSUKI_DATA_KEY, JSON.stringify(payload.data));
    localStorage.removeItem("tsuki-recovery-needed");
    writeBaseline(user.uid, item);
    clearGuard(user.uid);
    try { sessionStorage.setItem("tsuki-cloud-restore-success", `1|${restoredMedia}|${Number(item.assetIds?.length || 0)}`); } catch (_) {}
    setCloudMessage("Restore complete. Reloading…", "success");
    setTimeout(() => location.reload(), 300);
    return true;
  } catch (error) {
    setCloudMessage(friendlyCloudError(error), "error");
    cloudState.busy = false;
    scheduleRender();
    return false;
  }
}

async function restoreLocalRecovery() {
  const get = appearanceGetter();
  if (!get || cloudState.busy) return;
  try {
    const raw = await get(TSUKI_RECOVERY_KEY);
    if (typeof raw !== "string" || !raw) return setCloudMessage("No pre-restore recovery copy is available on this phone.");
    JSON.parse(raw);
    if (!window.confirm("Undo the last cloud restore and return to the Tsuki data that was on this phone immediately before it?")) return;
    localStorage.setItem(TSUKI_DATA_KEY, raw);
    clearGuard();
    location.reload();
  } catch (error) {
    setCloudMessage("The local recovery copy could not be read, so Tsuki left your current data unchanged.", "error");
  }
}

async function hasLocalRecovery() {
  const get = appearanceGetter();
  if (!get) return false;
  try { return Boolean(await get(TSUKI_RECOVERY_KEY)); } catch (_) { return false; }
}

async function deleteAllCloudBackups({ skipConfirm = false } = {}) {
  const user = cloudUser();
  if (!user || cloudState.busy) return false;
  if (!skipConfirm && !window.confirm("Delete every Tsuki Cloud backup for this account? Data stored on this phone will not be deleted.")) return false;

  cloudState.busy = true;
  scheduleRender();
  setCloudMessage("Deleting cloud backups…");
  try {
    await ensureFirestore();
    const snapshots = await listSnapshots(user.uid);
    for (const item of snapshots) await deleteSnapshot(user.uid, item);
    const assets = await withTimeout(cloudState.fs.getDocs(cloudState.fs.collection(cloudState.db, "tsukiCloudBackups", user.uid, "assets")));
    for (const doc of assets.docs) await deleteAsset(user.uid, { id: doc.id, ...doc.data() });
    const settings = loadCloudSettings(user.uid);
    settings.enabled = false;
    settings.lastSuccessAt = "";
    settings.lastAutoDate = "";
    saveCloudSettings(user.uid, settings);
    clearGuard(user.uid);
    try { localStorage.removeItem(cloudBaselineKey(user.uid)); } catch (_) {}
    cloudState.snapshots = [];
    setCloudMessage("Cloud backups deleted. This phone’s Tsuki data is unchanged.", "success");
    return true;
  } catch (error) {
    setCloudMessage(friendlyCloudError(error), "error");
    return false;
  } finally {
    cloudState.busy = false;
    scheduleRender();
  }
}

async function chooseKeepThisPhone() {
  const guard = cloudState.guard || readGuard();
  if (!guard) return;
  const localCount = meaningfulCount(localPayloadInfo().data);
  const confirmed = window.confirm(
    `Keep this phone’s ${localCount} tracked item${localCount === 1 ? "" : "s"} instead of restoring the protected cloud copy with ${Number(guard.recordCount || 0)}? Future backups from this phone may become the newest cloud version. Older cloud versions will remain in history until retention cleanup.`
  );
  if (!confirmed) return;
  clearGuard();
  const latest = latestSnapshot();
  if (latest) writeBaseline(cloudState.uid, latest);
  setCloudMessage("This phone is now the active local copy. Use Back up now when you’re ready to save it to Tsuki Cloud.");
  scheduleRender();
}

function formatCloudTime(value) {
  if (!value) return "Unknown time";
  try { return new Date(value).toLocaleString(); } catch (_) { return "Unknown time"; }
}

function cloudKindLabel(kind) {
  if (kind === "manual") return "Manual";
  if (kind === "initial") return "First";
  if (kind === "daily") return "Daily";
  return "Automatic";
}

function ensureCloudUI() {
  if (!document.querySelector('link[data-tsuki-cloud-style]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./firebase-backup.css";
    link.dataset.tsukiCloudStyle = "1";
    document.head.appendChild(link);
  }

  const note = document.querySelector(".firebase-auth-privacy-note");
  if (note && note.dataset.tsukiCloudCopy !== "1") {
    note.dataset.tsukiCloudCopy = "1";
    note.innerHTML = '<span>🌙</span><div><strong>Local first, cloud when you choose</strong><p>Signing in identifies your account. Your health data uploads only after you separately enable Tsuki Cloud Backup. A new phone checks for an existing backup before it is allowed to replace one.</p></div>';
  }

  const facts = document.querySelector("#firebaseSignedInView .firebase-account-facts");
  if (facts?.children?.[1] && !cloud$("firebaseCloudBackupFact")) {
    facts.children[1].innerHTML = '<small>Cloud backup</small><strong id="firebaseCloudBackupFact">Checking…</strong>';
  }

  const signedIn = cloud$("firebaseSignedInView");
  if (!signedIn || cloud$("tsukiCloudPanel")) return;
  const panel = document.createElement("section");
  panel.id = "tsukiCloudPanel";
  panel.className = "tsuki-cloud-panel";
  panel.innerHTML = `
    <div class="tsuki-cloud-head"><div><p class="eyebrow">TSUKI CLOUD</p><h3>Backup & restore</h3></div><span id="tsukiCloudStatusPill" class="tsuki-cloud-pill">Off</span></div>
    <div id="tsukiCloudGuard" class="tsuki-cloud-guard hidden">
      <span>🛡️</span><div><strong>Cloud copy protected</strong><p id="tsukiCloudGuardText">Tsuki found a backup from another device.</p></div>
      <button type="button" id="tsukiCloudGuardRestore" class="primary-button">Restore to this phone</button>
      <button type="button" id="tsukiCloudGuardKeep" class="secondary-button">Keep this phone instead</button>
    </div>
    <label class="tsuki-cloud-toggle"><span><strong>Automatic Cloud Backup</strong><small>Backs up after changes and keeps a daily safety copy when Tsuki can run.</small></span><input type="checkbox" id="tsukiCloudEnabled" aria-label="Enable automatic Tsuki Cloud Backup"></label>
    <button type="button" id="tsukiCloudBackupNow" class="primary-button full-width">Back up now</button>
    <label class="field-label" for="tsukiCloudHistory">Backup history</label>
    <select id="tsukiCloudHistory" class="input"><option value="">No cloud backups yet</option></select>
    <button type="button" id="tsukiCloudPreview" class="secondary-button full-width" disabled>Preview selected restore</button>
    <div id="tsukiCloudRestorePreview" class="tsuki-cloud-preview hidden"><div id="tsukiCloudRestorePreviewContent"></div><div class="tsuki-cloud-actions"><button type="button" id="tsukiCloudPreviewCancel" class="secondary-button">Cancel</button><button type="button" id="tsukiCloudRestoreConfirm" class="primary-button">Restore safely</button></div></div>
    <p id="tsukiCloudLast" class="muted small-text">No cloud backup has been created yet.</p>
    <button type="button" id="tsukiCloudUndoRestore" class="secondary-button full-width hidden">Undo last restore on this phone</button>
    <div id="tsukiCloudMessage" class="firebase-auth-message hidden" role="status" aria-live="polite"></div>
    <p class="tsuki-cloud-privacy">🔐 Backups are scoped to your Firebase UID and are not end-to-end encrypted. Tsuki keeps up to ${TSUKI_CLOUD_RETAINED} versioned backups. App Lock PIN stays device-only.</p>
    <button type="button" id="tsukiCloudDelete" class="text-button danger-text full-width" disabled>Delete Tsuki Cloud backups</button>`;
  const factsNode = signedIn.querySelector(".firebase-account-facts");
  factsNode?.insertAdjacentElement("afterend", panel);

  cloud$("tsukiCloudEnabled")?.addEventListener("change", toggleCloudBackup);
  cloud$("tsukiCloudBackupNow")?.addEventListener("click", () => runCloudBackup("manual"));
  cloud$("tsukiCloudPreview")?.addEventListener("click", () => showRestorePreview());
  cloud$("tsukiCloudPreviewCancel")?.addEventListener("click", hideRestorePreview);
  cloud$("tsukiCloudRestoreConfirm")?.addEventListener("click", () => restoreSelectedBackup());
  cloud$("tsukiCloudHistory")?.addEventListener("change", hideRestorePreview);
  cloud$("tsukiCloudGuardRestore")?.addEventListener("click", () => {
    const item = cloudState.snapshots.find(snapshot => snapshot.id === (cloudState.guard?.snapshotId || readGuard()?.snapshotId)) || latestSnapshot();
    if (item) { showRestorePreview(item); restoreSelectedBackup(item); }
  });
  cloud$("tsukiCloudGuardKeep")?.addEventListener("click", chooseKeepThisPhone);
  cloud$("tsukiCloudDelete")?.addEventListener("click", () => deleteAllCloudBackups());
  cloud$("tsukiCloudUndoRestore")?.addEventListener("click", restoreLocalRecovery);
}

async function renderCloudUI() {
  ensureCloudUI();
  const user = cloudUser();
  const panel = cloud$("tsukiCloudPanel");
  if (panel) panel.classList.toggle("hidden", !user);
  if (!user) return;

  const settings = loadCloudSettings(user.uid);
  const enabled = Boolean(settings.enabled);
  const toggle = cloud$("tsukiCloudEnabled");
  if (toggle) { toggle.checked = enabled; toggle.disabled = cloudState.busy; }

  const fact = cloud$("firebaseCloudBackupFact");
  if (fact) fact.textContent = cloudState.guard ? "Restore first" : enabled ? "On" : cloudState.snapshots.length ? "Backup available" : "Off";

  const pill = cloud$("tsukiCloudStatusPill");
  if (pill) {
    pill.textContent = cloudState.busy ? "Working…" : cloudState.guard ? "Protected" : enabled ? "On" : "Off";
    pill.classList.toggle("active", enabled && !cloudState.guard);
    pill.classList.toggle("protected", Boolean(cloudState.guard));
  }

  const accountText = cloud$("firebaseAccountText");
  if (accountText && window.TsukiAuth?.user) {
    const text = `${window.TsukiAuth.user.email || "Signed in"} · ${cloudState.guard ? "A cloud copy is protected for restore." : enabled ? "Tsuki Cloud Backup is on." : cloudState.snapshots.length ? "A Tsuki Cloud backup is available." : "Tracker data stays on this phone until Cloud Backup is enabled."}`;
    if (accountText.textContent !== text) accountText.textContent = text;
  }

  const guard = cloudState.guard || readGuard(user.uid);
  cloudState.guard = guard;
  const guardBox = cloud$("tsukiCloudGuard");
  if (guardBox) guardBox.classList.toggle("hidden", !guard);
  if (guard) {
    const text = cloud$("tsukiCloudGuardText");
    if (text) text.textContent = guard.reason === "empty-device-restore-first"
      ? `This phone has no tracked Tsuki history yet. Cloud has ${guard.recordCount} tracked item${guard.recordCount === 1 ? "" : "s"}${guard.createdAtMillis ? ` from ${formatCloudTime(guard.createdAtMillis)}` : ""}. Automatic uploads are paused until you restore or explicitly keep this phone.`
      : `Tsuki found an unseen cloud copy with ${guard.recordCount} tracked item${guard.recordCount === 1 ? "" : "s"}. Automatic uploads are paused so this phone cannot overwrite it by accident.`;
  }

  const select = cloud$("tsukiCloudHistory");
  if (select) {
    const selected = select.value;
    select.innerHTML = cloudState.snapshots.length
      ? cloudState.snapshots.slice(0, TSUKI_CLOUD_RETAINED).map(item => `<option value="${item.id}">${cloudKindLabel(item.kind)} · ${formatCloudTime(item.createdAtMillis)} · ${Number(item.recordCount ?? item.summary?.recordCount ?? 0)} items</option>`).join("")
      : '<option value="">No cloud backups yet</option>';
    if (selected && cloudState.snapshots.some(item => item.id === selected)) select.value = selected;
  }

  const latest = latestSnapshot();
  const last = cloud$("tsukiCloudLast");
  if (last) last.textContent = latest
    ? `Latest cloud backup: ${formatCloudTime(latest.createdAtMillis)} · ${Number(latest.recordCount ?? latest.summary?.recordCount ?? 0)} tracked items${Number(latest.mediaMissing || 0) ? ` · ${Number(latest.mediaMissing)} media not included` : ""}`
    : "No cloud backup has been created yet.";

  ["tsukiCloudBackupNow","tsukiCloudPreview","tsukiCloudDelete","tsukiCloudRestoreConfirm","tsukiCloudGuardRestore","tsukiCloudGuardKeep"].forEach(id => {
    const node = cloud$(id);
    if (node) node.disabled = cloudState.busy || ((id === "tsukiCloudPreview" || id === "tsukiCloudDelete") && !cloudState.snapshots.length);
  });

  const undo = cloud$("tsukiCloudUndoRestore");
  if (undo) undo.classList.toggle("hidden", !(await hasLocalRecovery()));
}

function scheduleRender() {
  if (cloudState.renderQueued) return;
  cloudState.renderQueued = true;
  requestAnimationFrame(() => {
    cloudState.renderQueued = false;
    renderCloudUI().catch(() => {});
  });
}

async function toggleCloudBackup(event) {
  const user = cloudUser();
  if (!user) return;
  cloudState.uid = user.uid;
  const settings = loadCloudSettings(user.uid);
  if (event.target.checked) {
    if (!(await ensureConsent(settings))) {
      event.target.checked = false;
      settings.enabled = false;
      saveCloudSettings(user.uid, settings);
      scheduleRender();
      return;
    }
    settings.enabled = true;
    saveCloudSettings(user.uid, settings);
    if (!cloudState.inspectionComplete) await inspectCloud("enable");
    if (cloudState.guard) {
      setCloudMessage("Automatic backup is on but paused until you resolve the protected cloud copy.");
    } else {
      await runCloudBackup("initial");
    }
  } else {
    settings.enabled = false;
    saveCloudSettings(user.uid, settings);
    clearTimeout(cloudState.autoTimer);
    clearTimeout(cloudState.dailyTimer);
    setCloudMessage("Automatic Cloud Backup is off. Existing cloud versions are kept until you delete them.");
  }
  scheduleDailyBackup();
  scheduleRender();
}

function queueAutomaticBackup(reason = "change") {
  const user = cloudUser();
  if (!user) return;
  cloudState.dirty = true;
  const settings = loadCloudSettings(user.uid);
  if (!settings.enabled || cloudState.guard || !cloudState.inspectionComplete) return;
  clearTimeout(cloudState.autoTimer);
  cloudState.autoTimer = setTimeout(() => {
    if (!document.hidden && navigator.onLine && Date.now() >= cloudState.retryAfter) runCloudBackup("auto", { reason });
  }, TSUKI_CLOUD_AUTO_DEBOUNCE_MS);
}

function scheduleDailyBackup() {
  clearTimeout(cloudState.dailyTimer);
  cloudState.dailyTimer = null;
  const user = cloudUser();
  if (!user) return;
  const settings = loadCloudSettings(user.uid);
  if (!settings.enabled || cloudState.guard) return;
  const now = new Date();
  if (afterBackupHour(now) && settings.lastAutoDate !== localDayKey(now)) {
    cloudState.dailyTimer = setTimeout(() => runCloudBackup("daily"), 1400);
    return;
  }
  cloudState.dailyTimer = setTimeout(() => runCloudBackup("daily"), Math.max(1000, nextBackupTime(now).getTime() - now.getTime()));
}

function installSaveDataHook() {
  if (window.__tsukiCloudSaveHookInstalled || typeof window.saveData !== "function") return;
  window.__tsukiCloudSaveHookInstalled = true;
  const original = window.saveData;
  window.saveData = function tsukiCloudAwareSaveData(...args) {
    const result = original.apply(this, args);
    queueAutomaticBackup("saveData");
    return result;
  };
}

async function handleAuthChange() {
  const user = cloudUser();
  clearTimeout(cloudState.autoTimer);
  clearTimeout(cloudState.dailyTimer);
  cloudState.pendingRestoreId = "";
  cloudState.inspectionComplete = false;
  cloudState.snapshots = [];
  cloudState.guard = null;

  if (!user) {
    cloudState.uid = "";
    scheduleRender();
    return;
  }

  cloudState.uid = user.uid;
  cloudState.guard = readGuard(user.uid);
  scheduleRender();
  await inspectCloud("auth-change");
  scheduleDailyBackup();
}

function bindCloudLifecycle() {
  window.addEventListener("tsuki-auth-changed", () => handleAuthChange());
  window.addEventListener("online", () => {
    if (!cloudUser()) return;
    inspectCloud("online").then(() => {
      scheduleDailyBackup();
      if (cloudState.dirty) queueAutomaticBackup("online");
    });
  });
  window.addEventListener("focus", () => {
    if (cloudUser()) inspectCloud("focus").then(scheduleDailyBackup);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && cloudUser()) inspectCloud("resume").then(scheduleDailyBackup);
  });

  document.addEventListener("click", event => {
    const target = event.target?.closest?.("#openFirebaseAccount,#drawerAccountButton");
    if (target) setTimeout(scheduleRender, 0);
  }, true);

  document.addEventListener("click", async event => {
    const button = event.target?.closest?.("#firebaseDeleteAccount");
    if (!button || cloudState.deleteAccountBypass || !cloudUser() || !cloudState.snapshots.length) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const confirmed = window.confirm("This account still has Tsuki Cloud backups. Delete those cloud backups first, then delete the sign-in account? Your data on this phone will stay here.");
    if (!confirmed) return;
    if (!(await deleteAllCloudBackups({ skipConfirm: true }))) return;
    cloudState.deleteAccountBypass = true;
    queueMicrotask(() => button.click());
  }, true);
}

function showRestoreSuccessIfNeeded() {
  try {
    const marker = sessionStorage.getItem("tsuki-cloud-restore-success");
    if (!marker) return;
    sessionStorage.removeItem("tsuki-cloud-restore-success");
    const [, restored, total] = marker.split("|");
    setTimeout(() => {
      if (typeof window.showToast === "function") window.showToast(Number(total) ? `Tsuki restored from cloud · ${restored}/${total} media files 🌙` : "Tsuki restored from cloud 🌙");
    }, 450);
  } catch (_) {}
}

window.TsukiCloudBackup = {
  get enabled() { return loadCloudSettings(cloudState.uid).enabled; },
  get guard() { return cloudState.guard || readGuard(); },
  get snapshots() { return cloudState.snapshots.slice(); },
  backupNow: () => runCloudBackup("manual"),
  refresh: () => inspectCloud("manual-refresh"),
  restoreLatest: () => restoreSelectedBackup(latestSnapshot()),
  test: {
    meaningfulCount,
    backupSummary,
    isDestructiveDrop,
    chunkBytes,
    sha256Hex,
    collectAssetKeys,
    localDayKey,
    nextBackupTime
  }
};

ensureCloudUI();
installSaveDataHook();
bindCloudLifecycle();
showRestoreSuccessIfNeeded();
scheduleRender();
setTimeout(() => {
  installSaveDataHook();
  if (cloudUser()) handleAuthChange();
}, 0);
