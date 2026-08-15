/* ============================================================
   TSUKI — OPTIONAL FIREBASE AUTHENTICATION
   Identity only. Health data remains local in this release.
   ============================================================ */

const FIREBASE_SDK_VERSION = "12.16.0";
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC6BhfE69LfZ9PVdbwImdYypm1PzZOBUXs",
  authDomain: "tsuki-57049.firebaseapp.com",
  projectId: "tsuki-57049",
  storageBucket: "tsuki-57049.firebasestorage.app",
  messagingSenderId: "885342825201",
  appId: "1:885342825201:web:0808d3ae5a7b70d136d750"
};

const authState = {
  app: null,
  auth: null,
  modules: null,
  user: null,
  sdkReady: false,
  serviceAvailable: false,
  loading: false,
  mode: "signin",
  persistence: "local"
};

const byId = id => document.getElementById(id);

function setHidden(id, hidden) {
  byId(id)?.classList.toggle("hidden", Boolean(hidden));
}

function authMessage(text = "", kind = "") {
  const node = byId("firebaseAuthMessage");
  if (!node) return;
  node.textContent = text;
  node.className = `firebase-auth-message${kind ? ` ${kind}` : ""}${text ? "" : " hidden"}`;
}

function friendlyAuthError(error) {
  const code = String(error?.code || "");
  const map = {
    "auth/invalid-email": "Enter a valid email address.",
    "auth/missing-password": "Enter your password.",
    "auth/weak-password": "Choose a stronger password. Use at least 6 characters.",
    "auth/email-already-in-use": "An account already uses this email. Try signing in instead.",
    "auth/invalid-credential": "That email or password didn’t match.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/network-request-failed": "Account services could not reach the internet. Your local Tsuki data is still available.",
    "auth/popup-closed-by-user": "Google sign-in was closed before it finished.",
    "auth/popup-blocked": "Your browser blocked the Google sign-in window. Try again or use email and password.",
    "auth/cancelled-popup-request": "Another sign-in window is already open.",
    "auth/operation-not-allowed": "This sign-in method is not enabled in Firebase yet.",
    "auth/unauthorized-domain": "This website is not authorized in Firebase Authentication settings.",
    "auth/requires-recent-login": "For security, sign out and sign in again before deleting the account."
  };
  return map[code] || "Account sign-in didn’t finish. Please try again.";
}

function openAuthModal() {
  const modal = byId("firebaseAuthModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  renderAuthUI();
  requestAnimationFrame(() => {
    if (authState.user) byId("firebaseSignOut")?.focus();
    else if (authState.serviceAvailable) byId("firebaseGoogleButton")?.focus();
    else byId("retryFirebaseAuth")?.focus();
  });
}

function closeAuthModal() {
  const modal = byId("firebaseAuthModal");
  modal?.classList.add("hidden");
  modal?.setAttribute("aria-hidden", "true");
  authMessage();
}

function setAuthMode(mode) {
  authState.mode = mode === "create" ? "create" : "signin";
  const create = authState.mode === "create";
  byId("authSignInTab")?.classList.toggle("active", !create);
  byId("authCreateTab")?.classList.toggle("active", create);
  byId("authSignInTab")?.setAttribute("aria-selected", String(!create));
  byId("authCreateTab")?.setAttribute("aria-selected", String(create));
  setHidden("firebaseConfirmPasswordWrap", !create);
  const password = byId("firebaseAuthPassword");
  const confirm = byId("firebaseAuthPasswordConfirm");
  if (password) password.autocomplete = create ? "new-password" : "current-password";
  if (confirm) confirm.required = create;
  const submit = byId("firebaseAuthSubmit");
  if (submit) submit.textContent = create ? "Create account" : "Sign in";
  const title = byId("firebaseAuthTitle");
  if (title && !authState.user) title.textContent = create ? "Create your Tsuki account" : "Sign in to Tsuki";
  setHidden("firebaseForgotPassword", create);
  authMessage();
}

function renderAccountAvatar(user) {
  const holder = byId("firebaseUserAvatar");
  if (!holder) return;
  holder.textContent = "🌙";
  if (user?.photoURL && /^https:\/\//i.test(user.photoURL)) {
    const image = document.createElement("img");
    image.src = user.photoURL;
    image.alt = "";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => { holder.textContent = "🌙"; }, { once: true });
    holder.textContent = "";
    holder.appendChild(image);
  }
}

