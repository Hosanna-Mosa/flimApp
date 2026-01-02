import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verificationApi } from '@/services/api';
import { VerificationRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/UserAvatar';
import { StatusBadge } from '@/components/StatusBadge';
import { VerificationTypeBadge } from '@/components/VerificationTypeBadge';
import { LoadingState } from '@/components/StateDisplay';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Link as LinkIcon,
  Calendar,
  BadgeCheck,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function VerificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
  }>({ open: false, action: null });

  useEffect(() => {
    const fetchRequest = async () => {
      setIsLoading(true);
      try {
        const data = await verificationApi.getRequestById(id!);
        setRequest(data);
        setAdminNotes(data.adminNotes || '');
      } catch (error) {
        toast.error('Failed to load request details');
        navigate('/requests');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchRequest();
    }
  }, [id, navigate]);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!request) return;
    
    setIsProcessing(true);
    try {
      if (action === 'approve') {
        await verificationApi.approve(request.userId, adminNotes);
        toast.success('Verification approved successfully');
      } else {
        await verificationApi.reject(request.userId, adminNotes);
        toast.success('Verification rejected');
      }
      navigate('/requests');
    } catch (error) {
      toast.error(`Failed to ${action} verification`);
    } finally {
      setIsProcessing(false);
      setConfirmDialog({ open: false, action: null });
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading request details..." />;
  }

  if (!request) {
    return null;
  }

  const isPending = request.status === 'PENDING';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back button */}
      <Button
        variant="ghost"
        className="gap-2 -ml-2"
        onClick={() => navigate('/requests')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to requests
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Verification Request</h1>
          <p className="text-muted-foreground mt-1">
            Submitted {format(new Date(request.submittedAt), 'MMMM d, yyyy')}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <UserAvatar user={request.user} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {request.user.name}
                </h3>
                {request.user.isVerified && (
                  <BadgeCheck className="h-5 w-5 text-primary" />
                )}
              </div>
              <p className="text-muted-foreground text-sm">{request.user.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                  {request.user.roles?.[0]?.toLowerCase().replace('_', ' ') || 'User'}
                </span>
                <VerificationTypeBadge type={request.verificationType} />
              </div>
              {request.user.bio && (
                <p className="text-sm text-foreground mt-3 leading-relaxed">
                  {request.user.bio}
                </p>
              )}
              <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Member since {format(new Date(request.user.createdAt), 'MMM yyyy')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Reason */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Verification Reason</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">{request.reason}</p>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Submitted Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {request.documents.length === 0 ? (
            <p className="text-muted-foreground text-sm">No documents submitted.</p>
          ) : (
            <div className="space-y-3">
              {request.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  {doc.type === 'SOCIAL_LINK' ? (
                    <LinkIcon className="h-5 w-5 text-primary" />
                  ) : (
                    <FileText className="h-5 w-5 text-primary" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{doc.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {doc.type.replace('_', ' ').toLowerCase()}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isPending ? 'Admin Review' : 'Re-evaluate Verification'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Admin Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about your decision..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() => setConfirmDialog({ open: true, action: 'approve' })}
              disabled={isProcessing || request.status === 'APPROVED'}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {request.status === 'APPROVED' ? 'Already Approved' : 'Approve'}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => setConfirmDialog({ open: true, action: 'reject' })}
              disabled={isProcessing || request.status === 'REJECTED'}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {request.status === 'REJECTED' ? 'Already Rejected' : 'Reject'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Already reviewed info */}
      {!isPending && request.reviewedAt && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Reviewed on:</span>
              <span className="text-foreground">
                {format(new Date(request.reviewedAt), 'MMMM d, yyyy \'at\' h:mm a')}
              </span>
            </div>
            {request.adminNotes && (
              <div>
                <span className="text-muted-foreground text-sm">Admin notes:</span>
                <p className="text-foreground mt-1">{request.adminNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={confirmDialog.open} 
        onOpenChange={(open) => setConfirmDialog({ open, action: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'approve' ? 'Approve Verification' : 'Reject Verification'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'approve'
                ? `This will grant ${request.user.name} a verified badge. This action can be reversed later.`
                : `This will reject the verification request from ${request.user.name}. They can reapply later.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction(confirmDialog.action!)}
              disabled={isProcessing}
              className={confirmDialog.action === 'reject' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                confirmDialog.action === 'approve' ? 'Approve' : 'Reject'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
