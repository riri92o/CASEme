// ==========================================
// CASEme ホームフィード
// ==========================================

(function initializeHomeFeed() {
  const isHomeFeedPage =
    document.body.classList.contains("home-page") &&
    !document.body.classList.contains("search-page");

  if (!isHomeFeedPage) {
    return;
  }

  const recentPostGrid = document.querySelector(".post-grid");
  const popularPostGrid = document.querySelector(
    "#popular-post-grid"
  );
  const popularPostsStatus = document.querySelector(
    "#popular-posts-status"
  );
  const homePostCount = document.querySelector(".post-count");

  let currentHomePosts = [];

  function getPostTime(postData) {
    const time = new Date(
      postData.createdAt || postData.updatedAt || 0
    ).getTime();

    return Number.isFinite(time) ? time : 0;
  }

  function findHomePost(postId) {
    return currentHomePosts.find((post) => {
      return String(post.id) === String(postId);
    });
  }

  function addFavoriteCount(postCard, count) {
    const cardActions = postCard.querySelector(
      ".post-card-actions"
    );

    if (!cardActions) {
      return;
    }

    const countText = document.createElement("span");
    countText.className = "favorite-count";
    countText.textContent = `♥ ${count}`;
    countText.setAttribute(
      "aria-label",
      `お気に入り${count}件`
    );

    cardActions.insertBefore(
      countText,
      cardActions.querySelector(".like-button")
    );
  }

  function synchronizeFavoriteButtons(postData) {
    document
      .querySelectorAll(
        `.like-button[data-post-id="${CSS.escape(String(postData.id))}"]`
      )
      .forEach((button) => {
        button.classList.toggle(
          "active",
          postData.isLiked === true
        );
        button.textContent =
          postData.isLiked === true ? "♥" : "♡";
        button.setAttribute(
          "aria-label",
          postData.isLiked === true
            ? "お気に入りから削除"
            : "お気に入りに追加"
        );
      });
  }

  async function renderHomeFeeds(posts) {
    currentHomePosts = [...posts];

    const recentPosts = [...currentHomePosts]
      .sort((firstPost, secondPost) => {
        return getPostTime(secondPost) - getPostTime(firstPost);
      })
      .slice(0, 6);

    recentPostGrid.replaceChildren();

    recentPosts.forEach((postData) => {
      recentPostGrid.appendChild(createPostCard(postData));
    });

    homePostCount.textContent = `${recentPosts.length}件を表示`;

    let favoriteCounts = new Map();

    if (typeof fetchPostFavoriteCounts === "function") {
      favoriteCounts = await fetchPostFavoriteCounts();
    }

    const popularPosts = [...currentHomePosts]
      .sort((firstPost, secondPost) => {
        const favoriteDifference =
          (favoriteCounts.get(secondPost.id) || 0) -
          (favoriteCounts.get(firstPost.id) || 0);

        if (favoriteDifference !== 0) {
          return favoriteDifference;
        }

        return getPostTime(secondPost) - getPostTime(firstPost);
      })
      .slice(0, 6);

    popularPostGrid.replaceChildren();

    popularPosts.forEach((postData) => {
      const postCard = createPostCard(postData);
      const favoriteCount =
        favoriteCounts.get(postData.id) || 0;

      addFavoriteCount(postCard, favoriteCount);
      popularPostGrid.appendChild(postCard);
    });

    if (currentHomePosts.length === 0) {
      popularPostsStatus.textContent =
        "投稿が追加されると、ここに表示されます。";
    } else if (favoriteCounts.size === 0) {
      popularPostsStatus.textContent =
        "お気に入りの集計がまだないため、新しい投稿から表示しています。";
    } else {
      popularPostsStatus.textContent = "";
    }
  }

  popularPostGrid.addEventListener("click", async (event) => {
    const likeButton = event.target.closest(".like-button");

    if (likeButton) {
      const postData = findHomePost(
        likeButton.dataset.postId
      );

      if (!postData) {
        return;
      }

      await toggleFavorite(postData.id, likeButton);
      synchronizeFavoriteButtons(postData);
      return;
    }

    const postCard = event.target.closest(".user-post-card");

    if (!postCard) {
      return;
    }

    const postData = findHomePost(postCard.dataset.postId);

    if (postData) {
      openPostDetail(postData);
    }
  });

  window.renderHomeFeeds = renderHomeFeeds;
})();