function renderAuthUI() {
  const loading = authState.loading && !authState.sdkReady;
  const unavailable = !loading && !authState.serviceAvailable;
  const signedIn = Boolean(authState.user) && authState.serviceAvailable;

  setHidden("firebaseAuthLoading", !loading);
  setHidden("firebaseAuthUnavailable", !unavailable);
  setHidden("firebaseSignedOutView", loading || unavailable || signedIn);
  setHidden("firebaseSignedInView", !signedIn);

  const cardTitle = byId("firebaseAccountTitle");
  const cardText = byId("firebaseAccountText");
  const pill = byId("firebaseAccountStatusPill");
  const cardButton = byId("openFirebaseAccount");
  const drawerStatus = byId("drawerAccountStatus");

  if (signedIn) {
    const user = authState.user;
    const display = user.displayName || user.email || "Tsuki account";
    if (cardTitle) cardTitle.textContent = display;
    if (cardText) cardText.textContent = `${user.email || "Signed in"} · Your tracker stays local unless you explicitly enable Cloud Backup below.`;
    if (pill) pill.textContent = "Signed in";
    if (cardButton) cardButton.textContent = "Manage account";
    if (drawerStatus) drawerStatus.textContent = user.email || "Signed in";
    if (byId("firebaseUserName")) byId("firebaseUserName").textContent = display;
    if (byId("firebaseUserEmail")) byId("firebaseUserEmail").textContent = user.email || "";
    if (byId("firebaseEmailStatus")) byId("firebaseEmailStatus").textContent = user.emailVerified ? "Verified" : "Not verified";
    if (byId("firebaseAuthTitle")) byId("firebaseAuthTitle").textContent = "Your Tsuki account";
    renderAccountAvatar(user);
  } else {
    if (cardTitle) cardTitle.textContent = "Optional Tsuki account";
    if (cardText) cardText.textContent = authState.serviceAvailable
      ? "Sign in if you want an account identity. Your tracker stays local unless you explicitly enable Cloud Backup after signing in."
      : "Tsuki is still fully usable locally. Account services need an internet connection when you want to sign in.";
    if (pill) pill.textContent = "Local only";
    if (cardButton) cardButton.textContent = authState.serviceAvailable ? "Sign in or create account" : "Account options";
    if (drawerStatus) drawerStatus.textContent = authState.serviceAvailable ? "Optional sign-in" : "Local use available";
    setAuthMode(authState.mode);
  }
}

function setBusy(busy) {
  ["firebaseAuthSubmit", "firebaseGoogleButton", "firebaseForgotPassword", "firebaseSignOut", "firebaseDeleteAccount"].forEach(id => {
    const node = byId(id);
    if (node) node.disabled = Boolean(busy);
  });
}

