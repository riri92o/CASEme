-- ==========================================
-- CASEme 通知機能 データベースセットアップ SQL
-- ==========================================
-- このSQLをSupabaseダッシュボードの「SQL Editor」で実行してください。

-- 1. 通知テーブルの作成
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null, -- 通知を受け取るユーザー
  notifier_id uuid references public.profiles(id) on delete cascade not null, -- アクションを起こしたユーザー
  type text not null, -- 'like' (お気に入り) または 'follow' (フォロー)
  post_id uuid references public.posts(id) on delete cascade, -- お気に入りの場合のみ対象 of 投稿ID
  is_read boolean default false not null, -- 既読フラグ
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- テーブルにコメントを追加（任意）
comment on table public.notifications is 'ユーザー宛ての通知情報を管理します。';

-- 2. RLS (Row Level Security) の有効化
alter table public.notifications enable row level security;

-- 3. ポリシーの設定

-- ポリシーが存在する場合の競合を防ぐため、一度削除します（再実行可能にするため）
drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Authenticated users can insert notifications" on public.notifications;
drop policy if exists "Users can update their own notifications" on public.notifications;
drop policy if exists "Users can delete their own notifications" on public.notifications;

-- (1) ユーザーは自分宛ての通知のみを参照できます
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- (2) ログイン済みのユーザーは誰にでも通知を送信できます（いいねやフォロー時に通知をインサートするため）
create policy "Authenticated users can insert notifications"
  on public.notifications for insert
  with check (auth.role() = 'authenticated');

-- (3) ユーザーは自分宛ての通知のみを更新できます（既読フラグの更新用）
create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- (4) ユーザーは自分宛ての通知のみを削除できます
create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- 4. テーブルに対するAPIアクセス権限（GRANT）の明示的付与
-- プロジェクトの環境によってデフォルト権限が制限されている場合があるため、明示的に権限を付与します。
grant select, insert, update, delete on table public.notifications to anon, authenticated, service_role;

