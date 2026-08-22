-- ==========================================
-- CASEme 投稿削除・人気投稿セットアップ
-- ==========================================
-- Supabase Dashboard の SQL Editor で一度だけ実行してください。

-- 投稿を削除したとき、その投稿のお気に入りも自動削除します。
alter table public.favorites
  drop constraint if exists favorites_post_id_fkey;

alter table public.favorites
  add constraint favorites_post_id_fkey
  foreign key (post_id)
  references public.posts(id)
  on delete cascade;

-- ログイン中の本人だけが、自分の投稿を削除できる関数です。
-- 関連するお気に入り・通知は外部キーのCASCADEで連動削除されます。
create or replace function public.delete_owned_post(
  target_post_id uuid
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  deleted_image_path text;
begin
  select image_path
    into deleted_image_path
  from public.posts
  where id = target_post_id
    and user_id = auth.uid();

  if not found then
    raise exception '投稿が見つからないか、削除する権限がありません。';
  end if;

  delete from public.posts
  where id = target_post_id
    and user_id = auth.uid();

  return deleted_image_path;
end;
$$;

revoke all on function public.delete_owned_post(uuid) from public;
grant execute on function public.delete_owned_post(uuid) to authenticated;

-- 投稿ごとのお気に入り数だけを返します。
-- お気に入りしたユーザーIDは公開しません。
create or replace function public.get_post_favorite_counts()
returns table (
  post_id uuid,
  favorite_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    favorites.post_id,
    count(*)::bigint as favorite_count
  from public.favorites
  group by favorites.post_id;
$$;

revoke all on function public.get_post_favorite_counts() from public;
grant execute on function public.get_post_favorite_counts() to anon, authenticated;
