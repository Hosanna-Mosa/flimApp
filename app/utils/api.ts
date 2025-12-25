// Support Expo environment variables without requiring @types/node
const API_BASE =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((globalThis as any)?.process?.env?.EXPO_PUBLIC_API_URL as string) ||
  'http://10.212.182.150:8000';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
}

const buildHeaders = (token?: string, headers?: Record<string, string>) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...headers,
});

const request = async <T>(
  path: string,
  { method = 'GET', body, token, headers }: RequestOptions = {}
): Promise<T> => {
  console.log(`[API Request] ${method} ${path}`, body ? JSON.stringify(body) : '');
  
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: buildHeaders(token, headers),
      body: body ? JSON.stringify(body) : undefined,
    });

    console.log(`[API Response Status] ${res.status} ${res.url}`);

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = (json && json.message) || res.statusText || 'Request failed';
      console.error(`[API Error] ${res.status}: ${message}`);
      throw new Error(message);
    }
    console.log(`[API Response Data]`, JSON.stringify(json.data ?? json, null, 2));
    return json.data ?? json;
  } catch (error) {
    console.error(`[API Network Error] ${path}`, error);
    throw error;
  }
};

// Auth
export const apiLogin = (identifier: string) =>
  request<{ otpSent: boolean; userExists: boolean; message: string }>(
    '/auth/login',
    { method: 'POST', body: { identifier } }
  );

export const apiVerifyOtp = (identifier: string, otp: string) =>
  request<{ user: unknown; accessToken: string; refreshToken: string }>(
    '/auth/verify-otp',
    { method: 'POST', body: { identifier, otp } }
  );

export const apiRefresh = (refreshToken: string) =>
  request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });

export const apiLogout = (refreshToken: string, token?: string) =>
  request('/auth/logout', {
    method: 'POST',
    body: { refreshToken },
    token,
  });

export const apiRegister = (payload: {
  name: string;
  phone: string;
  password: string;
  roles: string[];
  industries: string[];
}) =>
  request<{ user: unknown; accessToken: string; refreshToken: string }>(
    '/auth/register',
    { method: 'POST', body: payload }
  );

export const apiLoginPassword = (payload: { phone: string; password: string }) =>
  request<{ user: unknown; accessToken: string; refreshToken: string }>(
    '/auth/login-password',
    { method: 'POST', body: payload }
  );

export const apiVerifyPassword = (password: string, token?: string) =>
  request<{ success: boolean }>('/auth/verify-password', {
    method: 'POST',
    body: { password },
    token,
  });

export const apiChangePassword = (
  currentPassword: string,
  newPassword: string,
  token?: string
) =>
  request<{ success: boolean; message: string }>('/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
    token,
  });

// Users
export const apiGetMe = (token?: string) => request('/users/me', { token });

export const apiUpdateMe = (payload: Record<string, unknown>, token?: string) =>
  request('/users/me', { method: 'PUT', body: payload, token });

export const apiGetUser = (id: string, token?: string) =>
  request(`/users/${id}`, { token });

export const apiSearchUsers = (
  params: { q?: string; roles?: string[]; industries?: string[] },
  token?: string
) => {
  const query = new URLSearchParams();
  if (params.q) query.append('q', params.q);
  params.roles?.forEach((r) => query.append('roles', r));
  params.industries?.forEach((i) => query.append('industries', i));
  return request(`/users?${query.toString()}`, { token });
};

// Media
export const apiGetMediaSignature = (
  type: 'image' | 'video' | 'audio' | 'script',
  token?: string
) =>
  request<{
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    folder: string;
    params: Record<string, any>;
    uploadPreset?: string;
  }>('/media/signature', { method: 'POST', body: { type }, token });

export const apiValidateMedia = (
  type: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any,
  token?: string
) =>
  request('/media/validate', {
    method: 'POST',
    body: { type, metadata },
    token,
  });

