"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import {
  FiHeart,
  FiMessageCircle,
  FiBookmark,
  FiSend,
  FiX,
} from "react-icons/fi";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getImageSrc = (imageUrl?: string) => {
  if (!imageUrl) return "/images/ella.jpg";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BACKEND_URL}${imageUrl}`;
};

const getProfileSrc = (profileImage?: string) => {
  if (!profileImage) return "/images/user-avatar.jpg";
  if (profileImage.startsWith("http")) return profileImage;
  return `${BACKEND_URL}${profileImage}`;
};

const formatCommentDate = (dateString?: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export default function BlogDetail() {
  const { id } = useParams();
  const router = useRouter();

  const [blog, setBlog] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const [commentText, setCommentText] = useState("");
  const [drawerCommentText, setDrawerCommentText] = useState("");
  const [showResponses, setShowResponses] = useState(false);

  useEffect(() => {
    const loadBlog = async () => {
      try {
        const res = await api.get(`/blogs/${id}`);
        const fetchedBlog = res.data.blog;
        setBlog(fetchedBlog);
        setLiked(Boolean(fetchedBlog?.isLiked));
        setSaved(Boolean(fetchedBlog?.isSaved));
        setLikesCount(fetchedBlog?.likesCount || 0);
      } catch (error) {
        console.error("Failed to load blog:", error);
      }
    };

    if (id) {
      loadBlog();
    }
  }, [id]);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (showResponses) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showResponses]);

  const coverSrc = useMemo(() => getImageSrc(blog?.coverImage), [blog?.coverImage]);

  if (!blog) {
    return <div className="blog-detail-loading">Loading blog...</div>;
  }

  const comments = Array.isArray(blog.comments) ? blog.comments : [];
  const previewComments = comments.slice(0, 2);

  const handleLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev: number) =>
      nextLiked ? prev + 1 : Math.max(prev - 1, 0)
    );

    try {
      if (nextLiked) {
        await api.post(`/blogs/${blog._id}/like`);
      } else {
        await api.post(`/blogs/${blog._id}/unlike`);
      }
    } catch (error) {
      console.error("Blog like failed:", error);
      setLiked(!nextLiked);
      setLikesCount((prev: number) =>
        nextLiked ? Math.max(prev - 1, 0) : prev + 1
      );
    }
  };

  const handleSave = async () => {
    const nextSaved = !saved;
    setSaved(nextSaved);

    try {
      if (nextSaved) {
        await api.post(`/blogs/${blog._id}/save`);
      } else {
        await api.post(`/blogs/${blog._id}/unsave`);
      }
    } catch (error) {
      console.error("Blog save failed:", error);
      setSaved(!nextSaved);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/blogs/${blog._id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt || "Check this blog",
          url: shareUrl,
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {}
    }
  };

  const submitComment = async (textValue: string, clear: () => void) => {
    if (!textValue.trim()) return;

    try {
      const res = await api.post(`/blogs/${blog._id}/comment`, {
        text: textValue.trim(),
      });

      const updatedBlog = res.data?.blog;
      if (updatedBlog) {
        setBlog(updatedBlog);
        setLikesCount(updatedBlog?.likesCount || likesCount);
        setLiked(Boolean(updatedBlog?.isLiked));
        setSaved(Boolean(updatedBlog?.isSaved));
      }

      clear();
    } catch (error) {
      console.error("Blog comment failed:", error);
      alert("Failed to comment.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
  try {
    const res = await api.delete(`/blogs/${blog._id}/comment/${commentId}`);
    const updatedBlog = res.data?.blog;

    if (updatedBlog) {
      setBlog(updatedBlog);
      setLikesCount(updatedBlog?.likesCount || 0);
      setLiked(Boolean(updatedBlog?.isLiked));
      setSaved(Boolean(updatedBlog?.isSaved));
    }
  } catch (error) {
    console.error("Delete comment failed:", error);
    alert("Failed to delete comment.");
  }
};

  const paragraphs = String(blog.content || "")
    .split("\n")
    .filter((line) => line.trim() !== "");

  return (
    <>
      <section className="blog-detail-page">
        <div className="blog-detail-shell">
          <article className="blog-detail-article">
            <header className="blog-detail-header">
              <p className="blog-detail-eyebrow">Travel Blog</p>

              <h1 className="blog-detail-title">{blog.title}</h1>

              <div className="blog-detail-meta">
                <div className="blog-detail-author">
                  <img
                    src={getProfileSrc(blog.author?.profileImage)}
                    alt={blog.author?.username || "author"}
                  />
                  <div>
                    <h4>{blog.author?.username || "User"}</h4>
                    <p>{formatCommentDate(blog.createdAt)}</p>
                  </div>
                </div>

                {user && blog.author?._id === user._id && (
                  <button
                    type="button"
                    className="blog-detail-edit-btn"
                    onClick={() => router.push(`/edit-blog/${blog._id}`)}
                  >
                    Edit
                  </button>
                )}
              </div>
            </header>

            <div className="blog-detail-cover">
              <img src={coverSrc} alt={blog.title} />
            </div>

            <div className="blog-detail-content">
              {paragraphs.length > 0 ? (
                paragraphs.map((para, index) => <p key={index}>{para}</p>)
              ) : (
                <p>{blog.content}</p>
              )}
            </div>

            <div className="blog-detail-actions">
              <div className="blog-detail-actions__left">
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
                  onClick={() => setShowResponses(true)}
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

            <div className="blog-detail-stats">
              <p>{likesCount} likes</p>
              <p>{comments.length} responses</p>
            </div>

            <div className="blog-detail-comment-box">
              <input
                type="text"
                placeholder="Write a response..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button
                type="button"
                onClick={() =>
                  submitComment(commentText, () => setCommentText(""))
                }
              >
                Respond
              </button>
            </div>

            <div className="blog-detail-responses-preview">
              <h3>Responses</h3>

              {previewComments.length > 0 ? (
                previewComments.map((comment: any) => (
  <div className="blog-detail-response-card" key={comment._id}>
    <div className="blog-detail-response-card__head">
      <div className="blog-detail-response-user">
        <img
          src={getProfileSrc(comment.user?.profileImage)}
          alt={comment.user?.username || "user"}
        />
        <div>
          <strong>{comment.user?.username || "User"}</strong>
          <span>{formatCommentDate(comment.createdAt)}</span>
        </div>
      </div>

      {user?._id === comment.user?._id && (
        <button
          type="button"
          className="blog-comment-delete-btn"
          onClick={() => handleDeleteComment(comment._id)}
        >
          Delete
        </button>
      )}
    </div>

    <p>{comment.text}</p>
  </div>
))
              ) : (
                <p className="blog-detail-empty-responses">
                  No responses yet.
                </p>
              )}

              {comments.length > 2 && (
                <button
                  type="button"
                  className="blog-detail-see-all"
                  onClick={() => setShowResponses(true)}
                >
                  See all responses
                </button>
              )}
            </div>
          </article>
        </div>
      </section>

      <div
        className={`blog-responses-overlay ${
          showResponses ? "blog-responses-overlay--open" : ""
        }`}
        onClick={() => setShowResponses(false)}
      >
        <aside
          className={`blog-responses-drawer ${
            showResponses ? "blog-responses-drawer--open" : ""
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="blog-responses-drawer__header">
            <h2>Responses ({comments.length})</h2>
            <button type="button" onClick={() => setShowResponses(false)}>
              <FiX />
            </button>
          </div>

          <div className="blog-responses-drawer__composer">
            <div className="blog-responses-drawer__composer-user">
              <div className="blog-responses-drawer__avatar">
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <span>{user?.username || "User"}</span>
            </div>

            <textarea
              placeholder="What are your thoughts?"
              value={drawerCommentText}
              onChange={(e) => setDrawerCommentText(e.target.value)}
            />

            <div className="blog-responses-drawer__composer-actions">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setDrawerCommentText("")}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() =>
                  submitComment(drawerCommentText, () =>
                    setDrawerCommentText("")
                  )
                }
              >
                Respond
              </button>
            </div>
          </div>

          <div className="blog-responses-drawer__list">
            {comments.length > 0 ? (
              comments.map((comment: any) => (
  <div className="blog-responses-item" key={comment._id}>
    <div className="blog-responses-item__head">
      <div className="blog-detail-response-user">
        <img
          src={getProfileSrc(comment.user?.profileImage)}
          alt={comment.user?.username || "user"}
        />
        <div>
          <strong>{comment.user?.username || "User"}</strong>
          <span>{formatCommentDate(comment.createdAt)}</span>
        </div>
      </div>

      {user?._id === comment.user?._id && (
        <button
          type="button"
          className="blog-comment-delete-btn"
          onClick={() => handleDeleteComment(comment._id)}
        >
          Delete
        </button>
      )}
    </div>

    <p>{comment.text}</p>
  </div>
))
            ) : (
              <p className="blog-detail-empty-responses">
                No responses yet.
              </p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}