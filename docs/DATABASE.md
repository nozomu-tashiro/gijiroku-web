# データベース設計書

## ER図

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │──┐
│ email           │  │
│ password_hash   │  │
│ name            │  │
│ role            │  │
│ department_id   │──┼─────────┐
│ team_id         │──┼────┐    │
│ is_active       │  │    │    │
│ last_login_at   │  │    │    │
│ created_at      │  │    │    │
│ updated_at      │  │    │    │
└─────────────────┘  │    │    │
                     │    │    │
┌─────────────────┐  │    │    │
│  departments    │  │    │    │
├─────────────────┤  │    │    │
│ id (PK)         │◄─┼────┼────┘
│ name            │  │    │
│ description     │  │    │
│ created_at      │  │    │
│ updated_at      │  │    │
└─────────────────┘  │    │
          │          │    │
          └──────────┼────┼────┐
                     │    │    │
┌─────────────────┐  │    │    │
│     teams       │  │    │    │
├─────────────────┤  │    │    │
│ id (PK)         │◄─┼────┘    │
│ department_id   │──┘         │
│ name            │            │
│ description     │            │
│ created_at      │            │
│ updated_at      │            │
└─────────────────┘            │
          │                    │
          └────────────────────┼────┐
                               │    │
┌─────────────────┐            │    │
│    meetings     │            │    │
├─────────────────┤            │    │
│ id (PK)         │            │    │
│ team_id         │────────────┘    │
│ name            │                 │
│ description     │                 │
│ is_archived     │                 │
│ archived_at     │                 │
│ created_by      │─────────────────┘
│ created_at      │
│ updated_at      │
└─────────────────┘
          │
          └──────────────┐
                         │
┌─────────────────┐      │
│    minutes      │      │
├─────────────────┤      │
│ id (PK)         │      │
│ meeting_id      │◄─────┘
│ meeting_date    │
│ created_by      │──────────────┐
│ created_at      │              │
│ updated_at      │              │
└─────────────────┘              │
          │                      │
          └──────────────┐       │
                         │       │
┌─────────────────┐      │       │
│  minute_items   │      │       │
├─────────────────┤      │       │
│ id (PK)         │      │       │
│ minute_id       │◄─────┘       │
│ row_order       │              │
│ agenda          │              │
│ decision        │              │
│ issue           │              │
│ deadline        │              │
│ assignee        │              │
│ action_item     │              │
│ reason          │              │
│ status          │              │
│ other_info      │              │
│ created_at      │              │
│ updated_at      │              │
└─────────────────┘              │
                                 │
