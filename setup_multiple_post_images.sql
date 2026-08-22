-- CASEme：1つの投稿に複数画像を保存できるようにします。
-- Supabaseの「SQL Editor」で、このファイルの全文を1回だけ実行してください。

alter table public.posts
add column if not exists image_paths text[];

-- これまでの1枚投稿も複数画像形式へ移行します。
update public.posts
set image_paths = array[image_path]
where image_path is not null
  and (image_paths is null or cardinality(image_paths) = 0);

alter table public.posts
alter column image_paths set default '{}'::text[];

comment on column public.posts.image_paths is
'投稿画像のStorageパス。先頭の画像を一覧の表紙として使用する。';