// Posts
export const apiCreatePost = (
  payload: {
    type: 'video' | 'audio' | 'image' | 'script';
    mediaUrl?: string; // Legacy
    thumbnailUrl?: string; // Legacy
    caption?: string;
    industries?: string[];
    roles?: string[];
    // New fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    media?: any; 
    format?: string;
    duration?: number;
    size?: number;
    width?: number;
    height?: number;
    pages?: number;
    thumbnail?: string;
  },
  token?: string
) => request('/posts', { method: 'POST', body: payload, token });

export const apiDeletePost = (id: string, token?: string) =>
  request(`/posts/${id}`, { method: 'DELETE', token });

export const apiFeed = (token?: string) => request('/posts/feed', { token });

export const apiTrending = (token?: string) =>
  request('/posts/trending', { token });

export const apiUserPosts = (userId: string, token?: string) =>
  request(`/posts/user/${userId}`, { token });

export const apiGetPost = (postId: string, token?: string) =>
  request(`/posts/${postId}`, { token });

// Communities
export const apiCreateCommunity = (
  payload: {
    name: string;
    description?: string;
    type: 'industry' | 'role' | 'project';
    industry?: string;
    role?: string;
  },
  token?: string
) => request('/communities', { method: 'POST', body: payload, token });

export const apiCommunities = (token?: string) =>
  request('/communities', { token });

export const apiCommunity = (id: string, token?: string) =>
  request(`/communities/${id}`, { token });

export const apiJoinCommunity = (id: string, token?: string) =>
  request(`/communities/${id}/join`, { method: 'POST', token });

export const apiLeaveCommunity = (id: string, token?: string) =>
  request(`/communities/${id}/leave`, { method: 'POST', token });

// Messages
export const apiConversation = (userId: string, token?: string) =>
  request(`/messages/${userId}`, { token });

export const apiDeleteMessage = (messageId: string, token?: string) =>
  request(`/messages/${messageId}`, { method: 'DELETE', token });

export const apiGetConversations = (token?: string) =>
  request('/messages', { token });

// Notifications
export const apiNotifications = (token?: string) =>
  request('/notifications', { token });

export const apiMarkAllNotificationsRead = (token?: string) =>
  request('/notifications/read-all', { method: 'POST', token });

export const apiMarkNotificationRead = (id: string, token?: string) =>
  request(`/notifications/${id}/read`, { method: 'POST', token });

export const apiRegisterPushToken = (pushToken: string, token?: string) =>
  request('/notifications/register-token', {
    method: 'POST',
    body: { token: pushToken },
    token,
  });

// ========== SOCIAL MEDIA FEATURES ==========

// Likes
export const apiLikePost = (postId: string, token?: string) =>
  request<{ success: boolean; message: string; likesCount: number }>(
    `/api/posts/${postId}/like`,
    { method: 'POST', token }
  );

export const apiUnlikePost = (postId: string, token?: string) =>
  request<{ success: boolean; message: string; likesCount: number }>(
    `/api/posts/${postId}/like`,
    { method: 'DELETE', token }
  );

