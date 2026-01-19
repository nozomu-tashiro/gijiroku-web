# 🚀 Phase 3 クイックスタートガイド

## 📋 新しいチャットで最初に伝えること

```
会議議事録管理システムの Phase 3 を開始します。

【プロジェクト情報】
- リポジトリ: https://github.com/nozomu-tashiro/gijiroku-web
- 作業ディレクトリ: /home/user/webapp
- 本番URL: https://nozomu-tashiro.github.io/gijiroku-web/

【完了済み】
- ✅ Supabase データベース構築（7テーブル、外部キー5）
- ✅ Supabase Authentication 設定
- ✅ ログインページ作成（ドメイン制限、重複登録防止）
- ✅ リダイレクトハンドラー（404問題解決）

【Phase 3 タスク】
localStorage → Supabase データ移行

まず PROJECT_STATUS.md を読んで、Phase 3 の実装を開始してください！
```

---

## 🔍 AIアシスタントへの指示

新しいチャットでAIアシスタントに最初に実行してもらうこと：

### 1. ドキュメントの確認

```bash
cd /home/user/webapp && cat PROJECT_STATUS.md
```

これで、プロジェクトの全体像を理解できます。

---

### 2. 作業環境の確認

```bash
cd /home/user/webapp && pwd
cd /home/user/webapp && git status
cd /home/user/webapp && ls -la
```

**期待される結果**:
- `pwd`: `/home/user/webapp`
- `git status`: `On branch main`, `nothing to commit, working tree clean`
- `ls -la`: `index.html`, `supabase-login.html`, `PROJECT_STATUS.md` などが表示される

---

### 3. Supabase接続情報の確認

```bash
cd /home/user/webapp && grep -A 1 "SUPABASE_URL" index.html | head -3
```

**期待される結果**:
```javascript
const SUPABASE_URL = 'https://kxgdolplxtnnozvzewzo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## 🎯 Phase 3 実装の開始手順

### ステップ1: 認証状態チェック機能を追加

`index.html` の冒頭（`<script>` タグ内の最初）に以下を追加：

```javascript
// Supabase クライアント初期化
const SUPABASE_URL = 'https://kxgdolplxtnnozvzewzo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Z2RvbHBseHRubm96dnpld3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MTQyMjUsImV4cCI6MjA4NDI5MDIyNX0.7ViGgLtEWCeJbzGRg5PmELsaF_OGja1YopCQM6UbIXU';

