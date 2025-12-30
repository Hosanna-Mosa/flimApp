import axios, { AxiosError, AxiosInstance } from 'axios';
import { 
  AuthResponse, 
  PaginatedResponse, 
  VerificationRequest, 
  VerificationLog,
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
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
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
    status?: string
  ): Promise<PaginatedResponse<VerificationRequest>> => {
    const params = new URLSearchParams({ 
      page: page.toString(), 
      limit: limit.toString() 
    });
    if (status && status !== 'ALL') {
      params.append('status', status);
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
    limit: number = 20
  ): Promise<PaginatedResponse<VerificationLog>> => {
    const response = await api.get<PaginatedResponse<VerificationLog>>(
      `/admin/verification/logs?page=${page}&limit=${limit}`
    );
    return response.data;
  },
};

export default api;