┌─────────────────┐              │
│ access_logs     │              │
├─────────────────┤              │
│ id (PK)         │              │
│ user_id         │◄─────────────┘
│ action          │
│ resource_type   │
│ resource_id     │
│ ip_address      │
│ user_agent      │
│ created_at      │
└─────────────────┘
```

## テーブル定義

### 1. users（ユーザーテーブル）

ユーザー情報を管理するテーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NO | uuid_generate_v4() | ユーザーID（主キー） |
| email | VARCHAR(255) | NO | - | メールアドレス（ログインID、UNIQUE） |
| password_hash | VARCHAR(255) | NO | - | bcryptでハッシュ化されたパスワード |
| name | VARCHAR(100) | NO | - | ユーザー名 |
| role | ENUM | NO | 'member' | 役割（'admin', 'manager', 'member'） |
| department_id | UUID | YES | NULL | 所属部門ID（外部キー） |
| team_id | UUID | YES | NULL | 所属チームID（外部キー） |
| is_active | BOOLEAN | NO | true | アクティブ状態（退職者はfalse） |
| last_login_at | TIMESTAMP | YES | NULL | 最終ログイン日時 |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 更新日時 |

**インデックス:**
- PRIMARY KEY: id
- UNIQUE INDEX: email
- INDEX: department_id
- INDEX: team_id
- INDEX: is_active

**制約:**
- FOREIGN KEY: department_id → departments.id
- FOREIGN KEY: team_id → teams.id

### 2. departments（部門テーブル）

組織の部門情報を管理するテーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NO | uuid_generate_v4() | 部門ID（主キー） |
| name | VARCHAR(100) | NO | - | 部門名 |
| description | TEXT | YES | NULL | 部門説明 |
| display_order | INTEGER | NO | 0 | 表示順序 |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 更新日時 |

**インデックス:**
- PRIMARY KEY: id
- UNIQUE INDEX: name
- INDEX: display_order

**初期データ:**
1. 営業部（営業債権管理部）
2. 債権管理部（営業債権管理部）
3. 審査契約管理部
4. システム部
5. 人事管理部

### 3. teams（チームテーブル）

部門配下のチーム情報を管理するテーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NO | uuid_generate_v4() | チームID（主キー） |
| department_id | UUID | NO | - | 所属部門ID（外部キー） |
| name | VARCHAR(100) | NO | - | チーム名 |
| description | TEXT | YES | NULL | チーム説明 |
| display_order | INTEGER | NO | 0 | 表示順序 |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 更新日時 |

**インデックス:**
- PRIMARY KEY: id
- INDEX: department_id
- INDEX: (department_id, display_order)

**制約:**
- FOREIGN KEY: department_id → departments.id ON DELETE CASCADE

**初期データ（部門別）:**

**営業部:**
- 東日本
- 西日本

**債権管理部:**
- コンサルティングデスク
- エリア担当東①
- エリア担当東②
- エリア担当西①
- エリア担当西②
- 法務
- 求償
- サポートデスク通常事務チーム
- サポートデスク保証実行チーム

**審査契約管理部:**
- 審査
- 契約管理
- 国際チーム

**人事管理部:**
- 経理
- 人事
- 管理

### 4. meetings（会議テーブル）

チームごとの会議情報を管理するテーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NO | uuid_generate_v4() | 会議ID（主キー） |
| team_id | UUID | NO | - | チームID（外部キー） |
| name | VARCHAR(200) | NO | - | 会議名 |
| description | TEXT | YES | NULL | 会議説明 |
| is_archived | BOOLEAN | NO | false | アーカイブ状態 |
| archived_at | TIMESTAMP | YES | NULL | アーカイブ日時 |
| created_by | UUID | NO | - | 作成者ID（外部キー） |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 更新日時 |

**インデックス:**
- PRIMARY KEY: id
- INDEX: team_id
- INDEX: (team_id, is_archived)
- INDEX: created_by

**制約:**
- FOREIGN KEY: team_id → teams.id ON DELETE CASCADE
- FOREIGN KEY: created_by → users.id

### 5. minutes（議事録テーブル）

会議ごとの議事録ヘッダー情報を管理するテーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NO | uuid_generate_v4() | 議事録ID（主キー） |
| meeting_id | UUID | NO | - | 会議ID（外部キー） |
| meeting_date | DATE | NO | CURRENT_DATE | 会議開催日 |
| title | VARCHAR(200) | YES | NULL | 議事録タイトル |
| raw_text | TEXT | YES | NULL | 元のテキスト（AI処理前） |
| created_by | UUID | NO | - | 作成者ID（外部キー） |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 更新日時 |

**インデックス:**
- PRIMARY KEY: id
- INDEX: meeting_id
- INDEX: (meeting_id, meeting_date)
- INDEX: meeting_date
- INDEX: created_by

**制約:**
- FOREIGN KEY: meeting_id → meetings.id ON DELETE CASCADE
- FOREIGN KEY: created_by → users.id

### 6. minute_items（議事録項目テーブル）

議事録の各項目（スプレッドシート行）を管理するテーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NO | uuid_generate_v4() | 項目ID（主キー） |
| minute_id | UUID | NO | - | 議事録ID（外部キー） |
| row_order | INTEGER | NO | 0 | 行の表示順序 |
| agenda | TEXT | YES | NULL | 議題 |
| decision | TEXT | YES | NULL | 決定事項 |
| issue | TEXT | YES | NULL | 課題 |
| deadline | DATE | YES | NULL | 期日（期限） |
| assignee | VARCHAR(100) | YES | NULL | 担当者 |
| action_item | TEXT | YES | NULL | 実行内容 |
| reason | TEXT | YES | NULL | 理由・背景情報 |
| status | ENUM | NO | 'not_started' | ステータス |
| other_info | TEXT | YES | NULL | その他の関連情報 |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 更新日時 |

**ステータス ENUM値:**
- `not_started`: 未着手
- `in_progress`: 進行中
- `completed`: 完了
- `pending`: 保留
- `cancelled`: 中止

**インデックス:**
- PRIMARY KEY: id
- INDEX: minute_id
- INDEX: (minute_id, row_order)
- INDEX: deadline
- INDEX: assignee
- INDEX: status

**制約:**
- FOREIGN KEY: minute_id → minutes.id ON DELETE CASCADE

### 7. access_logs（アクセスログテーブル）

ユーザーのアクセス履歴を記録するテーブル（監査用）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NO | uuid_generate_v4() | ログID（主キー） |
| user_id | UUID | YES | NULL | ユーザーID（外部キー） |
| action | VARCHAR(50) | NO | - | アクション（'create', 'read', 'update', 'delete'） |
| resource_type | VARCHAR(50) | NO | - | リソース種類（'meeting', 'minute', etc） |
| resource_id | UUID | YES | NULL | リソースID |
| ip_address | VARCHAR(45) | YES | NULL | IPアドレス |
| user_agent | TEXT | YES | NULL | ユーザーエージェント |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 作成日時 |

**インデックス:**
- PRIMARY KEY: id
- INDEX: user_id
- INDEX: (user_id, created_at)
- INDEX: created_at
- INDEX: (resource_type, resource_id)

**制約:**
- FOREIGN KEY: user_id → users.id ON DELETE SET NULL

## Prisma スキーマ

上記のテーブル設計をPrisma ORMのスキーマファイルに実装します。

## データベース初期化SQL

### 組織階層の初期データ

```sql
-- 部門の作成
INSERT INTO departments (id, name, description, display_order) VALUES
  ('d1111111-1111-1111-1111-111111111111', '営業部（営業債権管理部）', '営業活動と債権管理を担当', 1),
  ('d2222222-2222-2222-2222-222222222222', '債権管理部（営業債権管理部）', '債権の管理と回収を担当', 2),
  ('d3333333-3333-3333-3333-333333333333', '審査契約管理部', '審査と契約管理を担当', 3),
  ('d4444444-4444-4444-4444-444444444444', 'システム部', 'ITシステムの開発と運用を担当', 4),
  ('d5555555-5555-5555-5555-555555555555', '人事管理部', '人事と経理業務を担当', 5);

