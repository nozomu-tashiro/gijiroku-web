# Supabase 設定確認チェックリスト

## 1. プロジェクトURL確認
https://supabase.com/dashboard/project/kxgdolplxtnnozvzewezo

### 確認項目：
- [ ] プロジェクトが存在するか
- [ ] プロジェクトが一時停止（Paused）されていないか
- [ ] プロジェクトのステータスが "Active" か

## 2. Authentication 設定確認
Settings → Authentication → Email Auth

### 確認項目：
- [ ] "Enable Email provider" がONになっているか
- [ ] "Confirm email" の設定を確認
- [ ] "Enable email confirmations" の状態を確認

## 3. URL Configuration 確認
Settings → Authentication → URL Configuration

### 確認項目：
- [ ] Site URL: https://nozomu-tashiro.github.io/gijiroku-web/
- [ ] Redirect URLs に以下が含まれているか：
  - https://nozomu-tashiro.github.io/gijiroku-web/
  - https://nozomu-tashiro.github.io/gijiroku-web/index.html
  - https://nozomu-tashiro.github.io/gijiroku-web/supabase-login.html

## 4. API Keys 確認
Settings → API → Project API keys

### 必要な情報：
- Project URL: https://kxgdolplxtnnozvzewezo.supabase.co
- anon public key: 確認して控える

---

## もし問題が見つかったら：

### プロジェクトが一時停止している場合：
- "Resume project" ボタンをクリック
- 数分待つ

### Email Authが無効の場合：
- "Enable Email provider" をONにする
- 保存する

### Redirect URLsが設定されていない場合：
- 上記のURLを追加
- 保存する
