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

// Posts
export const apiCreatePost = (
  payload: {
    type: 'video' | 'audio' | 'image' | 'script';
    mediaUrl?: string;
    filePath?: string;
    thumbnailUrl?: string;
    caption?: string;
    industries?: string[];
    roles?: string[];
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

// Notifications
export const apiNotifications = (token?: string) =>
  request('/notifications', { token });

export const apiMarkNotificationRead = (id: string, token?: string) =>
  request(`/notifications/${id}/read`, { method: 'POST', token });

export const api = {
  login: apiLogin,
  verifyOtp: apiVerifyOtp,
  refresh: apiRefresh,
  logout: apiLogout,
  me: apiGetMe,
  updateMe: apiUpdateMe,
  user: apiGetUser,
  searchUsers: apiSearchUsers,
  createPost: apiCreatePost,
  deletePost: apiDeletePost,
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
  register: apiRegister,
  loginPassword: apiLoginPassword,
};

export default api;

