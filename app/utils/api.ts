// Support Expo environment variables without requiring @types/node

import Constants from 'expo-constants';

const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ?? Constants.manifest?.extra?.apiUrl;

const API_BASE = API_BASE_URL
  ? API_BASE_URL
  : ((globalThis as any)?.process?.env?.EXPO_PUBLIC_API_URL as string) ||
  'http://10.18.107.42:8000';
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
      // console.error(`[API Error] ${res.status}: ${message}`);
      throw new Error(message);
    }
    console.log(`[API Response Data] ${path}`, JSON.stringify(json.data ?? json, null, 2));
    return json.data ?? json;
  } catch (error) {
    // console.error(`[API Network Error] ${path}`, error);
    throw error;
  }
};

// Auth
export const apiSendOtp = (phone: string) =>
  request<{ message: string }>('/auth/send-otp', {
    method: 'POST',
    body: { phone },
  });

export const apiVerifyOtp = (
  phone: string,
  otp: string,
  details?: { name?: string; email?: string; password?: string }
) =>
  request<{ user: unknown; accessToken: string; refreshToken: string }>(
    '/auth/verify-otp',
    {
      method: 'POST',
      body: { phone, otp, ...details },
    }
  );

export const apiLogin = (identifier: string) =>
  // Use sendOtp internally or keep legacy if needed, but for now we follow new flow
  apiSendOtp(identifier);

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
  email: string;
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

export const apiForgotPassword = (email: string) =>
  request<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });

