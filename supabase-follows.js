// =========================
// CASEme フォロー管理
// =========================

// 現在ログインしているユーザーを取得します
async function getCurrentFollowUser() {
  const {
    data: { session },
    error
  } = await caseMeSupabase.auth.getSession();

  if (error) {
    throw error;
  }

  return session?.user ?? null;
}

// 相手をフォローしているか確認します
async function checkFollowing(targetUserId) {
  const currentUser = await getCurrentFollowUser();

  if (!currentUser) {
    return false;
  }

  const { data, error } = await caseMeSupabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", currentUser.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

// 相手をフォローします
async function followUser(targetUserId) {
  const currentUser = await getCurrentFollowUser();

  if (!currentUser) {
    throw new Error(
      "フォローするにはログインが必要です。"
    );
  }

  if (currentUser.id === targetUserId) {
    throw new Error(
      "自分自身をフォローすることはできません。"
    );
  }

  const { error } = await caseMeSupabase
    .from("follows")
    .insert({
      follower_id: currentUser.id,
      following_id: targetUserId
    });

  if (error) {
    throw error;
  }
}

// 相手のフォローを解除します
async function unfollowUser(targetUserId) {
  const currentUser = await getCurrentFollowUser();

  if (!currentUser) {
    throw new Error(
      "フォローを解除するにはログインが必要です。"
    );
  }

  const { error } = await caseMeSupabase
    .from("follows")
    .delete()
    .eq("follower_id", currentUser.id)
    .eq("following_id", targetUserId);

  if (error) {
    throw error;
  }
}

// フォロワー数とフォロー中の人数を取得します
async function fetchFollowCounts(userId) {
  const followerRequest = caseMeSupabase
    .from("follows")
    .select("*", {
      count: "exact",
      head: true
    })
    .eq("following_id", userId);

  const followingRequest = caseMeSupabase
    .from("follows")
    .select("*", {
      count: "exact",
      head: true
    })
    .eq("follower_id", userId);

  const [
    followerResult,
    followingResult
  ] = await Promise.all([
    followerRequest,
    followingRequest
  ]);

  if (followerResult.error) {
    throw followerResult.error;
  }

  if (followingResult.error) {
    throw followingResult.error;
  }

  return {
    followerCount: followerResult.count ?? 0,
    followingCount: followingResult.count ?? 0
  };
}

// ユーザーIDの配列から公開プロフィールを取得します
async function fetchFollowProfilesByIds(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  const { data, error } = await caseMeSupabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, avatar_url"
    )
    .in("id", userIds);

  if (error) {
    throw error;
  }

  const profileMap = new Map(
    (data ?? []).map((profile) => {
      return [profile.id, {
        id: profile.id,
        username: profile.username ?? "",
        displayName:
          profile.display_name ?? "CASEmeユーザー",
        bio: profile.bio ?? "",
        avatarUrl: getProfileAvatarPublicUrl(
          profile.avatar_url
        )
      }];
    })
  );

  // followsテーブルの並び順を保って返します
  return userIds
    .map((userId) => profileMap.get(userId))
    .filter(Boolean);
}

// 指定ユーザーがフォローしている人を取得します
async function fetchFollowingProfiles(userId) {
  const { data, error } = await caseMeSupabase
    .from("follows")
    .select("following_id, created_at")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const userIds = (data ?? []).map(
    (follow) => follow.following_id
  );

  return fetchFollowProfilesByIds(userIds);
}

// 指定ユーザーをフォローしている人を取得します
async function fetchFollowerProfiles(userId) {
  const { data, error } = await caseMeSupabase
    .from("follows")
    .select("follower_id, created_at")
    .eq("following_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const userIds = (data ?? []).map(
    (follow) => follow.follower_id
  );

  return fetchFollowProfilesByIds(userIds);
}