async function loadFirebaseAuth() {
  if (authState.loading || authState.serviceAvailable) return;
  authState.loading = true;
  renderAuthUI();

  try {
    const [appModule, authModule] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-auth.js`)
    ]);

    const firebaseApp = appModule.initializeApp(FIREBASE_CONFIG);
    const auth = authModule.getAuth(firebaseApp);
    try {
      await authModule.setPersistence(auth, authModule.browserLocalPersistence);
      authState.persistence = "local";
    } catch (_) {
      try {
        await authModule.setPersistence(auth, authModule.browserSessionPersistence);
        authState.persistence = "session";
      } catch (_) {
        authState.persistence = "memory";
      }
    }

    authState.app = firebaseApp;
    authState.auth = auth;
    authState.modules = authModule;
    authState.sdkReady = true;
    authState.serviceAvailable = true;
    authState.loading = false;

    authModule.onAuthStateChanged(auth, user => {
      authState.user = user || null;
      renderAuthUI();
      window.dispatchEvent(new CustomEvent("tsuki-auth-changed", { detail: { signedIn: Boolean(user), uid: user?.uid || null } }));
    });
  } catch (error) {
    authState.loading = false;
    authState.sdkReady = false;
    authState.serviceAvailable = false;
    const message = byId("firebaseAuthUnavailableText");
    if (message) message.textContent = navigator.onLine
      ? "Firebase account services could not load. Tsuki still works locally; you can retry without risking your saved entries."
      : "You’re offline. Tsuki still works locally; connect to the internet when you want to sign in.";
    console.warn("Tsuki account services unavailable:", error?.message || error);
    renderAuthUI();
  }
}

async function handleEmailSubmit(event) {
  event.preventDefault();
  if (!authState.auth || !authState.modules) return;
  const email = byId("firebaseAuthEmail")?.value.trim() || "";
  const password = byId("firebaseAuthPassword")?.value || "";
  const confirm = byId("firebaseAuthPasswordConfirm")?.value || "";

  if (!email) return authMessage("Enter your email address.", "error");
  if (password.length < 6) return authMessage("Use at least 6 characters for your password.", "error");
  if (authState.mode === "create" && password !== confirm) return authMessage("The two passwords don’t match.", "error");

  setBusy(true);
  authMessage(authState.mode === "create" ? "Creating your account…" : "Signing in…");
  try {
    if (authState.mode === "create") {
      const credential = await authState.modules.createUserWithEmailAndPassword(authState.auth, email, password);
      try {
        await authState.modules.sendEmailVerification(credential.user);
        authMessage("Account created. We sent a verification email. Your health data is still local to this device.", "success");
      } catch (_) {
        authMessage("Account created. Your health data is still local to this device.", "success");
      }
    } else {
      await authState.modules.signInWithEmailAndPassword(authState.auth, email, password);
      authMessage();
    }
  } catch (error) {
    authMessage(friendlyAuthError(error), "error");
  } finally {
    setBusy(false);
  }
}

async function handleGoogleSignIn() {
  if (!authState.auth || !authState.modules) return;
  setBusy(true);
  authMessage("Opening Google sign-in…");
  try {
    const provider = new authState.modules.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await authState.modules.signInWithPopup(authState.auth, provider);
    authMessage();
  } catch (error) {
    authMessage(friendlyAuthError(error), "error");
  } finally {
    setBusy(false);
  }
}

async function handlePasswordReset() {
  if (!authState.auth || !authState.modules) return;
  const email = byId("firebaseAuthEmail")?.value.trim() || "";
  if (!email) {
    byId("firebaseAuthEmail")?.focus();
    return authMessage("Enter your email first, then tap Forgot password.", "error");
  }
  setBusy(true);
  try {
    await authState.modules.sendPasswordResetEmail(authState.auth, email);
    authMessage("Password reset email sent. Check your inbox.", "success");
  } catch (error) {
    authMessage(friendlyAuthError(error), "error");
  } finally {
    setBusy(false);
  }
}

async function handleSignOut() {
  if (!authState.auth || !authState.modules) return;
  setBusy(true);
  try {
    await authState.modules.signOut(authState.auth);
    setAuthMode("signin");
    authMessage("Signed out. Your local Tsuki entries are still on this device.", "success");
  } catch (error) {
    authMessage(friendlyAuthError(error), "error");
  } finally {
    setBusy(false);
  }
}

async function handleDeleteAccount() {
  if (!authState.user || !authState.modules) return;
  const confirmed = window.confirm("Delete your Tsuki sign-in account? This does not delete the local health data stored on this device.");
  if (!confirmed) return;
  setBusy(true);
  try {
    await authState.modules.deleteUser(authState.user);
    closeAuthModal();
  } catch (error) {
    authMessage(friendlyAuthError(error), "error");
  } finally {
    setBusy(false);
  }
}

function bindAuthUI() {
  byId("openFirebaseAccount")?.addEventListener("click", openAuthModal);
  byId("drawerAccountButton")?.addEventListener("click", openAuthModal);
  byId("closeFirebaseAuth")?.addEventListener("click", closeAuthModal);
  byId("continueWithoutFirebase")?.addEventListener("click", closeAuthModal);
  byId("firebaseAuthModal")?.addEventListener("click", event => {
    if (event.target === byId("firebaseAuthModal")) closeAuthModal();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !byId("firebaseAuthModal")?.classList.contains("hidden")) closeAuthModal();
  });
  byId("authSignInTab")?.addEventListener("click", () => setAuthMode("signin"));
  byId("authCreateTab")?.addEventListener("click", () => setAuthMode("create"));
  byId("firebaseAuthForm")?.addEventListener("submit", handleEmailSubmit);
  byId("firebaseGoogleButton")?.addEventListener("click", handleGoogleSignIn);
  byId("firebaseForgotPassword")?.addEventListener("click", handlePasswordReset);
  byId("firebaseSignOut")?.addEventListener("click", handleSignOut);
  byId("firebaseDeleteAccount")?.addEventListener("click", handleDeleteAccount);
  byId("retryFirebaseAuth")?.addEventListener("click", loadFirebaseAuth);
  window.addEventListener("online", () => {
    if (!authState.serviceAvailable) loadFirebaseAuth();
  });
}

window.TsukiAuth = {
  get app() { return authState.app; },
  get sdkReady() { return authState.sdkReady; },
  get serviceAvailable() { return authState.serviceAvailable; },
  get user() { return authState.user; },
  get persistence() { return authState.persistence; },
  open: openAuthModal,
  close: closeAuthModal,
  retry: loadFirebaseAuth
};

function loadAdaptiveIntelligence() {
  if (document.querySelector('script[data-tsuki-adaptive]')) return;
  const script = document.createElement("script");
  script.src = "./adaptive-intelligence.js";
  script.dataset.tsukiAdaptive = "1";
  script.async = false;
  script.addEventListener("error", () => console.warn("Tsuki adaptive intelligence could not load. Core local tracking remains available."), { once: true });
  document.head.appendChild(script);
}

bindAuthUI();
renderAuthUI();
loadAdaptiveIntelligence();
loadFirebaseAuth();