export const apiGetPostLikes = (
  postId: string,
  page = 0,
  limit = 20,
  token?: string
) =>
  request<{
    success: boolean;
    data: Array<{ name: string; avatar: string; isVerified: boolean }>;
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/api/posts/${postId}/likes?page=${page}&limit=${limit}`, { token });

export const apiGetUserLikedPosts = (
  userId: string,
  page = 0,
  limit = 20,
  token?: string
) =>
  request(`/api/users/${userId}/liked?page=${page}&limit=${limit}`, { token });

export const apiHasLiked = (postId: string, token?: string) =>
  request<{ success: boolean; liked: boolean }>(
    `/api/posts/${postId}/liked`,
    { token }
  );

// Follows
export const apiFollowUser = (userId: string, token?: string) =>
  request<{
    success: boolean;
    message: string;
    status: 'pending' | 'accepted';
    followingCount?: number;
    followersCount?: number;
  }>(`/api/users/${userId}/follow`, { method: 'POST', token });

export const apiUnfollowUser = (userId: string, token?: string) =>
  request<{
    success: boolean;
    message: string;
    followingCount: number;
    followersCount: number;
  }>(`/api/users/${userId}/follow`, { method: 'DELETE', token });

export const apiGetFollowers = (
  userId: string,
  page = 0,
  limit = 20,
  token?: string
) =>
  request(
    `/api/users/${userId}/followers?page=${page}&limit=${limit}`,
    { token }
  );

export const apiGetFollowing = (
  userId: string,
  page = 0,
  limit = 20,
  token?: string
) =>
  request(
    `/api/users/${userId}/following?page=${page}&limit=${limit}`,
    { token }
  );

export const apiGetPendingRequests = (page = 0, limit = 20, token?: string) =>
  request(`/api/follow-requests?page=${page}&limit=${limit}`, { token });

export const apiAcceptFollowRequest = (userId: string, token?: string) =>
  request(`/api/follow-requests/${userId}/accept`, {
    method: 'POST',
    token,
  });

export const apiRejectFollowRequest = (userId: string, token?: string) =>
  request(`/api/follow-requests/${userId}/reject`, {
    method: 'POST',
    token,
  });

export const apiIsFollowing = (userId: string, token?: string) =>
  request<{ success: boolean; following: boolean }>(
    `/api/users/${userId}/following-status`,
    { token }
  );

export const apiGetMutualFollowers = (userId: string, token?: string) =>
  request<{ success: boolean; count: number }>(
    `/api/users/${userId}/mutual-followers`,
    { token }
  );

// Comments
export const apiAddComment = (
  postId: string,
  content: string,
  parentCommentId?: string,
  token?: string
) =>
  request<{
    success: boolean;
    message: string;
    data: {
      _id: string;
      content: string;
      user: { name: string; avatar: string; isVerified: boolean };
      createdAt: string;
    };
  }>(`/api/posts/${postId}/comments`, {
    method: 'POST',
    body: { content, parentCommentId },
    token,
  });

export const apiGetComments = (
  postId: string,
  page = 0,
  limit = 20,
  sortBy: 'recent' | 'popular' = 'recent',
  token?: string
) =>
  request(
    `/api/posts/${postId}/comments?page=${page}&limit=${limit}&sortBy=${sortBy}`,
    { token }
  );

export const apiGetCommentReplies = (
  commentId: string,
  page = 0,
  limit = 10,
  token?: string
) =>
  request(
    `/api/comments/${commentId}/replies?page=${page}&limit=${limit}`,
    { token }
  );

export const apiEditComment = (
  commentId: string,
  content: string,
  token?: string
) =>
  request(`/api/comments/${commentId}`, {
    method: 'PUT',
    body: { content },
    token,
  });

export const apiDeleteComment = (commentId: string, token?: string) =>
  request(`/api/comments/${commentId}`, { method: 'DELETE', token });

export const apiLikeComment = (commentId: string, token?: string) =>
  request(`/api/comments/${commentId}/like`, { method: 'POST', token });

export const apiGetUserComments = (
  userId: string,
  page = 0,
  limit = 20,
  token?: string
) =>
  request(`/api/users/${userId}/comments?page=${page}&limit=${limit}`, {
    token,
  });

// Shares
export const apiSharePost = (
  postId: string,
  payload: {
    shareType?: 'repost' | 'quote' | 'external';
    caption?: string;
    platform?: 'whatsapp' | 'twitter' | 'facebook' | 'instagram' | 'other';
  },
  token?: string
) =>
  request<{ success: boolean; message: string; data: unknown }>(
    `/api/posts/${postId}/share`,
    { method: 'POST', body: payload, token }
  );

export const apiGetPostShares = (
  postId: string,
  page = 0,
  limit = 20,
  token?: string
) =>
  request(`/api/posts/${postId}/shares?page=${page}&limit=${limit}`, {
    token,
  });

export const apiGetUserShares = (
  userId: string,
  page = 0,
  limit = 20,
  token?: string
) =>
  request(`/api/users/${userId}/shares?page=${page}&limit=${limit}`, {
    token,
  });

export const apiDeleteShare = (shareId: string, token?: string) =>
  request(`/api/shares/${shareId}`, { method: 'DELETE', token });

export const apiGetShareStats = (postId: string, token?: string) =>
  request(`/api/posts/${postId}/share-stats`, { token });

// Feeds
export const apiGetFeed = (
  page = 0,
  limit = 20,
  algorithm: 'hybrid' | 'chronological' | 'engagement' = 'hybrid',
  timeRange = 7,
  token?: string
) =>
  request(
    `/api/feed?page=${page}&limit=${limit}&algorithm=${algorithm}&timeRange=${timeRange}`,
    { token }
  );

export const apiGetTrendingFeed = (page = 0, limit = 20, token?: string) =>
  request(`/api/feed/trending?page=${page}&limit=${limit}`, { token });

export const apiGetIndustryFeed = (
  industry: string,
  page = 0,
  limit = 20,
  token?: string
) =>
  request(`/api/feed/industry/${industry}?page=${page}&limit=${limit}`, {
    token,
  });

export const apiGetUserFeed = (
  userId: string,
  page = 0,
  limit = 20,
  token?: string
) =>
  request(`/api/feed/users/${userId}/posts?page=${page}&limit=${limit}`, {
    token,
  });

export const apiInvalidateFeed = (token?: string) =>
  request('/api/feed/invalidate', { method: 'POST', token });

export const api = {
  login: apiLogin,
  verifyOtp: apiVerifyOtp,
  refresh: apiRefresh,
  logout: apiLogout,
  me: apiGetMe,
  updateMe: apiUpdateMe,
  user: apiGetUser,
  searchUsers: apiSearchUsers,
  getMediaSignature: apiGetMediaSignature,
  validateMedia: apiValidateMedia,
  createPost: apiCreatePost,
  deletePost: apiDeletePost,
  getPost: apiGetPost,
  feed: apiFeed,
  trending: apiTrending,
  userPosts: apiUserPosts,
  createCommunity: apiCreateCommunity,
  communities: apiCommunities,
  community: apiCommunity,
  joinCommunity: apiJoinCommunity,
  leaveCommunity: apiLeaveCommunity,
  conversation: apiConversation,
  notifications: apiNotifications,
  markNotificationRead: apiMarkNotificationRead,
  registerPushToken: apiRegisterPushToken,
  register: apiRegister,
  loginPassword: apiLoginPassword,
  verifyPassword: apiVerifyPassword,
  changePassword: apiChangePassword,
  
  // Social Media Features
  likePost: apiLikePost,
  unlikePost: apiUnlikePost,
  getPostLikes: apiGetPostLikes,
  getUserLikedPosts: apiGetUserLikedPosts,
  hasLiked: apiHasLiked,
  
  followUser: apiFollowUser,
  unfollowUser: apiUnfollowUser,
  getFollowers: apiGetFollowers,
  getFollowing: apiGetFollowing,
  getPendingRequests: apiGetPendingRequests,
  acceptFollowRequest: apiAcceptFollowRequest,
  rejectFollowRequest: apiRejectFollowRequest,
  isFollowing: apiIsFollowing,
  getMutualFollowers: apiGetMutualFollowers,
  
  addComment: apiAddComment,
  getComments: apiGetComments,
  getCommentReplies: apiGetCommentReplies,
  editComment: apiEditComment,
  deleteComment: apiDeleteComment,
  likeComment: apiLikeComment,
  getUserComments: apiGetUserComments,
  
  sharePost: apiSharePost,
  getPostShares: apiGetPostShares,
  getUserShares: apiGetUserShares,
  deleteShare: apiDeleteShare,
  getShareStats: apiGetShareStats,
  
  getFeed: apiGetFeed,
  getTrendingFeed: apiGetTrendingFeed,
  getIndustryFeed: apiGetIndustryFeed,
  getUserFeed: apiGetUserFeed,
  invalidateFeed: apiInvalidateFeed,
};

export default api;

