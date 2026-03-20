"use client";

import { useState } from "react";
import {
  FiHeart,
  FiMessageCircle,
  FiBookmark,
  FiMoreHorizontal,
  FiSend,
} from "react-icons/fi";

type MockPost = {
  id: number;
  username: string;
  handle: string;
  avatar: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  time: string;
};

export default function FeedPostCard({ post }: { post: MockPost }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [commentsCount, setCommentsCount] = useState(post.comments);
  const [sharesCount, setSharesCount] = useState(post.shares);
  const [savesCount, setSavesCount] = useState(post.saves);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<string[]>([]);

  const handleLike = () => {
    setLiked((prev) => !prev);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const handleSave = () => {
    setSaved((prev) => !prev);
    setSavesCount((prev) => (saved ? prev - 1 : prev + 1));
  };

  const handleShare = async () => {
    setSharesCount((prev) => prev + 1);

    const shareUrl = `${window.location.origin}/home?diary=${post.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: post.username,
          text: post.caption,
          url: shareUrl,
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {}
    }
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    setCommentsList((prev) => [commentText.trim(), ...prev]);
    setCommentsCount((prev) => prev + 1);
    setCommentText("");
    setShowComments(true);
  };

  return (
    <article className="feed-card">
      <div className="feed-card__header">
        <div className="feed-card__user">
          <img src={post.avatar} alt={post.username} />
          <div>
            <h4>{post.username}</h4>
            <p>
              {post.handle} · {post.time}
            </p>
          </div>
        </div>

        <div className="feed-card__header-actions">
          <button type="button" className="follow-btn">
            Follow
          </button>

          <button type="button" className="icon-btn">
            <FiMoreHorizontal />
          </button>
        </div>
      </div>

      <div className="feed-card__image feed-card__image--square">
        <img src={post.image} alt={post.caption} />
      </div>

      <div className="feed-card__actions">
        <div className="feed-card__actions-left">
          <button
            type="button"
            className={`icon-btn ${liked ? "icon-btn--active" : ""}`}
            onClick={handleLike}
          >
            <FiHeart />
          </button>

          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowComments((prev) => !prev)}
          >
            <FiMessageCircle />
          </button>

          <button type="button" className="icon-btn" onClick={handleShare}>
            <FiSend />
          </button>
        </div>

        <button
          type="button"
          className={`icon-btn ${saved ? "icon-btn--active" : ""}`}
          onClick={handleSave}
        >
          <FiBookmark />
        </button>
      </div>

      <div className="feed-card__body">
        <div className="feed-stats">
          <span>{likesCount} likes</span>
          <span>{commentsCount} comments</span>
          <span>{savesCount} saves</span>
          <span>{sharesCount} shares</span>
        </div>

        <p>
          <span>{post.username}</span> {post.caption}
        </p>

        <div className="comment-box">
          <input
            type="text"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button type="button" onClick={handleComment}>
            Post
          </button>
        </div>

        {showComments && (
          <div className="comment-list">
            {commentsList.length === 0 ? (
              <p className="comment-empty">No comments yet.</p>
            ) : (
              commentsList.map((comment, index) => (
                <div key={`${comment}-${index}`} className="comment-item">
                  <strong>you</strong>
                  <span>{comment}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </article>
  );
}