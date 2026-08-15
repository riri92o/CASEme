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
