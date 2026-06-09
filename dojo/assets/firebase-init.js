/* ============================================================
   DONUT Dojo — Firebase 初期化 & 共通の認証ヘルパー
   (dojo/assets/firebase-init.js)

   ・CDN版の modular SDK を使用（npm / バンドラは使わない）。
   ・SDK のバージョンと firebaseConfig はこの1ファイルに集約し、
     各ページは ./assets/firebase-init.js から import する。
   ・firebaseConfig は公開前提の値（apiKey 等）。秘密鍵ではない。
   ============================================================ */
import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
  signInWithEmailAndPassword, signOut, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc,
  getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDacCC2Bo9FLGciTbAWnKGh0zRs-Iwo0Fw",
  authDomain: "donut-dojo.firebaseapp.com",
  projectId: "donut-dojo",
  storageBucket: "donut-dojo.firebasestorage.app",
  messagingSenderId: "747852976336",
  appId: "1:747852976336:web:263fe9bc2431adcce70ed5"
  // measurementId / getAnalytics は使わない
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// Firestore / Auth の関数を各ページへ素通しで再エクスポート
export {
  onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp
};

/* ---- 共通ヘルパー ---- */

// 既知のロール（admin.html のUIや表示で使う）
export const ALL_ROLES = ["shihan", "hanshi", "admin"];
export const ROLE_LABELS = {
  shihan: { ja: "師範", en: "Shihan" },
  hanshi: { ja: "範士", en: "Hanshi" },
  admin:  { ja: "管理者", en: "Admin" }
};

// サインイン中ユーザーの users/{uid} ドキュメント（displayName, roles 等）を取得。
// ドキュメントが無ければ null。
export async function loadProfile(uid){
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// 認証ガード：未ログインなら index.html へ。ログイン済みなら cb(user, profile)。
// profile は users ドキュメント（未作成なら null）。
export function requireAuth(cb){
  onAuthStateChanged(auth, async (user) => {
    if(!user){ location.replace("index.html"); return; }
    let profile = null;
    try { profile = await loadProfile(user.uid); }
    catch(e){ console.error("[dojo] loadProfile failed:", e); }
    cb(user, profile);
  });
}

// visibleTo（配列） と roles（配列）の交差判定。
// ※本丸は Security Rules。これはフロント側の補助的な出し分け用。
export function hasAccess(visibleTo, roles){
  if(!Array.isArray(visibleTo) || !Array.isArray(roles)) return false;
  return roles.some(r => visibleTo.includes(r));
}

export function isAdmin(roles){
  return Array.isArray(roles) && roles.includes("admin");
}
