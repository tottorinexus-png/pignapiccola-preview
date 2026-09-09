(() => {
  const SUPABASE_URL = "https://bvsisahifvktcksjwwpr.supabase.co";
  const SUPABASE_KEY = "sb_publishable_EjblPJY4byw_eB_0EGfikw_7tAp3H5Z";
  const FN = `${SUPABASE_URL}/functions/v1`;
  const TOKEN_KEY = "pigna_admin_token";
  const EXPIRY_KEY = "pigna_admin_expiry";

  const $ = (id) => document.getElementById(id);
  const panels = [$("loadingPanel"), $("setupPanel"), $("loginPanel"), $("dashboardPanel")];
  let selectedFile = null;
  let previewUrl = null;

  const show = (panel) => panels.forEach((p) => { if (p) p.hidden = p !== panel; });
  const setMessage = (el, text = "", success = false) => {
    el.textContent = text;
    el.classList.toggle("is-success", success);
  };
  const headers = (extra = {}) => ({ apikey: SUPABASE_KEY, ...extra });

  const session = () => {
    const token = localStorage.getItem(TOKEN_KEY) || "";
    const expiry = localStorage.getItem(EXPIRY_KEY) || "";
    if (!token || !expiry || Date.parse(expiry) <= Date.now()) {
      localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(EXPIRY_KEY);
      return null;
    }
    return { token, expiry };
  };
  const saveSession = (token, expiry) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EXPIRY_KEY, expiry);
  };
  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  };

  const jstParts = (date) => Object.fromEntries(new Intl.DateTimeFormat("ja-JP", {
    timeZone:"Asia/Tokyo", year:"numeric", month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit", hour12:false
  }).formatToParts(date).map((p) => [p.type,p.value]));
  const formatTime = (iso) => {
    if (!iso) return "まだ更新されていません";
    const d = new Date(iso); if (Number.isNaN(d.getTime())) return "更新日時不明";
    const now = jstParts(new Date()), then = jstParts(d), time = `${then.hour}:${then.minute}`;
    if (now.year===then.year && now.month===then.month && now.day===then.day) return `本日 ${time} 更新`;
    return `${Number(then.month)}月${Number(then.day)}日 ${time} 更新`;
  };
  const publicImageUrl = (path, v="") => `${SUPABASE_URL}/storage/v1/object/public/blackboard/${path.split("/").map(encodeURIComponent).join("/")}${v ? `?v=${encodeURIComponent(v)}` : ""}`;

  async function getAdminStatus() {
    const r = await fetch(`${FN}/pigna-admin-status`, { headers: headers(), cache:"no-store" });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "状態を確認できませんでした。");
    return data;
  }

  async function getBlackboardState() {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/blackboard_state?id=eq.1&select=image_path,updated_at`, { headers: headers(), cache:"no-store" });
    if (!r.ok) throw new Error("黒板情報を取得できませんでした。");
    const rows = await r.json(); return rows?.[0] || null;
  }

  async function refreshCurrent() {
    const state = await getBlackboardState();
    $("currentUpdated").textContent = formatTime(state?.updated_at);
    if (state?.image_path) {
      $("currentImage").src = publicImageUrl(state.image_path, state.updated_at || Date.now());
      $("currentImage").hidden = false;
      $("currentEmpty").hidden = true;
    } else {
      $("currentImage").hidden = true;
      $("currentEmpty").hidden = false;
    }
  }

  async function start() {
    try {
      const status = await getAdminStatus();
      if (!status.configured) return show($("setupPanel"));
      if (session()) {
        show($("dashboardPanel"));
        try { await refreshCurrent(); } catch (e) { setMessage($("uploadMessage"), e.message); }
        return;
      }
      show($("loginPanel"));
    } catch (e) {
      $("loadingPanel").innerHTML = `<p class="admin-message">${e.message}</p>`;
    }
  }

  $("setupForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const pin = $("setupPin").value.trim();
    setMessage($("setupMessage"), "");
    if (!/^\d{6}$/.test(pin)) return setMessage($("setupMessage"), "6桁の数字を入力してください。");
    const button = e.currentTarget.querySelector("button"); button.disabled = true;
    try {
      const r = await fetch(`${FN}/pigna-admin-setup-pin`, { method:"POST", headers:headers({"Content-Type":"application/json"}), body:JSON.stringify({pin}) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "設定できませんでした。");
      setMessage($("setupMessage"), "設定しました。ログイン画面へ移動します。", true);
      $("setupPin").value = "";
      setTimeout(() => show($("loginPanel")), 650);
    } catch (err) { setMessage($("setupMessage"), err.message); }
    finally { button.disabled = false; }
  });

  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const pin = $("loginPin").value.trim();
    setMessage($("loginMessage"), "");
    if (!/^\d{6}$/.test(pin)) return setMessage($("loginMessage"), "6桁の数字を入力してください。");
    const button = e.currentTarget.querySelector("button"); button.disabled = true;
    try {
      const r = await fetch(`${FN}/pigna-admin-login`, { method:"POST", headers:headers({"Content-Type":"application/json"}), body:JSON.stringify({pin}) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "ログインできませんでした。");
      saveSession(data.token, data.expires_at);
      $("loginPin").value = "";
      show($("dashboardPanel"));
      await refreshCurrent();
    } catch (err) { setMessage($("loginMessage"), err.message); }
    finally { button.disabled = false; }
  });

  $("logoutButton").addEventListener("click", () => { clearSession(); show($("loginPanel")); });

  const revokePreview = () => { if (previewUrl) URL.revokeObjectURL(previewUrl); previewUrl = null; };
  const clearSelected = () => {
    revokePreview(); selectedFile = null; $("blackboardFile").value = ""; $("uploadPreview").hidden = true; $("publishButton").disabled = true;
  };
  $("clearPreview").addEventListener("click", clearSelected);

  const loadImageElement = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("この写真を読み込めませんでした。別の写真を選んでください。")); };
    img.src = url;
  });

  async function optimizeImage(file) {
    const img = await loadImageElement(file);
    const maxSide = 2000;
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
    if (!blob) throw new Error("写真を変換できませんでした。");
    return new File([blob], "blackboard.jpg", { type: "image/jpeg" });
  }

  $("blackboardFile").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    setMessage($("uploadMessage"), "");
    if (!file) return clearSelected();
    if (file.size > 30 * 1024 * 1024) { clearSelected(); return setMessage($("uploadMessage"), "写真のサイズが大きすぎます。別の写真を選んでください。"); }
    try {
      $("publishButton").disabled = true;
      setMessage($("uploadMessage"), "写真を準備しています…");
      selectedFile = await optimizeImage(file);
      revokePreview(); previewUrl = URL.createObjectURL(selectedFile); $("previewImage").src = previewUrl; $("uploadPreview").hidden = false; $("publishButton").disabled = false;
      setMessage($("uploadMessage"), "");
    } catch (err) {
      clearSelected(); setMessage($("uploadMessage"), err.message || "写真を準備できませんでした。");
    }
  });

  $("publishButton").addEventListener("click", async () => {
    if (!selectedFile) return;
    const s = session(); if (!s) { clearSession(); return show($("loginPanel")); }
    const button = $("publishButton"); button.disabled = true; button.classList.add("is-loading"); button.textContent = "掲載中…"; setMessage($("uploadMessage"), "");
    try {
      const form = new FormData(); form.append("file", selectedFile, selectedFile.name || "blackboard.jpg");
      const r = await fetch(`${FN}/pigna-blackboard-upload`, { method:"POST", headers:headers({Authorization:`Bearer ${s.token}`}), body:form });
      const data = await r.json().catch(() => ({}));
      if (r.status === 401) { clearSession(); show($("loginPanel")); throw new Error("もう一度ログインしてください。"); }
      if (!r.ok) throw new Error(data.error || "更新できませんでした。");
      setMessage($("uploadMessage"), "ホームページを更新しました。", true);
      clearSelected(); await refreshCurrent();
    } catch (err) { setMessage($("uploadMessage"), err.message); }
    finally { button.classList.remove("is-loading"); button.textContent = "ホームページに掲載する"; button.disabled = !selectedFile; }
  });

  $("changePinForm").addEventListener("submit", async (e) => {
    e.preventDefault(); const newPin = $("newPin").value.trim(); setMessage($("changePinMessage"), "");
    if (!/^\d{6}$/.test(newPin)) return setMessage($("changePinMessage"), "6桁の数字を入力してください。");
    const s = session(); if (!s) return show($("loginPanel"));
    const button = e.currentTarget.querySelector("button"); button.disabled = true;
    try {
      const r = await fetch(`${FN}/pigna-admin-change-pin`, { method:"POST", headers:headers({"Content-Type":"application/json",Authorization:`Bearer ${s.token}`}), body:JSON.stringify({new_pin:newPin}) });
      const data = await r.json().catch(() => ({})); if (!r.ok) throw new Error(data.error || "変更できませんでした。");
      clearSession(); $("newPin").value = ""; setMessage($("changePinMessage"), "変更しました。もう一度ログインしてください。", true); setTimeout(() => show($("loginPanel")), 800);
    } catch (err) { setMessage($("changePinMessage"), err.message); }
    finally { button.disabled = false; }
  });

  start();
})();
