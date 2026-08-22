// ==========================================
// CASEme 複数画像ギャラリー
// ==========================================

(function initializeMultiImageGallery() {
  function getPostImageUrls(postData) {
    if (
      Array.isArray(postData.imageUrls) &&
      postData.imageUrls.length > 0
    ) {
      return postData.imageUrls;
    }

    return [postData.imageUrl].filter(Boolean);
  }

  function renderPostImageGallery(container, postData) {
    if (!container) {
      return;
    }

    const imageUrls = getPostImageUrls(postData);
    const track = document.createElement("div");
    track.className = "detail-image-track";

    imageUrls.forEach((imageUrl, index) => {
      const image = document.createElement("img");
      image.id = index === 0 ? "detail-image" : "";
      image.className = "detail-image";
      image.src = imageUrl;
      image.alt = `${postData.title}のスマホケース画像 ${index + 1}枚目`;
      image.loading = index === 0 ? "eager" : "lazy";
      track.appendChild(image);
    });

    container.replaceChildren(track);

    if (imageUrls.length < 2) {
      return;
    }

    const pageIndicator = document.createElement("div");
    pageIndicator.className = "detail-image-indicator";
    pageIndicator.setAttribute("aria-label", `${imageUrls.length}枚の画像`);

    const dots = imageUrls.map((_, index) => {
      const dot = document.createElement("span");
      dot.className = "detail-image-dot";
      dot.classList.toggle("active", index === 0);
      pageIndicator.appendChild(dot);
      return dot;
    });

    const imageCount = document.createElement("span");
    imageCount.className = "detail-image-count";
    imageCount.textContent = `1 / ${imageUrls.length}`;

    container.appendChild(pageIndicator);
    container.appendChild(imageCount);

    track.addEventListener("scroll", () => {
      const selectedIndex = Math.min(
        imageUrls.length - 1,
        Math.max(0, Math.round(track.scrollLeft / track.clientWidth))
      );

      dots.forEach((dot, index) => {
        dot.classList.toggle("active", index === selectedIndex);
      });

      imageCount.textContent =
        `${selectedIndex + 1} / ${imageUrls.length}`;
    });
  }

  window.renderPostImageGallery = renderPostImageGallery;
})();
