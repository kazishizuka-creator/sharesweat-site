# SHARESWEAT サイト — 作業メモ / 引き継ぎ

> このファイルはデプロイには影響しません（静的サイトのページとしては配信されない作業用メモ）。
> 最終更新: 2026-06-02

## デプロイの流れ
編集 → `git add` → `git commit` → `git push origin main` → Cloudflare が main を自動デプロイ。

- 本番（暫定URL）: https://sharesweat-site.kazishizuka.workers.dev/
- 将来の独自ドメイン: sharesweat.com

## 変更してはいけない制約
- `privacy-policy.html` / `terms-of-use.html` の **URL・ファイル名は変更禁止**（Google Play / App Store が参照）。
- App Store URL: https://apps.apple.com/jp/app/id6744959372
- Google Play URL: https://play.google.com/store/apps/details?id=com.sharesweat.app

## ページ構成
index / vision / product / app / company（ラベルは "Founder"）/ contact / privacy-policy / terms-of-use

---

## 日英(JA/EN)併記の仕組みと注意点
- 全ページ `data-lang-ja` / `data-lang-en` の span を併記し、ヘッダーの言語ボタンで切替（実装: `assets/app.js` ＋ `assets/style.css` の `body.lang-en [data-lang-ja]{display:none}` / `[data-lang-en]{display:revert}`、初回はブラウザ言語で自動判定）。
- **⚠️ 落とし穴**: `data-lang-ja` だけで `data-lang-en` の無い要素は **英語表示で消える**。テキストを足すときは必ず JA/EN 両方を持たせる。
- `<select>` の `<option>` は両 span のネストが効かない環境があるため、**ja用・en用の option を2セット**用意して各々に `data-lang-*` を付ける方式（contact.html のご用件）。iOS Safari 実機での切替確認が未実施。

---

## 直近の作業履歴（2026-06）
| commit | 内容 |
|---|---|
| `d314afa` | product モバイル `.page-hero` に左右6vw余白 |
| `e3805c0` | company モバイル全面調整（左右6vw＋3つの円を横並びにコンパクト化）／ vision モバイル `.page-hero` に左右6vw余白 |
| `995a7a1` | 英語表示バグ＆誤り修正: contactのラベル3/選択肢4（EN時に消える）、terms-of-useの英語誤記＋フッターリンク、productのmeta description更新 |
| `9ddbdfa` | JA単独箇所の英語化: companyスキル8項目、product図版テキスト（flow-label＋advice4行）|
| `547cd5e` | 意味ズレ調整: index Our Product h2 / index hero sub / vision v-line3 の英語を日本語に寄せた |

---

## 🟡 未対応の保留項目（方針判断待ち）
1. **vision.html `.h1-sp`（スマホ用短縮見出し）の英語** — 現状 `Body motion × AI` が文の断片で不自然。JA「身体動作×AI時代を見据えて」と意味が合っていない。英語見出しをどうするか要相談。
2. **index.html `.en-mini`** — `Sports form analysis & human-motion data platform` は英語固定タグライン（JA版なし・スマホでは非表示）。JA版を持たせるか英語固定のままにするか要相談。

## 実機で確認しておくと安心な点
- contact.html のご用件ドロップダウン（option の `display:none` 切替）が iOS Safari 英語表示で正しく出るか。
- company / product のスマホ表示で、英語のほうが文字数が多く円・図版が窮屈になっていないか。
