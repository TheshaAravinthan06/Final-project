"use client";

import { FiHeart, FiMapPin, FiMessageCircle, FiFileText } from "react-icons/fi";
import { ProfileGridItem } from "./types";
import { getImageSrc } from "./profileUtils";

type Props = {
  posts: ProfileGridItem[];
  emptyText: string;
  onOpenItem: (item: ProfileGridItem) => void;
};

export default function ProfilePostGrid({
  posts,
  emptyText,
  onOpenItem,
}: Props) {
  if (!posts.length) {
    return <div className="profile-empty-state">{emptyText}</div>;
  }

  return (
    <div className="profile-post-grid">
      {posts.map((item) => {
        const imageSrc =
          item.type === "blog"
            ? getImageSrc(item.coverImage)
            : getImageSrc(item.imageUrl);

        const captionText =
          item.type === "blog"
            ? item.title || item.excerpt || "Blog"
            : item.caption || "Post";

        return (
          <article
            key={`${item.type}-${item._id}`}
            className="profile-post-card"
            onClick={() => onOpenItem(item)}
          >
            <img src={imageSrc} alt={captionText} />

            {item.type === "blog" && (
              <div className="profile-post-card__badge">
                <FiFileText />
                <span>Blog</span>
              </div>
            )}

            <div className="profile-post-card__overlay">
              <div className="profile-post-card__stats">
                <span>
                  <FiHeart />
                  {item.likesCount || 0}
                </span>

                <span>
                  <FiMessageCircle />
                  {item.commentsCount || 0}
                </span>
              </div>

              {item.location && (
                <span className="profile-post-card__location">
                  <FiMapPin />
                  {item.location}
                </span>
              )}

              <p>{captionText}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}