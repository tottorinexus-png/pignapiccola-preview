(() => {
  const SUPABASE_URL = "https://bvsisahifvktcksjwwpr.supabase.co";
  const SUPABASE_KEY = "sb_publishable_EjblPJY4byw_eB_0EGfikw_7tAp3H5Z";

  const image = document.querySelector("[data-blackboard-image]");
  const placeholder = document.querySelector("[data-blackboard-placeholder]");
  const updated = document.querySelector("[data-blackboard-updated]");
  if (!image || !placeholder || !updated) return;

  const jstParts = (date) => {
    const parts = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
    return Object.fromEntries(parts.map((p) => [p.type, p.value]));
  };

  const formatUpdatedAt = (iso) => {
    if (!iso) return "まだ更新されていません";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "更新日時不明";
    const now = jstParts(new Date());
    const then = jstParts(d);
    const sameDay = now.year === then.year && now.month === then.month && now.day === then.day;
    const time = `${then.hour}:${then.minute}`;
    if (sameDay) return `本日 ${time} 更新`;
    if (now.year === then.year) return `${Number(then.month)}月${Number(then.day)}日 ${time} 更新`;
    return `${then.year}年${Number(then.month)}月${Number(then.day)}日 ${time} 更新`;
  };

  const publicImageUrl = (path, version) => {
    const encoded = path.split("/").map(encodeURIComponent).join("/");
    const v = version ? `?v=${encodeURIComponent(version)}` : "";
    return `${SUPABASE_URL}/storage/v1/object/public/blackboard/${encoded}${v}`;
  };

  async function loadBlackboard() {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/blackboard_state?id=eq.1&select=image_path,updated_at`,
        { headers: { apikey: SUPABASE_KEY }, cache: "no-store" }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rows = await response.json();
      const state = rows?.[0];

      if (!state?.image_path) {
        updated.textContent = "まだ更新されていません";
        return;
      }

      image.addEventListener("load", () => {
        image.hidden = false;
        placeholder.hidden = true;
      }, { once: true });
      image.src = publicImageUrl(state.image_path, state.updated_at || Date.now());
      updated.textContent = formatUpdatedAt(state.updated_at);
    } catch (error) {
      console.error("Blackboard load failed", error);
      updated.textContent = "更新情報を取得できませんでした";
      placeholder.querySelector("p").textContent = "黒板メニューを読み込めませんでした。時間をおいて再度ご確認ください。";
    }
  }

  loadBlackboard();
})();
