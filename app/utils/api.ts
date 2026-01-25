// Support Expo environment variables without requiring @types/node

import Constants from 'expo-constants';

const API_BASE = Constants.expoConfig?.extra?.apiUrl ;


console.log('[API] Initializing with Base URL:', API_BASE);

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
  const fullUrl = `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
  console.log(`[API CALL] 🚀 ${method} ${fullUrl}`);

  try {
    const res = await fetch(fullUrl, {
      method,
      headers: {
        ...buildHeaders(token, headers),
        // Prevent browser caching to avoid 304 responses
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle 304 Not Modified responses - they have no body, so we need to retry without cache
    if (res.status === 304) {
      console.log(`[API RESP] ⚠️ 304 Not Modified for ${path}, retrying without cache...`);
      // Retry the request with cache-busting headers
      const retryRes = await fetch(fullUrl, {
        method,
        headers: {
          ...buildHeaders(token, headers),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!retryRes.ok) {
        const retryJson = await retryRes.json().catch(() => ({}));
        console.error(`[API ERR] 🔴 ${retryRes.status} for ${path}:`, retryJson.message || retryRes.statusText);
        const message = (retryJson && retryJson.message) || retryRes.statusText || 'Request failed';
        throw new Error(message);
      }

      const retryJson = await retryRes.json().catch(() => ({}));
      console.log(`[API RESP] ✅ ${retryRes.status} ${path} (after 304 retry)`);
      return retryJson;
    }

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error(`[API ERR] 🔴 ${res.status} for ${path}:`, json.message || res.statusText);
      const message = (json && json.message) || res.statusText || 'Request failed';
      const error = new Error(message);
      (error as any).logged = true;
      throw error;
    }

    console.log(`[API RESP] ✅ ${res.status} ${path}`);
    return json;
  } catch (error: any) {
    if (!error.logged) {
      console.error(`[API FATAL] 💥 Error calling ${path}:`, error.message);
    }
    throw error;
  }
};

// Helper to unwrap data safely
const unwrap = async (promise: Promise<any>) => {
  const res = await promise;
  if (!res) return res;

  // If we have success: true and a data property, return the data property
  if (res.success === true && res.data !== undefined) {
    // Sometimes data is nested again due to service-level wrapping
    if (res.data && res.data.success === true && res.data.data !== undefined) {
      return res.data.data;
    }
    return res.data;
  }

  return res;
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  API METHODS
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const apiSendOtp = (phone: string) => request('/auth/send-otp', { method: 'POST', body: { phone } });
export const apiVerifyOtp = (phone: string, otp: string, details?: any) =>
  request('/auth/verify-otp', { method: 'POST', body: { phone, otp, ...details } });
export const apiRegister = (payload: any) => request('/auth/register', { method: 'POST', body: payload });
export const apiLoginPassword = (payload: { phone: string; password: string }) =>
  request('/auth/login-password', { method: 'POST', body: payload });
export const apiCheckAvailability = (params: { username?: string; email?: string; phone?: string; password?: string }) => {
  // Use POST to support password checking (more secure than query params)
  return request('/auth/check-availability', {
    method: 'POST',
    body: params
  });
};
export const apiGetMe = (token?: string) => request('/users/me', { token });
export const apiUpdateMe = (payload: any, token?: string) => request('/users/me', { method: 'PUT', body: payload, token });
export const apiGetUser = (id: string, token?: string) => request(`/users/${id}`, { token });

// Auth - Additional
export const apiForgotPassword = (email: string) => request('/auth/forgot-password', { method: 'POST', body: { email } });
export const apiResetPassword = (email: string, otp: string, newPassword: string) =>
  request('/auth/reset-password', { method: 'POST', body: { email, otp, newPassword } });
export const apiVerifyPassword = (password: string, token?: string) =>
  request('/auth/verify-password', { method: 'POST', body: { password }, token });
export const apiChangePassword = (currentPassword: string, newPassword: string, token?: string) =>
  request('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword }, token });

// Posts - Additional
export const apiCreatePost = (payload: any, token: string) => request('/posts', { method: 'POST', body: payload, token });
export const apiGetSavedPosts = (page: number, limit: number, token: string) =>
  request(`/users/me/saved?page=${page}&limit=${limit}`, { token });
export const apiGetTrendingFeed = (page: number, limit: number, token?: string) =>
  request(`/api/feed/trending?page=${page}&limit=${limit}`, { token });
export const apiGetDonations = (page: number, limit: number, token?: string) =>
  request(`/posts/donations?page=${page}&limit=${limit}`, { token });

// Likes
export const apiLikePost = (id: string, token: string) => request(`/api/posts/${id}/like`, { method: 'POST', token });
export const apiUnlikePost = (id: string, token: string) => request(`/api/posts/${id}/like`, { method: 'DELETE', token });

// Comments - Additional
export const apiGetComments = (id: string, page: number, limit: number, sort?: string, token?: string) => {
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());
  if (sort) queryParams.append('sort', sort);
  return request(`/api/posts/${id}/comments?${queryParams.toString()}`, { token });
};
export const apiGetCommentReplies = (id: string, page: number, limit: number, token?: string) =>
  request(`/api/comments/${id}/replies?page=${page}&limit=${limit}`, { token });

// Follow - Additional
export const apiFollowUser = (id: string, token: string) => request(`/api/users/${id}/follow`, { method: 'POST', token });
export const apiUnfollowUser = (id: string, token: string) => request(`/api/users/${id}/follow`, { method: 'DELETE', token });
export const apiGetFollowStatus = (id: string, token?: string) => request(`/api/users/${id}/follow-status`, { token });
export const apiAcceptFollowRequest = (userId: string, token: string) =>
  request(`/api/follow-requests/${userId}/accept`, { method: 'POST', token });
export const apiRejectFollowRequest = (userId: string, token: string) =>
  request(`/api/follow-requests/${userId}/reject`, { method: 'POST', token });

// Notifications - Named exports for contexts
export const apiNotifications = (token: string) => request('/notifications', { token });
export const apiMarkAllNotificationsRead = (token: string) => request('/notifications/read-all', { method: 'POST', token });
export const apiGetUnreadMessageCount = (token: string) => request('/messages/unread-count', { token });

// Messages
export const apiGetConversations = (token: string, query?: string) => {
  const url = query ? `/messages?search=${encodeURIComponent(query)}` : '/messages';
  return request(url, { token });
};
export const apiSendMessage = (recipientId: string, content: string, token: string) =>
  request('/messages', { method: 'POST', body: { recipientId, content }, token });
export const apiConversation = (userId: string, token: string) => request(`/messages/${userId}`, { token });
export const apiMarkConversationRead = (userId: string, token: string) =>
  request(`/messages/${userId}/read`, { method: 'POST', token });
export const apiDeleteMessage = (id: string, token: string) => request(`/messages/${id}`, { method: 'DELETE', token });

// Communities
export const apiCreateCommunity = (payload: any, token: string) =>
  request('/api/communities', { method: 'POST', body: payload, token });
export const apiCommunities = (params: any, token?: string) => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.type) queryParams.append('type', params.type);
  if (params.industry) queryParams.append('industry', params.industry);
  const url = `/api/communities?${queryParams.toString()}`;
  return request(url, { token });
};
export const apiMyCommunities = (page: number, limit: number, token: string) =>
  request(`/api/communities/my?page=${page}&limit=${limit}`, { token });
export const apiCommunity = (id: string, token?: string) => request(`/api/communities/${id}`, { token });
export const apiUpdateCommunity = (id: string, payload: any, token: string) =>
  request(`/api/communities/${id}`, { method: 'PUT', body: payload, token });
export const apiDeleteCommunity = (id: string, token: string) =>
  request(`/api/communities/${id}`, { method: 'DELETE', token });
export const apiJoinCommunity = (id: string, token: string) =>
  request(`/api/communities/${id}/join`, { method: 'POST', token });
export const apiLeaveCommunity = (id: string, token: string) =>
  request(`/api/communities/${id}/leave`, { method: 'POST', token });
export const apiCommunityMembers = (id: string, page: number, limit: number, token?: string) =>
  request(`/api/communities/${id}/members?page=${page}&limit=${limit}`, { token });
export const apiUpdateMemberRole = (id: string, userId: string, role: string, token: string) =>
  request(`/api/communities/${id}/members/${userId}/role`, { method: 'PUT', body: { role }, token });
export const apiRemoveMember = (id: string, userId: string, token: string) =>
  request(`/api/communities/${id}/members/${userId}`, { method: 'DELETE', token });
export const apiApproveJoinRequest = (id: string, userId: string, token: string) =>
  request(`/api/communities/${id}/requests/${userId}/approve`, { method: 'POST', token });
export const apiRejectJoinRequest = (id: string, userId: string, token: string) =>
  request(`/api/communities/${id}/requests/${userId}/reject`, { method: 'POST', token });

// Groups
export const apiCommunityGroups = (id: string, token?: string) => request(`/api/communities/${id}/groups`, { token });
export const apiCreateGroup = (id: string, payload: any, token: string) =>
  request(`/api/communities/${id}/groups`, { method: 'POST', body: payload, token });
export const apiUpdateGroup = (id: string, groupId: string, payload: any, token: string) =>
  request(`/api/communities/${id}/groups/${groupId}`, { method: 'PUT', body: payload, token });
export const apiDeleteGroup = (id: string, groupId: string, token: string) =>
  request(`/api/communities/${id}/groups/${groupId}`, { method: 'DELETE', token });
export const apiJoinGroup = (id: string, groupId: string, token: string) =>
  request(`/api/communities/${id}/groups/${groupId}/join`, { method: 'POST', token });
export const apiLeaveGroup = (id: string, groupId: string, token: string) =>
  request(`/api/communities/${id}/groups/${groupId}/leave`, { method: 'POST', token });
export const apiGroupPosts = (id: string, groupId: string, page: number, limit: number, token?: string) =>
  request(`/api/communities/${id}/groups/${groupId}/posts?page=${page}&limit=${limit}`, { token });

// Community Posts
export const apiCreateCommunityPost = (id: string, payload: any, token: string) =>
  request(`/api/communities/${id}/posts`, { method: 'POST', body: payload, token });
export const apiDeleteCommunityPost = (id: string, postId: string, token: string) =>
  request(`/api/communities/${id}/posts/${postId}`, { method: 'DELETE', token });
export const apiVotePoll = (id: string, postId: string, optionIndex: number, token: string) =>
  request(`/api/communities/${id}/posts/${postId}/vote`, { method: 'POST', body: { optionIndex }, token });

// Verification
export const apiGetVerificationStatus = (token?: string) => request('/verification/status', { token });
export const apiSubmitVerificationRequest = (payload: any, token: string) =>
  request('/verification/request', { method: 'POST', body: payload, token });
export const apiCreateSubscriptionOrder = (planId: string, token?: string) =>
  request('/subscriptions/create-order', { method: 'POST', body: { planId }, token });
export const apiVerifySubscriptionPayment = (payload: any, token?: string) =>
  request('/subscriptions/verify-payment', { method: 'POST', body: payload, token });

// Support
export const apiCreateSupportRequest = (payload: any, token: string) =>
  request('/support', { method: 'POST', body: payload, token });

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EXPORTED API OBJECT
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const api = {
  // Auth
  sendOtp: (phone: string) => unwrap(apiSendOtp(phone)),
  verifyOtp: (p: any, o: any, d: any) => unwrap(apiVerifyOtp(p, o, d)),
  login: (phone: string) => unwrap(apiSendOtp(phone)),
  loginPassword: (payload: { phone: string; password: string }) => unwrap(apiLoginPassword(payload)),
  checkAvailability: (params: { username?: string; email?: string; phone?: string; password?: string }) => unwrap(apiCheckAvailability(params)),
  register: (p: any) => unwrap(apiRegister(p)),
  logout: (ref: string, tok?: string) => request('/auth/logout', { method: 'POST', body: { refreshToken: ref }, token: tok }),

  // Users
  me: (t?: string) => unwrap(apiGetMe(t)),
  getMe: (t?: string) => unwrap(apiGetMe(t)),
  user: (id: string, t?: string) => unwrap(apiGetUser(id, t)),
  getUser: (id: string, t?: string) => unwrap(apiGetUser(id, t)),
  updateMe: (p: any, t?: string) => unwrap(apiUpdateMe(p, t)),
  searchUsers: (params: any, t: string) => {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.roles) {
      const roles = Array.isArray(params.roles) ? params.roles : [params.roles];
      roles.forEach((role: string) => queryParams.append('roles', role));
    }
    if (params.industries) {
      const industries = Array.isArray(params.industries) ? params.industries : [params.industries];
      industries.forEach((industry: string) => queryParams.append('industries', industry));
    }
    const url = queryParams.toString() ? `/users?${queryParams.toString()}` : '/users';
    return unwrap(request(url, { token: t }));
  },

  // Posts
  createPost: (p: any, t: string) => unwrap(request('/posts', { method: 'POST', body: p, token: t })),
  getPosts: (params: any, t?: string) => unwrap(request('/api/feed/trending', { token: t })),
  getDonations: (page: number, limit: number, t?: string) => unwrap(apiGetDonations(page, limit, t)),
  getPost: (id: string, t?: string) => unwrap(request(`/posts/${id}`, { token: t })),
  updatePost: (id: string, p: any, t: string) => unwrap(request(`/posts/${id}`, { method: 'PUT', body: p, token: t })),
  deletePost: (id: string, t: string) => unwrap(request(`/posts/${id}`, { method: 'DELETE', token: t })),

  // Engagement
  toggleLike: (id: string, t: string) => unwrap(request(`/api/posts/${id}/like`, { method: 'POST', token: t })),
  likePost: (id: string, t: string) => unwrap(apiLikePost(id, t)),
  unlikePost: (id: string, t: string) => unwrap(apiUnlikePost(id, t)),
  getComments: (id: string, page?: number, limit?: number, sort?: string, t?: string) => {
    const p = page ?? 0;
    const l = limit ?? 50;
    return unwrap(apiGetComments(id, p, l, sort, t));
  },
  getCommentReplies: (id: string, page: number, limit: number, t?: string) => unwrap(apiGetCommentReplies(id, page, limit, t)),
  addComment: (id: string, text: string, parentCommentId?: string, t?: string) => {
    const body: any = { content: text };
    if (parentCommentId) {
      body.parentCommentId = parentCommentId;
    }
    return unwrap(request(`/api/posts/${id}/comments`, { method: 'POST', body, token: t }));
  },
  deleteComment: (cId: string, t: string) => unwrap(request(`/api/comments/${cId}`, { method: 'DELETE', token: t })),
  sharePost: (id: string, text: string, t: string) => unwrap(request(`/api/posts/${id}/share`, { method: 'POST', body: { caption: text, shareType: 'repost' }, token: t })),
  toggleSavePost: (id: string, t: string) => unwrap(request(`/posts/${id}/save`, { method: 'POST', token: t })),
  getSavedPosts: (page: number, limit: number, t: string) => unwrap(apiGetSavedPosts(page, limit, t)),

  // Followers
  toggleFollow: (id: string, t: string) => unwrap(request(`/api/users/${id}/follow`, { method: 'POST', token: t })),
  followUser: (id: string, t: string) => unwrap(apiFollowUser(id, t)),
  unfollowUser: (id: string, t: string) => unwrap(apiUnfollowUser(id, t)),
  getFollowStatus: (id: string, t?: string) => unwrap(apiGetFollowStatus(id, t)),
  acceptFollowRequest: (userId: string, t: string) => unwrap(apiAcceptFollowRequest(userId, t)),
  rejectFollowRequest: (userId: string, t: string) => unwrap(apiRejectFollowRequest(userId, t)),
  getFollowers: (id: string, page: number, limit: number, token?: string, query?: string) => {
    const url = `/api/users/${id}/followers?page=${page}&limit=${limit}${query ? `&q=${encodeURIComponent(query)}` : ''}`;
    return unwrap(request(url, { token }));
  },
  getFollowing: (id: string, page: number, limit: number, token?: string, query?: string) => {
    const url = `/api/users/${id}/following?page=${page}&limit=${limit}${query ? `&q=${encodeURIComponent(query)}` : ''}`;
    return unwrap(request(url, { token }));
  },

  // Notifications
  getNotifications: (t: string) => unwrap(request('/notifications', { token: t })),
  markNotificationRead: (id: string, t: string) => unwrap(request(`/notifications/${id}/read`, { method: 'POST', token: t })),
  markAllNotificationsRead: (t: string) => unwrap(request('/notifications/read-all', { method: 'POST', token: t })),
  getNotificationUnreadCount: (t: string) => unwrap(request('/notifications/count', { token: t })),
  registerPushToken: (p: string, t: string) => unwrap(request('/notifications/register-token', { method: 'POST', body: { token: p }, token: t })),

  // Media
  getMediaSignature: (type: string, t: string) => unwrap(request('/media/signature', { method: 'POST', body: { type }, token: t })),

  // Feed
  feed: (page: any = 0, limit: any = 20, algo: any = 'hybrid', tr: any = 365, t?: string) => {
    const token = t || (typeof algo === 'string' && algo.length > 20 ? algo : (typeof tr === 'string' ? tr : undefined));
    const pageNum = typeof page === 'number' ? page : 0;
    const limitNum = typeof limit === 'number' ? limit : 20;
    const algorithm = typeof algo === 'string' && algo.length < 20 ? algo : 'hybrid';
    const timeRange = typeof tr === 'number' ? tr : (typeof tr === 'string' ? parseInt(tr) : 365);
    const url = `/api/feed?page=${pageNum}&limit=${limitNum}&algorithm=${algorithm}&timeRange=${timeRange}`;
    return unwrap(request(url, { token }));
  },
  getFeed: (page: any = 0, limit: any = 20, algo: any = 'hybrid', tr: any = 365, t?: string) => {
    const token = t || (typeof algo === 'string' && algo.length > 20 ? algo : (typeof tr === 'string' ? tr : undefined));
    const pageNum = typeof page === 'number' ? page : 0;
    const limitNum = typeof limit === 'number' ? limit : 20;
    const algorithm = typeof algo === 'string' && algo.length < 20 ? algo : 'hybrid';
    const timeRange = typeof tr === 'number' ? tr : (typeof tr === 'string' ? parseInt(tr) : 365);
    const url = `/api/feed?page=${pageNum}&limit=${limitNum}&algorithm=${algorithm}&timeRange=${timeRange}`;
    return unwrap(request(url, { token }));
  },
  getUserFeed: (id: string, p: any = 0, l: any = 20, t?: string) => {
    const token = t || (typeof p === 'string' ? p : (typeof l === 'string' ? l : undefined));
    return unwrap(request(`/api/feed/users/${id}/posts?page=${typeof p === 'number' ? p : 0}&limit=${typeof l === 'number' ? l : 20}`, { token }));
  },
  getTrendingFeed: (page: number, limit: number, t?: string) => unwrap(apiGetTrendingFeed(page, limit, t)),

  // Password Management
  verifyPassword: (password: string, t?: string) => unwrap(apiVerifyPassword(password, t)),
  changePassword: (currentPassword: string, newPassword: string, t?: string) => unwrap(apiChangePassword(currentPassword, newPassword, t)),

  // Communities
  createCommunity: (payload: any, t: string) => unwrap(apiCreateCommunity(payload, t)),
  communities: (params: any, t?: string) => unwrap(apiCommunities(params, t)),
  myCommunities: (page: number, limit: number, t: string) => unwrap(apiMyCommunities(page, limit, t)),
  community: (id: string, t?: string) => unwrap(apiCommunity(id, t)),
  updateCommunity: (id: string, payload: any, t: string) => unwrap(apiUpdateCommunity(id, payload, t)),
  deleteCommunity: (id: string, t: string) => unwrap(apiDeleteCommunity(id, t)),
  joinCommunity: (id: string, t: string) => unwrap(apiJoinCommunity(id, t)),
  leaveCommunity: (id: string, t: string) => unwrap(apiLeaveCommunity(id, t)),
  communityMembers: (id: string, page: number, limit: number, t?: string) => unwrap(apiCommunityMembers(id, page, limit, t)),
  updateMemberRole: (id: string, userId: string, role: string, t: string) => unwrap(apiUpdateMemberRole(id, userId, role, t)),
  removeMember: (id: string, userId: string, t: string) => unwrap(apiRemoveMember(id, userId, t)),
  approveJoinRequest: (id: string, userId: string, t: string) => unwrap(apiApproveJoinRequest(id, userId, t)),
  rejectJoinRequest: (id: string, userId: string, t: string) => unwrap(apiRejectJoinRequest(id, userId, t)),

  // Groups
  communityGroups: (id: string, t?: string) => unwrap(apiCommunityGroups(id, t)),
  createGroup: (id: string, payload: any, t: string) => unwrap(apiCreateGroup(id, payload, t)),
  updateGroup: (id: string, groupId: string, payload: any, t: string) => unwrap(apiUpdateGroup(id, groupId, payload, t)),
  deleteGroup: (id: string, groupId: string, t: string) => unwrap(apiDeleteGroup(id, groupId, t)),
  joinGroup: (id: string, groupId: string, t: string) => unwrap(apiJoinGroup(id, groupId, t)),
  leaveGroup: (id: string, groupId: string, t: string) => unwrap(apiLeaveGroup(id, groupId, t)),
  groupPosts: (id: string, groupId: string, page: number, limit: number, t?: string) => unwrap(apiGroupPosts(id, groupId, page, limit, t)),

  // Community Posts
  createCommunityPost: (id: string, payload: any, t: string) => unwrap(apiCreateCommunityPost(id, payload, t)),
  deleteCommunityPost: (id: string, postId: string, t: string) => unwrap(apiDeleteCommunityPost(id, postId, t)),
  votePoll: (id: string, postId: string, optionIndex: number, t: string) => unwrap(apiVotePoll(id, postId, optionIndex, t)),

  // Messages
  getConversations: (t: string, query?: string) => unwrap(apiGetConversations(t, query)),
  sendMessage: (recipientId: string, content: string, t: string) => unwrap(apiSendMessage(recipientId, content, t)),
  conversation: (userId: string, t: string) => unwrap(apiConversation(userId, t)),
  markConversationRead: (userId: string, t: string) => unwrap(apiMarkConversationRead(userId, t)),
  deleteMessage: (id: string, t: string) => unwrap(apiDeleteMessage(id, t)),

  // Verification
  getVerificationStatus: (t?: string) => unwrap(apiGetVerificationStatus(t)),
  submitVerificationRequest: (payload: any, t: string) => unwrap(apiSubmitVerificationRequest(payload, t)),
  apiCreateSubscriptionOrder: (planId: string, t?: string) => unwrap(apiCreateSubscriptionOrder(planId, t)),
  apiVerifySubscriptionPayment: (payload: any, t?: string) => unwrap(apiVerifySubscriptionPayment(payload, t)),

  // Support
  createSupportRequest: (payload: any, t: string) => unwrap(apiCreateSupportRequest(payload, t)),
};

// Default export
export default api;