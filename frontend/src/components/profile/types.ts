export type UserProfilePost = {
  _id: string;
  imageUrl?: string;
  caption?: string;
  location?: string;
  createdAt?: string;
  likesCount?: number;
  commentsCount?: number;
  type?: "post";
};

export type UserProfileBlog = {
  _id: string;
  title?: string;
  coverImage?: string;
  excerpt?: string;
  content?: string;
  location?: string;
  createdAt?: string;
  likesCount?: number;
  commentsCount?: number;
  type?: "blog";
};

export type ProfileGridItem =
  | (UserProfilePost & { type: "post" })
  | (UserProfileBlog & { type: "blog" });

export type ReviewUser = {
  _id?: string;
  name?: string;
  username?: string;
  profileImage?: string;
};

export type ReviewItem = {
  _id: string;
  rating?: number;
  text?: string;
  createdAt?: string;
  reviewer?: ReviewUser;
};

export type ProfileUser = {
  _id?: string;
  name?: string;
  username?: string;
  email?: string;
  profileImage?: string;
  bio?: string;
  travelInterest?: string;
  location?: string;
  work?: string;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
};export type UserProfilePost = {
  _id: string;
  imageUrl?: string;
  caption?: string;
  location?: string;
  createdAt?: string;
  likesCount?: number;
  commentsCount?: number;
  type?: "post";
};

export type UserProfileBlog = {
  _id: string;
  title?: string;
  coverImage?: string;
  excerpt?: string;
  content?: string;
  location?: string;
  createdAt?: string;
  likesCount?: number;
  commentsCount?: number;
  type?: "blog";
};

export type ProfileGridItem =
  | (UserProfilePost & { type: "post" })
  | (UserProfileBlog & { type: "blog" });

export type ReviewUser = {
  _id?: string;
  name?: string;
  username?: string;
  profileImage?: string;
};

export type ReviewItem = {
  _id: string;
  rating?: number;
  text?: string;
  createdAt?: string;
  reviewer?: ReviewUser;
};

export type ProfileUser = {
  _id?: string;
  name?: string;
  username?: string;
  email?: string;
  profileImage?: string;
  bio?: string;
  travelInterest?: string;
  location?: string;
  work?: string;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
};