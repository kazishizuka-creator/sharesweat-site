/* ============================================================
   DONUT Dojo — 共通UIロジック (dojo/assets/dojo.js)
   ・日英切替（既存サイトと同じ localStorage キー 'ss_lang' を共有）
   ・ログアウト配線
   ・表示用の小さなユーティリティ（escape / 時刻 / 簡易Markdown）
   ============================================================ */
import { auth, signOut } from "./firebase-init.js";

/* ---- language（既存 assets/app.js と同じ挙動）---- */
function applyLang(lang){
  if(lang === "en") document.body.classList.add("lang-en");
  else document.body.classList.remove("lang-en");
  document.querySelectorAll(".lang").forEach(b => {
    b.textContent = (lang === "en") ? "JA / 日本語" : "EN / 日本語";
  });
  try{ localStorage.setItem("ss_lang", lang); }catch(e){}
}
export function initLang(){
  let saved = null;
  try{ saved = localStorage.getItem("ss_lang"); }catch(e){}
  let lang = saved;
  if(!lang){
    const n = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    lang = n.indexOf("ja") === 0 ? "ja" : "en";
  }
  applyLang(lang);
  document.querySelectorAll(".lang").forEach(b => b.addEventListener("click", () => {
    applyLang(document.body.classList.contains("lang-en") ? "ja" : "en");
  }));
}

/* ---- logout（[data-logout] を持つ要素すべてに配線）---- */
export function initLogout(){
  document.querySelectorAll("[data-logout]").forEach(b => b.addEventListener("click", async () => {
    try{ await signOut(auth); }catch(e){ console.error(e); }
    location.replace("index.html");
  }));
}

/* ---- utils ---- */
export function escapeHtml(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => (
    {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]
  ));
}

// Firestore Timestamp | Date | null を読みやすい文字列に
export function fmtTime(ts){
  let d;
  if(ts && typeof ts.toDate === "function") d = ts.toDate();
  else if(ts instanceof Date) d = ts;
  else return ""; // serverTimestamp 確定前（pending write）は空
  const lang = document.body.classList.contains("lang-en") ? "en-US" : "ja-JP";
  return d.toLocaleString(lang, { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" });
}

// createdAt 降順（新着が先頭）。pending write（null）は最新扱い。
export function byCreatedDesc(a, b){
  return msec(b.createdAt) - msec(a.createdAt);
}
// createdAt 昇順（チャット用）。pending write は末尾。
export function byCreatedAsc(a, b){
  return msec(a.createdAt) - msec(b.createdAt);
}
export function byOrder(a, b){
  return (a.order ?? 0) - (b.order ?? 0);
}
function msec(ts){
  if(ts && typeof ts.toDate === "function") return ts.toDate().getTime();
  if(ts instanceof Date) return ts.getTime();
  return Date.now(); // 未確定は「今」
}

/* ---- 簡易Markdown（adminが書く posts.body 用。先にHTMLエスケープしてから整形）----
   対応: # 見出し / **太字** / *斜体* / `code` / [text](url) / - 箇条書き / 段落 */
export function renderMarkdown(src){
  let s = escapeHtml(src);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
                '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const lines = s.split(/\r?\n/);
  let html = "", inList = false;
  const closeList = () => { if(inList){ html += "</ul>"; inList = false; } };
  for(const line of lines){
    const h  = line.match(/^(#{1,4})\s+(.*)$/);
    const li = line.match(/^\s*[-*]\s+(.*)$/);
    if(h){ closeList(); const lvl = Math.min(h[1].length + 1, 4); html += `<h${lvl}>${h[2]}</h${lvl}>`; continue; }
    if(li){ if(!inList){ html += "<ul>"; inList = true; } html += `<li>${li[1]}</li>`; continue; }
    closeList();
    if(line.trim() !== "") html += `<p>${line}</p>`;
  }
  closeList();
  return html;
}

// ロールchip（複数）をHTML文字列で
export function roleChips(roles){
  if(!Array.isArray(roles) || roles.length === 0)
    return '<span class="chip">no role</span>';
  return roles.map(r =>
    `<span class="chip ${r === "admin" ? "admin" : ""}">${escapeHtml(r)}</span>`
  ).join(" ");
}

// ※ initLang() / initLogout() は各ページが1回だけ明示的に呼ぶ（二重バインド防止のため
//   ここでは DOMContentLoaded での自動実行はしない）。
