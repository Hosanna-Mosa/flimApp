export type Industry =
  | 'bollywood'
  | 'tollywood'
  | 'kollywood'
  | 'mollywood'
  | 'sandalwood'
  | 'punjabi'
  | 'bengali'
  | 'bhojpuri'
  | 'marathi';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string | null;
  roles: string[];
  industries: Industry[];
  bio: string | null;
  isVerified: boolean;
  createdAt: string;
}

// Admin user type
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'VERIFICATION_ADMIN';
  createdAt: string;
}

// Verification request status
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Verification type
export type VerificationType = 'CREATOR' | 'CELEBRITY' | 'BRAND' | 'PUBLIC_FIGURE' | 'JOURNALIST';

// Verification request
export interface VerificationRequest {
  id: string;
  userId: string;
  user: User;
  verificationType: VerificationType;
  status: VerificationStatus;
  reason: string;
  documents: VerificationDocument[];
  adminNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

// Verification document
export interface VerificationDocument {
  id: string;
  type: 'ID_DOCUMENT' | 'PROOF_OF_WORK' | 'SOCIAL_LINK' | 'OTHER';
  url: string;
  name: string;
}

// Verification log action
export type VerificationAction = 'APPROVE' | 'REJECT' | 'REVOKE';

// Verification audit log
export interface VerificationLog {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  action: VerificationAction;
  adminId: string;
  adminName: string;
  notes: string | null;
  timestamp: string;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthResponse {
  accessToken: string;
  admin: AdminUser;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