// Supabaseクライアントがまだ初期化されていない場合
if (typeof window.supabase === 'undefined') {
    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// 認証状態チェック
async function checkAuth() {
    console.log('🔐 認証状態をチェック中...');
    
    const { data: { session }, error } = await window.supabase.auth.getSession();
    
    if (error) {
        console.error('❌ 認証エラー:', error);
        window.location.href = 'supabase-login.html';
        return null;
    }
    
    if (!session) {
        console.log('❌ 未ログイン - ログインページへリダイレクト');
        window.location.href = 'supabase-login.html';
        return null;
    }
    
    console.log('✅ ログイン中:', session.user.email);
    return session.user;
}

// ページ読み込み時に認証チェックを実行
window.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    
    if (user) {
        // 認証OKの場合、データ読み込みを開始
        console.log('📊 データ読み込みを開始します...');
        // 既存の初期化処理を実行
        if (typeof app !== 'undefined' && typeof app.init === 'function') {
            app.init();
        }
    }
});
```

**実装場所**: `index.html` の `<script>` タグ内、`const app = { ... }` の**前**に追加

---

### ステップ2: データ取得関数を追加

`app` オブジェクトに以下のメソッドを追加：

```javascript
const app = {
    // 既存のプロパティ...
    
    // 新規追加: Supabaseからデータを取得
    async loadMeetingsFromSupabase() {
        console.log('📥 Supabaseから会議データを取得中...');
        
        try {
            const { data, error } = await window.supabase
                .from('meetings')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ 会議データ取得エラー:', error);
                return [];
            }
            
            console.log('✅ 会議データ取得成功:', data.length, '件');
            return data;
            
        } catch (error) {
            console.error('❌ 予期しないエラー:', error);
            return [];
        }
    },
    
    async loadMinutesFromSupabase() {
        console.log('📥 Supabaseから議事録データを取得中...');
        
        try {
            const { data, error } = await window.supabase
                .from('meeting_minutes')
                .select(`
                    *,
                    participants (*),
                    agenda_items (*),
                    tasks (*)
                `)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ 議事録データ取得エラー:', error);
                return [];
            }
            
            console.log('✅ 議事録データ取得成功:', data.length, '件');
            return data;
            
        } catch (error) {
            console.error('❌ 予期しないエラー:', error);
            return [];
        }
    },
    
    // 既存のloadData()を修正
    async loadData() {
        console.log('📊 データ読み込み開始...');
        
        // Supabaseからデータを取得
        const supabaseMeetings = await this.loadMeetingsFromSupabase();
        const supabaseMinutes = await this.loadMinutesFromSupabase();
        
        // localStorageからもデータを取得（バックアップ・互換性のため）
        const savedMeetings = localStorage.getItem('meetingsData');
        const savedMinutes = localStorage.getItem('minutesData');
        
        const localMeetings = savedMeetings ? JSON.parse(savedMeetings) : [];
        const localMinutes = savedMinutes ? JSON.parse(savedMinutes) : [];
        
        // データをマージ（Supabaseを優先）
        this.meetingsData = supabaseMeetings.length > 0 ? supabaseMeetings : localMeetings;
        this.minutesData = supabaseMinutes.length > 0 ? supabaseMinutes : localMinutes;
        
        console.log('✅ データ読み込み完了');
        console.log('  - 会議:', this.meetingsData.length, '件');
        console.log('  - 議事録:', this.minutesData.length, '件');
    },
    
    // 既存のメソッド...
};
```

---

### ステップ3: データ保存関数を追加

```javascript
// app オブジェクトに追加
async saveMeetingToSupabase(meetingData) {
    console.log('💾 Supabaseに会議を保存中...', meetingData);
    
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        
        const { data, error } = await window.supabase
            .from('meetings')
            .insert([
                {
                    organization: meetingData.organization,
                    division: meetingData.division,
                    department: meetingData.department,
                    meeting_name: meetingData.meetingName,
                    created_by: user.id,
                    created_at: new Date().toISOString()
                }
            ])
            .select();
        
        if (error) throw error;
        
        console.log('✅ 会議保存成功:', data[0]);
        return data[0];
        
    } catch (error) {
        console.error('❌ 会議保存エラー:', error);
        throw error;
    }
},

async saveMinuteToSupabase(minuteData) {
    console.log('💾 Supabaseに議事録を保存中...', minuteData);
    
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        
        // 1. 議事録本体を保存
        const { data: minute, error: minuteError } = await window.supabase
            .from('meeting_minutes')
            .insert([
                {
                    meeting_id: minuteData.meetingId,
                    date: minuteData.date,
                    location: minuteData.location,
                    status: minuteData.status,
                    created_by: user.id,
                    created_at: new Date().toISOString()
                }
            ])
            .select();
        
        if (minuteError) throw minuteError;
        
        const minuteId = minute[0].id;
        
        // 2. 参加者を保存
        if (minuteData.participants?.length > 0) {
            const { error: participantError } = await window.supabase
                .from('participants')
                .insert(
                    minuteData.participants.map(p => ({
                        minute_id: minuteId,
                        name: p.name,
                        role: p.role
                    }))
                );
            
            if (participantError) throw participantError;
        }
        
        // 3. 議題を保存
        if (minuteData.agendaItems?.length > 0) {
            const { error: agendaError } = await window.supabase
                .from('agenda_items')
                .insert(
                    minuteData.agendaItems.map((item, index) => ({
                        minute_id: minuteId,
                        title: item.title,
                        content: item.content,
                        order_index: index
                    }))
                );
            
            if (agendaError) throw agendaError;
        }
        
        // 4. タスクを保存
        if (minuteData.tasks?.length > 0) {
            const { error: taskError } = await window.supabase
                .from('tasks')
                .insert(
                    minuteData.tasks.map(task => ({
                        minute_id: minuteId,
                        title: task.title,
                        assignee: task.assignee,
                        due_date: task.dueDate,
                        status: task.status || 'pending'
                    }))
                );
            
            if (taskError) throw taskError;
        }
        
        console.log('✅ 議事録保存成功:', minute[0]);
        return minute[0];
        
    } catch (error) {
        console.error('❌ 議事録保存エラー:', error);
        throw error;
    }
}
```

---

### ステップ4: 既存の保存処理を修正

既存の `saveData()` メソッドを以下のように修正：

```javascript
async saveData() {
    console.log('💾 データ保存開始...');
    
    // Supabaseに保存（新規）
    // TODO: 個別の作成・更新・削除時に呼び出すように変更
    
    // localStorageにもバックアップ保存（互換性のため）
    localStorage.setItem('meetingsData', JSON.stringify(this.meetingsData));
    localStorage.setItem('minutesData', JSON.stringify(this.minutesData));
    
    console.log('✅ データ保存完了');
}
```

---

## ⚠️ 重要な注意事項

### データ構造の違いに注意

**localStorage（既存）**:
```javascript
{
    id: 1,
    meetingName: "定例会議",
    // ...
}
```

**Supabase（新）**:
```javascript
{
    id: "uuid-string",
    meeting_name: "定例会議",  // スネークケース
    created_at: "2026-01-19T12:00:00Z",  // ISO形式
    // ...
}
```

**変換が必要！**

---

## 🧪 動作確認手順

### 1. 認証チェックのテスト

```javascript
// Consoleで実行
const { data: { session } } = await window.supabase.auth.getSession();
console.log('Session:', session);
```

**期待される結果**: ログイン済みの場合、`session.user.email` が表示される

---

### 2. データ取得のテスト

```javascript
// Consoleで実行
const meetings = await app.loadMeetingsFromSupabase();
console.log('Meetings:', meetings);
```

**期待される結果**: 会議データの配列が返される（空でもOK）

---

### 3. データ保存のテスト

```javascript
// Consoleで実行
const testMeeting = {
    organization: 'テスト組織',
    division: 'テスト部門',
    department: 'テスト課',
    meetingName: 'テスト会議'
};

