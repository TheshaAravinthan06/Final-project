import { FiStar } from "react-icons/fi";
import { ReviewItem } from "./types";
import { formatDateShort, getInitials, getImageSrc } from "./profileUtils";

type Props = {
  reviews: ReviewItem[];
  emptyText: string;
};

export default function ProfileReviews({ reviews, emptyText }: Props) {
  if (!reviews.length) {
    return <div className="profile-empty-state">{emptyText}</div>;
  }

  return (
    <div className="profile-review-list">
      {reviews.map((review) => (
        <article className="profile-review-card" key={review._id}>
          <div className="profile-review-card__head">
            <div className="profile-review-card__user">
              <div className="profile-avatar profile-avatar--sm">
                {review.reviewer?.profileImage ? (
                  <img
                    src={getImageSrc(review.reviewer.profileImage)}
                    alt={review.reviewer.name || review.reviewer.username}
                  />
                ) : (
                  <div className="profile-avatar-fallback">
                    {getInitials(
                      review.reviewer?.name,
                      review.reviewer?.username
                    )}
                  </div>
                )}
              </div>
              <div className="profile-review-card__user-info">
                <h4>{review.reviewer?.name || review.reviewer?.username}</h4>
                <span>@{review.reviewer?.username}</span>
              </div>
            </div>

            <div className="profile-review-card__meta">
              <span>
                <FiStar /> {review.rating || 5}.0
              </span>
              <small>{formatDateShort(review.createdAt)}</small>
            </div>
          </div>

          <p className="profile-review-card__body">
            {review.text || "Great traveler and easy to connect with."}
          </p>
        </article>
      ))}
    </div>
  );
}
