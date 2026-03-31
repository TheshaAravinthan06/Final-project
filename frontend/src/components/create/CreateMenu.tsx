"use client";

type Props = {
  onSelectPost: () => void;
  onSelectBlog: () => void;
  onClose: () => void;
};

export default function CreateMenu({
  onSelectPost,
  onSelectBlog,
  onClose,
}: Props) {
  return (
    <>
      <div className="create-menu-backdrop" onClick={onClose} />

      <div className="create-menu">
        <button
          type="button"
          className="create-menu-item"
          onClick={onSelectPost}
        >
          <div className="create-menu-item__text">
            <strong>Post</strong>
            <span>Share a travel moment with photo and caption</span>
          </div>
          <span className="create-menu-icon">🖼️</span>
        </button>

        <button
          type="button"
          className="create-menu-item"
          onClick={onSelectBlog}
        >
          <div className="create-menu-item__text">
            <strong>Travel Blog</strong>
            <span>Write a full travel story on a separate page</span>
          </div>
          <span className="create-menu-icon">📝</span>
        </button>
      </div>
    </>
  );
}