const result = await app.saveMeetingToSupabase(testMeeting);
console.log('Result:', result);
```

**期待される結果**: 保存されたデータがオブジェクトとして返される

---

## 📝 コミット・プッシュの流れ

実装が完了したら、以下の手順でコミット・プッシュ：

```bash
# 変更を確認
cd /home/user/webapp && git status

# ファイルを追加
cd /home/user/webapp && git add index.html

# コミット
cd /home/user/webapp && git commit -m "feat: Phase 3 - Supabase認証チェックとデータ取得機能を実装"

# プッシュ
cd /home/user/webapp && git push origin main
```

---

## 🎉 Phase 3 完了の定義

以下がすべて動作すれば Phase 3 完了：

- [ ] ✅ 未ログイン時にログインページへリダイレクト
- [ ] ✅ ログイン後に会議一覧が表示される
- [ ] ✅ 新規会議を作成するとSupabaseに保存される
- [ ] ✅ 新規議事録を作成するとSupabaseに保存される
- [ ] ✅ 議事録の参加者・議題・タスクも正しく保存される
- [ ] ✅ データの更新・削除が動作する
- [ ] ✅ ページをリロードしてもデータが永続化されている

---

## 🚨 トラブルシューティング

### 問題: 認証チェックで無限リダイレクトが発生

**原因**: `supabase-login.html` でも認証チェックを実行している

**解決方法**: `supabase-login.html` では認証チェックをスキップ

---

### 問題: データ取得で空の配列が返される

**確認事項**:
1. Supabaseダッシュボードでテーブルにデータが存在するか
2. RLS（Row Level Security）の設定が正しいか
3. 認証されているか

**デバッグ方法**:
```javascript
// Consoleで実行
const { data, error } = await window.supabase.from('meetings').select('*');
console.log('Data:', data);
console.log('Error:', error);
```

---

### 問題: データ保存でエラーが発生

**確認事項**:
1. 必須フィールドがすべて入力されているか
2. データ型が正しいか（uuid, text, date など）
3. 外部キー制約が満たされているか

**デバッグ方法**:
```javascript
// エラーの詳細を確認
console.error('Error:', error.message);
console.error('Details:', error.details);
console.error('Hint:', error.hint);
```

---

## 📞 サポート

- **プロジェクト詳細**: `/home/user/webapp/PROJECT_STATUS.md`
- **Supabaseダッシュボード**: https://supabase.com/dashboard/project/kxgdolplxtnnozvzewzo
- **GitHub**: https://github.com/nozomu-tashiro/gijiroku-web

---

**このガイドに従えば、新しいチャットでもスムーズにPhase 3を進められます！** 🚀