-- チームの作成（営業部）
INSERT INTO teams (id, department_id, name, display_order) VALUES
  ('t1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', '東日本', 1),
  ('t1111111-1111-1111-1111-111111111112', 'd1111111-1111-1111-1111-111111111111', '西日本', 2);

-- チームの作成（債権管理部）
INSERT INTO teams (id, department_id, name, display_order) VALUES
  ('t2222222-2222-2222-2222-222222222221', 'd2222222-2222-2222-2222-222222222222', 'コンサルティングデスク', 1),
  ('t2222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', 'エリア担当東①', 2),
  ('t2222222-2222-2222-2222-222222222223', 'd2222222-2222-2222-2222-222222222222', 'エリア担当東②', 3),
  ('t2222222-2222-2222-2222-222222222224', 'd2222222-2222-2222-2222-222222222222', 'エリア担当西①', 4),
  ('t2222222-2222-2222-2222-222222222225', 'd2222222-2222-2222-2222-222222222222', 'エリア担当西②', 5),
  ('t2222222-2222-2222-2222-222222222226', 'd2222222-2222-2222-2222-222222222222', '法務', 6),
  ('t2222222-2222-2222-2222-222222222227', 'd2222222-2222-2222-2222-222222222222', '求償', 7),
  ('t2222222-2222-2222-2222-222222222228', 'd2222222-2222-2222-2222-222222222222', 'サポートデスク通常事務チーム', 8),
  ('t2222222-2222-2222-2222-222222222229', 'd2222222-2222-2222-2222-222222222222', 'サポートデスク保証実行チーム', 9);

