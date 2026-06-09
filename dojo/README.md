# DONUT Dojo（会員エリア）— セットアップ & 運用手順

`sharesweat-site` 内のクローズドな会員エリア。`dojo/` 配下に閉じて実装してあり、
`sharesweat.com/dojo/` で配信される。既存8ページ・`assets/` には手を加えていない。

- 認証 / DB: **Firebase**（プロジェクト `donut-dojo`、Auth=メール/パスワード、Firestore）
- SDK: CDN版 modular SDK（npm/バンドラ不使用）。バージョンは [`assets/firebase-init.js`](assets/firebase-init.js) に集約。
- アクセス制御の本丸は **Firestore Security Rules**（`../firestore.rules`）。画面の出し分けは補助。

---

## 🔑 いちばん大事な「2系統デプロイ」

| 対象 | デプロイ方法 | タイミング |
|---|---|---|
| **サイト本体（dojo含む）** | `git add` → `git commit` → `git push origin main` → Cloudflare が自動デプロイ | HTML/CSS/JS を変えたとき |
| **Firestore Security Rules** | `firebase deploy --only firestore:rules`（または コンソールに貼付） | `firestore.rules` を変えたとき |

> ⚠️ **この2つは別系統。** `git push` しても Rules は反映されない。Rules を変えたら必ず Firebase 側へ別途デプロイすること。`wrangler.jsonc` の変更は不要（`dojo/` を足すだけで配信される）。

---

## 初回セットアップ（この順番で1回だけ）

### A. Security Rules をデプロイ（最初にやる）
ログインできても Rules が未設定だと全アクセス拒否（または全許可）になる。先に入れる。

**方法1: Firebase CLI**
```bash
npm install -g firebase-tools   # 未インストールなら
firebase login                  # ブラウザでGoogleログイン
firebase deploy --only firestore:rules
```
（リポジトリ直下に `firebase.json` / `.firebaserc`（project: donut-dojo）/ `firestore.rules` を用意済み）

**方法2: コンソール貼り付け**
Firebase コンソール → Firestore Database → ルール → `firestore.rules` の中身を貼って「公開」。

### B. 初期 admin を手動で作る（鶏卵問題の解消）
admin.html は「admin ロールを持つ人」しか開けない。最初の1人だけはコンソールで直接作る。

1. Firebase コンソール → **Authentication → ユーザーを追加** で、自分（Kazuma）のメール＋パスワードを発行。
2. 作成されたユーザーの **UID をコピー**（Authentication のユーザー一覧に表示される）。
3. Firebase コンソール → **Firestore Database → データ** → コレクション `users` を開始（無ければ作る）。
4. **ドキュメントID = コピーした自分のUID** で次のドキュメントを作成:
   - `displayName`（string）… 表示名（ニックネーム。本名は入れない）
   - `roles`（array）… 要素に文字列 `admin` を1つ
   - `createdAt`（timestamp）… 任意（現在時刻でよい）
5. これで自分が admin。以降のロール付与・ユーザー追加は `dojo/admin.html` から行える。

### C. 承認済みドメインの確認
Firebase コンソール → **Authentication → 設定 → 承認済みドメイン** に、ログインを許可するドメインを追加:
- `sharesweat.com`（本番。独自ドメイン設定後）
- `sharesweat-site.kazishizuka.workers.dev`（暫定URL）
- `localhost`（ローカル確認用。`firebase` 由来のものは既定で入っていることが多い）

> ログインが `auth/unauthorized-domain` で弾かれたら、ここを見直す。

---

## 日々の運用

### メンバーを増やす
1. Firebase コンソール → Authentication → ユーザーを追加（メール＋パスワードを発行して本人に伝える）。
2. そのユーザーの **UID** をコピー。
3. `dojo/admin.html`（adminでログイン）→ **①ユーザーとロール** で UID・表示名・ロールを入れて「ユーザー登録」。
4. 既存ユーザーのロール変更も同じ画面の一覧から（チェックを変えて「保存」）。

> パスワードを忘れたメンバーは、ログイン画面の「パスワードを忘れた方」から自分でリセット可能。

### コンテンツを足す（admin.html）
- **②カテゴリ作成** … 記事の区分。「全体」にしたいときはロールを全部チェック（admin は自動で付与）。
- **③記事・お知らせ** … カテゴリを選んで投稿。「お知らせにする」ON で全メンバーのホーム上部に出る。本文はプレーン or 簡易Markdown（`#`見出し / `**太字**` / `- 箇条書き` / `[text](url)`）。
- **④チャンネル作成** … チャットの場。閲覧できるロール＝発言できるロール。

