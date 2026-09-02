import axios, { AxiosError, AxiosInstance } from 'axios';
import { toast } from 'sonner';
import { 
  AuthResponse, 
  PaginatedResponse, 
  VerificationRequest, 
  VerificationLog,
  Subscription,
  ApiError,
  Report,
  ReportStats,
  ReportResolution,
  SupportTicket,
  SupportStats,
  SupportStatus,
  ReplyChannel,
  PaymentEntry,
  PaymentSummary,
  PaymentExceptions,
  ErrorLogEntry,
  ErrorStats
} from '@/types';

// API base URL - configure for production
const API_BASE_URL =  import.meta.env.VITE_API_URL || 'https://api.filmyconnect24.com';

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

    // 403 means signed in but not permitted, so the session stays - clearing it
    // here would sign someone out for opening one page above their role.
    if (error.response?.status === 403) {
      toast.error(
        error.response.data?.message ||
          "Your admin role doesn't allow this action."
      );
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
};

// Users API
export const usersApi = {
  getAll: async (params: any): Promise<PaginatedResponse<any>> => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  getById: async (id: string): Promise<any> => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },
  updateWallet: async (id: string, data: { amount: number, type: string, description?: string }): Promise<void> => {
    await api.put(`/admin/users/${id}/wallet`, data);
  },
  suspend: async (id: string, data: any): Promise<void> => {
    await api.put(`/admin/users/${id}/suspend`, data);
  },
  unsuspend: async (id: string): Promise<void> => {
    await api.put(`/admin/users/${id}/unsuspend`);
  },
};

// Stats API
export const statsApi = {
  getBoostStats: async (): Promise<{ count: number, users: any[] }> => {
    const response = await api.get('/admin/stats/boost');
    return response.data;
  },
};

// Version Config API
export const versionApi = {
  getVersion: async (): Promise<any> => {
    const response = await api.get('/admin/version');
    return response.data;
  },
  updateVersion: async (data: {
    ios?: { latestVersion: string; minimumVersion: string; storeUrl: string };
    android?: { latestVersion: string; minimumVersion: string; storeUrl: string };
    title?: string;
    message?: string;
  }): Promise<any> => {
    const response = await api.put('/admin/version', data);
    return response.data;
  },
};


// Moderation reports
export const reportApi = {
  getReports: async (
    page: number = 1,
    limit: number = 20,
    filters?: { status?: string; type?: string; sla?: string }
  ): Promise<PaginatedResponse<Report>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters?.sla && filters.sla !== 'all') params.append('sla', filters.sla);

    const response = await api.get<PaginatedResponse<Report>>(`/admin/reports?${params.toString()}`);
    return response.data;
  },

  getStats: async (): Promise<ReportStats> => {
    const response = await api.get<ReportStats>('/admin/reports/stats');
    return response.data;
  },

  getReportById: async (id: string): Promise<Report> => {
    const response = await api.get<Report>(`/admin/reports/${id}`);
    return response.data;
  },

  acknowledge: async (id: string): Promise<void> => {
    await api.put(`/admin/reports/${id}/acknowledge`);
  },

  resolve: async (
    id: string,
    resolution: ReportResolution,
    notes?: string,
    suspensionDays?: number
  ): Promise<{ outcome: string; duplicatesClosed: number }> => {
    const response = await api.post(`/admin/reports/${id}/resolve`, {
      resolution,
      notes,
      suspensionDays,
    });
    return response.data;
  },

  escalate: async (id: string, notes?: string): Promise<void> => {
    await api.post(`/admin/reports/${id}/escalate`, { notes });
  },
};


// Support desk
export const supportApi = {
  getTickets: async (
    page: number = 1,
    limit: number = 20,
    filters?: { status?: string; search?: string }
  ): Promise<PaginatedResponse<SupportTicket>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get<PaginatedResponse<SupportTicket>>(
      `/admin/support?${params.toString()}`
    );
    return response.data;
  },

  getStats: async (): Promise<SupportStats> => {
    const response = await api.get<SupportStats>('/admin/support/stats');
    return response.data;
  },

  getTicketById: async (id: string): Promise<SupportTicket> => {
    const response = await api.get<SupportTicket>(`/admin/support/${id}`);
    return response.data;
  },

  reply: async (
    id: string,
    body: string,
    channel: ReplyChannel = 'both'
  ): Promise<{ emailDelivered: boolean | null }> => {
    const response = await api.post(`/admin/support/${id}/reply`, { body, channel });
    return response.data;
  },

  setStatus: async (id: string, status: SupportStatus, notes?: string): Promise<void> => {
    await api.put(`/admin/support/${id}/status`, { status, notes });
  },
};


// Payments
export const paymentApi = {
  getPayments: async (
    page: number = 1,
    limit: number = 25,
    filters?: { status?: string; source?: string; purpose?: string; from?: string; to?: string }
  ): Promise<PaginatedResponse<PaymentEntry>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v && v !== 'all') params.append(k, v);
    });
    const response = await api.get<PaginatedResponse<PaymentEntry>>(
      `/admin/payments?${params.toString()}`
    );
    return response.data;
  },

  getSummary: async (filters?: { from?: string; to?: string }): Promise<PaymentSummary> => {
    const params = new URLSearchParams();
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    const response = await api.get<PaymentSummary>(`/admin/payments/summary?${params.toString()}`);
    return response.data;
  },

  getExceptions: async (): Promise<PaymentExceptions> => {
    const response = await api.get<PaymentExceptions>('/admin/payments/exceptions');
    return response.data;
  },

  /**
   * Downloads the CSV. The response is a file rather than JSON, so it bypasses
   * the shared client's unwrapping interceptor and is fetched directly.
   */
  exportCsv: async (filters?: { from?: string; to?: string; status?: string }): Promise<void> => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v && v !== 'all') params.append(k, v);
    });

    const response = await api.get(`/admin/payments/export?${params.toString()}`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `filmyconnect-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};


// Server errors
export const errorLogApi = {
  getErrors: async (
    page: number = 1,
    limit: number = 25,
    filters?: { status?: string; search?: string }
  ): Promise<PaginatedResponse<ErrorLogEntry>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    const response = await api.get<PaginatedResponse<ErrorLogEntry>>(
      `/admin/errors?${params.toString()}`
    );
    return response.data;
  },

  getStats: async (): Promise<ErrorStats> => {
    const response = await api.get<ErrorStats>('/admin/errors/stats');
    return response.data;
  },

  getErrorById: async (id: string): Promise<ErrorLogEntry> => {
    const response = await api.get<ErrorLogEntry>(`/admin/errors/${id}`);
    return response.data;
  },

  setResolved: async (id: string, resolved: boolean): Promise<void> => {
    await api.put(`/admin/errors/${id}/resolve`, { resolved });
  },
};
