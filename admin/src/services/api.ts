import axios, { AxiosError, AxiosInstance } from 'axios';
import { 
  AuthResponse, 
  PaginatedResponse, 
  VerificationRequest, 
  VerificationLog,
  Subscription,
  ApiError 
} from '@/types';

// API base URL - configure for production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.flimy.app';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // If the response has the standard backend wrapper { success: true, data: ... }
    // we return the internal data directly
    if (response.data && response.data.success === true && response.data.data !== undefined) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      // Only redirect if not already on login page to avoid infinite loops
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/admin/auth/login', { email, password });
    return response.data;
  },
  
  logout: async (): Promise<void> => {
    await api.post('/admin/auth/logout');
  },
  
  validateToken: async (): Promise<boolean> => {
    try {
      await api.get('/admin/auth/validate');
      return true;
    } catch {
      return false;
    }
  },
};
// Verification API
export const verificationApi = {
  getRequests: async (
    page: number = 1, 
    limit: number = 10,
    filters?: {
      status?: string;
      name?: string;
      role?: string;
      phone?: string;
      industry?: string;
    }
  ): Promise<PaginatedResponse<VerificationRequest>> => {
    const params = new URLSearchParams({ 
      page: page.toString(), 
      limit: limit.toString() 
    });
    
    if (filters) {
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.name) params.append('name', filters.name);
      if (filters.role) params.append('role', filters.role);
      if (filters.phone) params.append('phone', filters.phone);
      if (filters.industry) params.append('industry', filters.industry);
    }
    
    const response = await api.get<PaginatedResponse<VerificationRequest>>(
      `/admin/verification/requests?${params.toString()}`
    );
    return response.data;
  },
  
  getRequestById: async (id: string): Promise<VerificationRequest> => {
    const response = await api.get<VerificationRequest>(`/admin/verification/requests/${id}`);
    return response.data;
  },
  
  approve: async (userId: string, notes?: string): Promise<void> => {
    await api.post(`/admin/verification/${userId}/approve`, { notes });
  },
  
  reject: async (userId: string, notes?: string): Promise<void> => {
    await api.post(`/admin/verification/${userId}/reject`, { notes });
  },
  
  getLogs: async (
    page: number = 1, 
    limit: number = 20,
    filters?: {
      userName?: string;
      action?: string;
    }
  ): Promise<PaginatedResponse<VerificationLog>> => {
    const params = new URLSearchParams({ 
      page: page.toString(), 
      limit: limit.toString() 
    });
    
    if (filters) {
      if (filters.userName) params.append('userName', filters.userName);
      if (filters.action && filters.action !== 'ALL') params.append('action', filters.action);
    }

    const response = await api.get<PaginatedResponse<VerificationLog>>(
      `/admin/verification/logs?${params.toString()}`
    );
    return response.data;
  },

  getSubscriptions: async (
    page: number = 1, 
    limit: number = 10,
    filters?: {
      status?: string;
      name?: string;
    }
  ): Promise<PaginatedResponse<Subscription>> => {
    const params = new URLSearchParams({ 
      page: page.toString(), 
      limit: limit.toString() 
    });
    
    if (filters) {
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.name) params.append('name', filters.name);
    }
    
    const response = await api.get<PaginatedResponse<Subscription>>(
      `/admin/verification/subscriptions?${params.toString()}`
    );
    return response.data;
  },
  
  deleteSubscription: async (id: string): Promise<void> => {
    await api.delete(`/admin/verification/subscriptions/${id}`);
  },
};

export default api;