export const apiResetPassword = (email: string, otp: string, newPassword: string) =>
  request<{ success: boolean; message: string }>('/auth/reset-password', {
    method: 'POST',
    body: { email, otp, newPassword },
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

export const apiUpdatePost = (
  id: string,
  payload: {
    caption?: string;
    industries?: string[];
    roles?: string[];
    visibility?: 'public' | 'followers' | 'private';
  },
  token?: string
) => request(`/posts/${id}`, { method: 'PUT', body: payload, token });

export const apiFeed = (token?: string) => request('/posts/feed', { token });

export const apiTrending = (token?: string) =>
  request('/posts/trending', { token });

export const apiUserPosts = (userId: string, token?: string) =>
  request(`/posts/user/${userId}`, { token });

export const apiGetPost = (postId: string, token?: string) =>
  request(`/posts/${postId}`, { token });

// Communities
// Communities
export const apiCreateCommunity = (
  payload: {
    name: string;
    description?: string;
    avatar?: string;
    coverImage?: string;
    type: 'industry' | 'role' | 'project' | 'general';
    industry?: string;
    role?: string;
    privacy?: 'public' | 'private' | 'invite-only';
    tags?: string[];
  },
  token?: string
) => request('/communities', { method: 'POST', body: payload, token });

export const apiCommunities = (
  params?: {
    type?: string;
    industry?: string;
    role?: string;
    privacy?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
  token?: string
) => {
  const query = new URLSearchParams();
  if (params?.type) query.append('type', params.type);
  if (params?.industry) query.append('industry', params.industry);
  if (params?.role) query.append('role', params.role);
  if (params?.privacy) query.append('privacy', params.privacy);
  if (params?.search) query.append('search', params.search);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  return request(`/communities?${query.toString()}`, { token });
};

export const apiMyCommunities = (page = 0, limit = 20, token?: string) =>
  request(`/communities/my?page=${page}&limit=${limit}`, { token });

export const apiCommunity = (id: string, token?: string) =>
  request(`/communities/${id}`, { token });

export const apiUpdateCommunity = (
  id: string,
  payload: any,
  token?: string
) => request(`/communities/${id}`, { method: 'PUT', body: payload, token });

export const apiDeleteCommunity = (id: string, token?: string) =>
  request(`/communities/${id}`, { method: 'DELETE', token });

export const apiJoinCommunity = (id: string, token?: string) =>
  request(`/communities/${id}/join`, { method: 'POST', token });

export const apiLeaveCommunity = (id: string, token?: string) =>
  request(`/communities/${id}/leave`, { method: 'POST', token });

export const apiApproveJoinRequest = (communityId: string, userId: string, token?: string) =>
  request(`/communities/${communityId}/requests/${userId}/approve`, { method: 'POST', token });

export const apiRejectJoinRequest = (communityId: string, userId: string, token?: string) =>
  request(`/communities/${communityId}/requests/${userId}/reject`, { method: 'POST', token });

// Community Members
export const apiCommunityMembers = (
  id: string,
  page = 0,
  limit = 50,
  token?: string
) => request(`/communities/${id}/members?page=${page}&limit=${limit}`, { token });

export const apiUpdateMemberRole = (
  communityId: string,
  userId: string,
  role: 'admin' | 'moderator' | 'member',
  token?: string
) =>
  request(`/communities/${communityId}/members/${userId}/role`, {
    method: 'PUT',
    body: { role },
    token
  });

export const apiRemoveMember = (
  communityId: string,
  userId: string,
  token?: string
) =>
  request(`/communities/${communityId}/members/${userId}`, {
    method: 'DELETE',
    token
  });

// Community Groups
export const apiCreateGroup = (
  communityId: string,
  payload: {
    name: string;
    description?: string;
    type?: 'announcement' | 'discussion' | 'general';
    isAnnouncementOnly?: boolean;
  },
  token?: string
) => request(`/communities/${communityId}/groups`, { method: 'POST', body: payload, token });

export const apiCommunityGroups = (communityId: string, token?: string) =>
  request(`/communities/${communityId}/groups`, { token });

export const apiJoinGroup = (
  communityId: string,
  groupId: string,
  token?: string
) => request(`/communities/${communityId}/groups/${groupId}/join`, { method: 'POST', token });

export const apiLeaveGroup = (
  communityId: string,
  groupId: string,
  token?: string
) => request(`/communities/${communityId}/groups/${groupId}/leave`, { method: 'POST', token });

export const apiUpdateGroup = (
  communityId: string,
  groupId: string,
  payload: any,
  token?: string
) => request(`/communities/${communityId}/groups/${groupId}`, { method: 'PUT', body: payload, token });

export const apiDeleteGroup = (
  communityId: string,
  groupId: string,
  token?: string
) => request(`/communities/${communityId}/groups/${groupId}`, { method: 'DELETE', token });

// Community Posts
export const apiDeleteCommunityPost = (
  communityId: string,
  postId: string,
  token?: string
) => request(`/communities/${communityId}/posts/${postId}`, { method: 'DELETE', token });

export const apiCreateCommunityPost = (
  communityId: string,
  payload: {
    groupId: string;
    type?: 'text' | 'image' | 'video' | 'poll' | 'announcement';
    content: string;
    media?: any[];
    poll?: any;
  },
  token?: string
) => request(`/communities/${communityId}/posts`, { method: 'POST', body: payload, token });

export const apiCommunityFeed = (
  communityId: string,
  page = 0,
  limit = 20,
  token?: string
) => request(`/communities/${communityId}/posts?page=${page}&limit=${limit}`, { token });

export const apiGroupPosts = (
  communityId: string,
  groupId: string,
  page = 0,
  limit = 20,
  token?: string
) => request(`/communities/${communityId}/groups/${groupId}/posts?page=${page}&limit=${limit}`, { token });

export const apiLikeCommunityPost = (
  communityId: string,
  postId: string,
  token?: string
) => request(`/communities/${communityId}/posts/${postId}/like`, { method: 'POST', token });

export const apiUnlikeCommunityPost = (
  communityId: string,
  postId: string,
  token?: string
) => request(`/communities/${communityId}/posts/${postId}/like`, { method: 'DELETE', token });

export const apiVotePoll = (
  communityId: string,
  postId: string,
  optionIndex: number,
  token?: string
) => request(`/communities/${communityId}/posts/${postId}/vote`, { method: 'POST', body: { optionIndex }, token });

export const apiPinPost = (
  communityId: string,
  postId: string,
  token?: string
) => request(`/communities/${communityId}/posts/${postId}/pin`, { method: 'POST', token });


// Messages
export const apiConversation = (userId: string, token?: string) =>
  request(`/messages/${userId}`, { token });

export const apiDeleteMessage = (messageId: string, token?: string) =>
  request(`/messages/${messageId}`, { method: 'DELETE', token });

export const apiGetConversations = (token?: string, q?: string) =>
  request(`/messages${q ? `?q=${encodeURIComponent(q)}` : ''}`, { token });

export const apiMarkConversationRead = (senderId: string, token?: string) =>
  request(`/messages/${senderId}/read`, { method: 'POST', token });

export const apiGetUnreadMessageCount = (token?: string) =>
  request<{ count: number }>('/messages/unread-count', { token });

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
  token?: string,
  q?: string
) =>
  request(
    `/api/users/${userId}/followers?page=${page}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ''}`,
    { token }
  );

export const apiGetFollowing = (
  userId: string,
  page = 0,
  limit = 20,
  token?: string,
  q?: string
) =>
  request(
    `/api/users/${userId}/following?page=${page}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ''}`,
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

export const apiGetFollowStatus = (userId: string, token?: string) =>
  request<{ success: boolean; status: 'pending' | 'accepted' | null; isFollowing: boolean }>(
    `/api/users/${userId}/follow-status`,
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
  timeRange = 36500,
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

// Verification
export const apiSubmitVerificationRequest = (
  payload: {
    verificationType: string;
    reason: string;
    documents: Array<{ type: string; url: string; name: string }>;
  },
  token?: string
) => request('/verification/request', { method: 'POST', body: payload, token });

export const apiGetVerificationStatus = (token?: string) =>
  request('/verification/status', { token });

// Subscriptions
export const apiCreateSubscriptionOrder = (
  planType: '1_MONTH' | '3_MONTHS' | '6_MONTHS' | '9_MONTHS',
  token?: string
) =>
  request<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  }>('/subscriptions/create-order', { method: 'POST', body: { planType }, token });

export const apiVerifySubscriptionPayment = (
  payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  },
  token?: string
) =>
  request<{ success: boolean; message: string; subscription: any }>(
    '/subscriptions/verify-payment',
    { method: 'POST', body: payload, token }
  );

// Saved Posts
export const apiToggleSavePost = (postId: string, token?: string) =>
  request<{ saved: boolean; savedPostsCount: number }>(`/posts/${postId}/save`, {
    method: 'POST',
    token,
  });

export const apiGetSavedPosts = (page = 0, limit = 20, token?: string) =>
  request(`/users/me/saved?page=${page}&limit=${limit}`, { token });

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
  updatePost: apiUpdatePost,
  deletePost: apiDeletePost,
  getPost: apiGetPost,
  feed: apiFeed,
  trending: apiTrending,
  userPosts: apiUserPosts,
  createCommunity: apiCreateCommunity,
  communities: apiCommunities,
  myCommunities: apiMyCommunities,
  community: apiCommunity,
  updateCommunity: apiUpdateCommunity,
  deleteCommunity: apiDeleteCommunity,
  joinCommunity: apiJoinCommunity,
  leaveCommunity: apiLeaveCommunity,
  approveJoinRequest: apiApproveJoinRequest,
  rejectJoinRequest: apiRejectJoinRequest,

  // Community Members
  communityMembers: apiCommunityMembers,
  updateMemberRole: apiUpdateMemberRole,
  removeMember: apiRemoveMember,

  // Community Groups
  createGroup: apiCreateGroup,
  communityGroups: apiCommunityGroups,
  joinGroup: apiJoinGroup,
  leaveGroup: apiLeaveGroup,
  updateGroup: apiUpdateGroup,
  deleteGroup: apiDeleteGroup,

  // Community Posts
  createCommunityPost: apiCreateCommunityPost,
  deleteCommunityPost: apiDeleteCommunityPost,
  communityFeed: apiCommunityFeed,
  groupPosts: apiGroupPosts,
  likeCommunityPost: apiLikeCommunityPost,
  unlikeCommunityPost: apiUnlikeCommunityPost,
  votePoll: apiVotePoll,
  pinPost: apiPinPost,

  conversation: apiConversation,
  markConversationRead: apiMarkConversationRead,
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
  getFollowStatus: apiGetFollowStatus,
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
  submitVerificationRequest: apiSubmitVerificationRequest,
  getVerificationStatus: apiGetVerificationStatus,
  toggleSavePost: apiToggleSavePost,
  getSavedPosts: apiGetSavedPosts,

  // Subscriptions
  apiCreateSubscriptionOrder,
  apiVerifySubscriptionPayment
};

export default api;

