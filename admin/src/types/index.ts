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

// Admin roles. Must match backend/server/src/constants/adminRoles.js.
export const ADMIN_ROLES = {
  VERIFICATION: 'VERIFICATION_ADMIN',
  OPERATIONS: 'OPERATIONS_ADMIN',
  SUPER: 'SUPER_ADMIN',
} as const;

export type AdminRole = (typeof ADMIN_ROLES)[keyof typeof ADMIN_ROLES];

// Admin user type
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
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

// Subscription type
export interface Subscription {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    verificationStatus: string;
    isVerified: boolean;
  };
  planType: '1_MONTH' | '3_MONTHS' | '6_MONTHS' | '9_MONTHS';
  amount: number;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string | null;
  endDate: string | null;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  createdAt: string;
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


// ---------------------------------------------------------------------------
// Moderation reports
// ---------------------------------------------------------------------------

export type ReportType = 'post' | 'user' | 'comment';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved';
export type ReportResolution =
  | 'content_removed'
  | 'user_warned'
  | 'user_suspended'
  | 'no_action'
  | 'escalated';

/** Derived server-side from createdAt, never stored. */
export interface ReportSla {
  state: 'ok' | 'due_soon' | 'overdue' | 'done';
  hoursOpen: number | null;
}

export interface ReportTargetOwner {
  _id: string;
  name: string;
  username?: string;
  avatar?: string;
  status?: string;
}

export interface ReportTarget {
  missing?: boolean;
  kind?: ReportType;
  id?: string;
  preview?: string;
  mediaUrl?: string | null;
  isActive?: boolean;
  createdAt?: string;
  postId?: string;
  owner?: ReportTargetOwner;
}

export interface Report {
  _id: string;
  reporterId: ReportTargetOwner | null;
  type: ReportType;
  targetId: string;
  reason: string;
  status: ReportStatus;
  resolution?: ReportResolution;
  reviewedByName?: string;
  reviewedAt?: string;
  adminNotes?: string;
  escalatedAt?: string;
  createdAt: string;
  updatedAt: string;
  sla: ReportSla;
  target: ReportTarget;
  otherReportsOnTarget?: number;
  otherReports?: Report[];
}

export interface ReportStats {
  pending: number;
  reviewed: number;
  resolved: number;
  open: number;
  overdue: number;
  oldestOpenAgeHours: number | null;
  slaHours: number;
}


// ---------------------------------------------------------------------------
// Support desk
// ---------------------------------------------------------------------------

export type SupportStatus = 'pending' | 'resolved' | 'rejected';
export type ReplyChannel = 'notification' | 'email' | 'both';

export interface SupportReply {
  _id: string;
  body: string;
  adminName: string;
  channel: ReplyChannel;
  createdAt: string;
}

export interface SupportSla {
  state: 'ok' | 'due_soon' | 'needs_reply' | 'overdue' | 'done';
  hoursOpen: number | null;
  awaitingFirstReply: boolean;
}

export interface SupportTicket {
  _id: string;
  userId: {
    _id: string;
    name: string;
    username?: string;
    email?: string;
    avatar?: string;
    status?: string;
    createdAt?: string;
  } | null;
  reason: string;
  /** Only present on the detail endpoint; the list sends hasAttachment instead. */
  imageUrl?: string;
  hasAttachment?: boolean;
  status: SupportStatus;
  replies: SupportReply[];
  adminNotes?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
  sla: SupportSla;
}

export interface SupportStats {
  pending: number;
  resolved: number;
  rejected: number;
  awaitingReply: number;
  oldestOpenAgeHours: number | null;
  firstReplyHours: number;
  resolutionDays: number;
}


// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export type PaymentSource = 'session' | 'subscription' | 'wallet';
export type PaymentStatus = 'paid' | 'failed' | 'cancelled' | 'expired' | 'started';

export interface PaymentEntry {
  id: string;
  source: PaymentSource;
  status: PaymentStatus;
  rawStatus: string;
  purpose: string;
  planType: string | null;
  amount: number;
  currency: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  fulfilled: boolean;
  failureReason: string | null;
  user: { _id: string; name: string; email?: string; avatar?: string } | null;
  createdAt: string;
  description?: string | null;
}

export interface PaymentBreakdown {
  [key: string]: { count: number; paidCount: number; collected: number };
}

export interface PaymentSummary {
  attempted: number;
  paidCount: number;
  collected: number;
  currency: string;
  averagePayment: number;
  successRate: number;
  byStatus: Record<string, number>;
  bySource: PaymentBreakdown;
  byPurpose: PaymentBreakdown;
  byPlan: PaymentBreakdown;
  failureReasons: Record<string, number>;
  daily: { date: string; count: number; collected: number }[];
}

export interface PaymentExceptions {
  paidNotDelivered: PaymentEntry[];
  abandonedCheckouts: PaymentEntry[];
  pendingSubscriptions: PaymentEntry[];
  staleAfterHours: number;
  totals: {
    paidNotDelivered: number;
    abandonedCheckouts: number;
    pendingSubscriptions: number;
  };
}


// ---------------------------------------------------------------------------
// Server errors
// ---------------------------------------------------------------------------

export interface ErrorLogEntry {
  _id: string;
  fingerprint: string;
  name: string;
  message: string;
  /** Only sent by the detail endpoint; the list omits it for size. */
  stack?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  count: number;
  firstSeenAt: string;
  lastSeenAt: string;
  lastUserId?: { _id: string; name: string; email?: string; avatar?: string } | null;
  resolved: boolean;
  resolvedByName?: string;
  resolvedAt?: string;
}

export interface ErrorStats {
  open: number;
  resolved: number;
  last24h: number;
  last7d: number;
  totalOccurrences: number;
  retentionDays: number;
}


// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface AnalyticsOverview {
  days: number;
  users: {
    total: number;
    new: number;
    previousPeriod: number;
    changePct: number | null;
    verified: number;
    creators: number;
    activationPct: number;
  };
  active: { inPeriod: number; everLoggedIn: number; coveragePct: number };
  content: {
    totalPosts: number;
    newPosts: number;
    likes: number;
    comments: number;
    messages: number;
    follows: number;
  };
  monetisation: { paidSubscriptions: number; walletTopUpTotal: number };
}

export interface AnalyticsGrowth {
  days: number;
  signups: { date: string; count: number }[];
  posts: { date: string; count: number }[];
  cumulativeUsers: { date: string; total: number }[];
}

export interface FunnelStep {
  key: string;
  label: string;
  count: number;
  pctOfTotal: number;
  pctOfPrevious: number | null;
}

export interface RetentionCohort {
  month: string;
  signedUp: number;
  everReturned: number;
  activeLast90: number;
  activeLast30: number;
  retention30Pct: number;
}

export interface AnalyticsEvents {
  days: number;
  total: number;
  top: { name: string; count: number; users: number }[];
  daily: { date: string; count: number }[];
}


export interface FirebaseReport {
  configured: boolean;
  reason?: string;
  days?: number;
  propertyId?: string;
  totals?: {
    activeUsers: number;
    newUsers: number;
    sessions: number;
    screenViews: number;
    avgEngagementSeconds: number;
  };
  daily?: { date: string | null; activeUsers: number; sessions: number }[];
  screens?: { screen: string; screenPageViews: number; activeUsers: number }[];
  events?: { event: string; eventCount: number; activeUsers: number }[];
  platforms?: { platform: string; activeUsers: number }[];
  countries?: { country: string; activeUsers: number }[];
  errors?: string[];
}