-- チームの作成（審査契約管理部）
INSERT INTO teams (id, department_id, name, display_order) VALUES
  ('t3333333-3333-3333-3333-333333333331', 'd3333333-3333-3333-3333-333333333333', '審査', 1),
  ('t3333333-3333-3333-3333-333333333332', 'd3333333-3333-3333-3333-333333333333', '契約管理', 2),
  ('t3333333-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333', '国際チーム', 3);

-- チームの作成（人事管理部）
INSERT INTO teams (id, department_id, name, display_order) VALUES
  ('t5555555-5555-5555-5555-555555555551', 'd5555555-5555-5555-5555-555555555555', '経理', 1),
  ('t5555555-5555-5555-5555-555555555552', 'd5555555-5555-5555-5555-555555555555', '人事', 2),
  ('t5555555-5555-5555-5555-555555555553', 'd5555555-5555-5555-5555-555555555555', '管理', 3);

-- デフォルト管理者ユーザーの作成
-- パスワード: Admin@123（実際の運用では必ず変更すること）
INSERT INTO users (id, email, password_hash, name, role, is_active) VALUES
  ('u0000000-0000-0000-0000-000000000000', 'admin@example.com', '$2b$10$YourHashedPasswordHere', 'システム管理者', 'admin', true);
```

## クエリ最適化戦略

### 1. よく使用されるクエリ

#### 会議一覧取得（チーム別、非アーカイブ）
```sql
SELECT m.*, t.name as team_name, d.name as department_name
FROM meetings m
JOIN teams t ON m.team_id = t.id
JOIN departments d ON t.department_id = d.id
WHERE m.team_id = ? AND m.is_archived = false
ORDER BY m.created_at DESC;
```

#### 議事録検索（キーワード、日付範囲）
```sql
SELECT 
  mi.*,
  m.meeting_date,
  mt.name as meeting_name,
  t.name as team_name,
  d.name as department_name
FROM minute_items mi
JOIN minutes m ON mi.minute_id = m.id
JOIN meetings mt ON m.meeting_id = mt.id
JOIN teams t ON mt.team_id = t.id
JOIN departments d ON t.department_id = d.id
WHERE 
  (mi.agenda ILIKE ? OR mi.decision ILIKE ? OR mi.issue ILIKE ?)
  AND m.meeting_date BETWEEN ? AND ?
  AND mt.is_archived = false
ORDER BY m.meeting_date DESC, mi.row_order ASC;
```

### 2. パフォーマンス最適化

#### インデックス戦略
- **複合インデックス**: (meeting_id, meeting_date), (team_id, is_archived)
- **全文検索インデックス**: agenda, decision, issue列（PostgreSQL GIN index）
- **日付範囲検索**: meeting_date, deadlineにB-treeインデックス

#### クエリ最適化
- `EXPLAIN ANALYZE`での実行計画確認
- N+1問題の回避（Prismaの`include`を活用）
- 適切なページネーション（LIMIT, OFFSET）

## バックアップ戦略

### 1. 定期バックアップ
- 毎日深夜にフルバックアップ（pg_dump）
- 保持期間: 30日間
- バックアップ先: 専用ストレージ

### 2. トランザクションログ
- WAL（Write-Ahead Logging）の有効化
- Point-in-Time Recovery対応

### 3. リカバリ計画
- RTO（Recovery Time Objective）: 4時間
- RPO（Recovery Point Objective）: 24時間

## マイグレーション管理

Prisma Migrateを使用してスキーマ変更を管理します。

```bash
# マイグレーション作成
npx prisma migrate dev --name init

# 本番環境へのマイグレーション適用
npx prisma migrate deploy
```