---

## ロールと公開範囲（visibleTo）

- `admin` … 管理者（創業者）。全閲覧＋管理操作。
- `shihan`（師範）… 空中戦＝戦略・発信系コンテンツ。
- `hanshi`（範士）… 地上戦＝実使用・品質検証系コンテンツ。
- **全体（全ロール共通）** … 専用ロールは作らず、`visibleTo` に `shihan`/`hanshi`/`admin` を全部入れることで実現（admin.htmlでは全チェック）。
- カテゴリ/記事/チャンネルの `visibleTo` には **admin を常に含める**（admin.html が自動付与）。

---

## セキュリティの考え方（重要）

- 機密（事業計画書など）の保護は **Security Rules で「データを返さない」レベル**で担保。未ログイン・権限の無いロールには、DBがそもそも応答しない。URL直打ちやコンソール経由でも取れない。
- 画面側のガード（未ログインなら index へ等）は **チラつき防止と導線のための補助**。本丸は Rules。
- `assets/firebase-init.js` の `firebaseConfig`（apiKey 等）は **公開前提の値**で問題ない。
- **サービスアカウントキー等の秘密鍵は絶対にこのリポジトリにコミットしない。**`.gitignore` で `.env*` 等は除外済み。Firebase CLI はブラウザログイン方式なのでキーファイルは不要。
- DM/個人間チャットは **構造的に作っていない**（`messages` はチャンネル単位の公開発言のみ）。「意見は言えるが個別に連絡は取れない」を構造で担保。

---

## 実装メモ（後の自分向け）

- **クエリは単一の `array-contains-any`（visibleTo × 自分のroles）に統一**し、`categoryId`/`channelId` の絞り込みと並び替えはクライアント側で実施。これにより **Firestore の複合インデックス作成が不要**で、すぐ動く。
  - データ量が増えたら、サーバー側フィルタ＋複合インデックス（`firestore.indexes.json` に定義 → `firebase deploy --only firestore:indexes`）へ移行する。
- `messages.channelId` と `category.html?id=` / `chat.html?channel=` には **コレクションのドキュメントID** を使用（仕様の "general"/"shihan" という命名キーではなくドキュメントID方式に統一して整合をとった）。
- ロールが空（user ドキュメント未作成 or roles 空）のユーザーは、ホームで「管理者に連絡」を表示してクエリをスキップ（`array-contains-any` は空配列で使えないため）。
- 各ページは認証解決まで `body.cloak` でコンテンツを隠す（チラつき防止）。

---

## フェーズ1ファイル一覧

```
dojo/
  index.html        ログイン（メール＋PW / パスワード忘れ）
  home.html         ダッシュボード（お知らせ・カテゴリ・チャンネル）
  category.html     ?id= カテゴリの記事一覧＋本文
  chat.html         ?channel= チャンネル別リアルタイムチャット
  admin.html        管理者専用（ロール付与・カテゴリ/記事/チャンネル）
  README.md         このファイル
  assets/
    firebase-init.js  Firebase初期化・認証ガード・ロール取得
    dojo.css          Dojo用スタイル（既存デザイントークン流用）
    dojo.js           言語切替・ログアウト・表示ユーティリティ
（リポジトリ直下）
  firestore.rules        Security Rules（←別系統でデプロイ）
  firebase.json          rules/indexes の指定
  firestore.indexes.json 複合インデックス定義（現状は空）
  .firebaserc            既定プロジェクト donut-dojo
```

---

## 動作確認チェックリスト（指示書の順番）

1. **Rulesデプロイ**（上記A）→ コンソールのルールが反映済みか。
2. **ログイン**: 自分のメール＋PWで `dojo/index.html` → ログイン → `home.html` に遷移。失敗時に「メールアドレスまたはパスワードが違います」が出るか。「パスワードを忘れた方」でリセットメールが届くか。
3. **初期admin**（上記B）→ home に admin ナビが出る／`admin.html` が開ける。
4. **admin操作**: ユーザー登録・ロール付与、カテゴリ/記事/お知らせ/チャンネル作成ができるか。
5. **出し分け**: 別ロールのテストユーザーでログインし、見えるカテゴリ/記事/チャンネルがロール通りに変わるか。**権限の無いカテゴリを `category.html?id=...` で直打ちしても home に戻され、データも返らないか。**
6. **お知らせ**: admin が「お知らせ」投稿 → 対象ロールの home 上部に新着順で出るか。
7. **チャット**: チャンネルで発言 → 別タブ/別ユーザーに**リアルタイム**で反映されるか。他人のメール/UIDが表示されていないか。DM導線が存在しないか。
