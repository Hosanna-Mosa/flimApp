import { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { userAdminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { _id: string; name: string; email: string };
  onDeleted: () => void;
}

/**
 * Confirmation for permanent account deletion.
 *
 * The email has to be typed rather than a checkbox ticked. There is no undo and
 * no restore path, so the aim is to make this impossible to do by accident
 * while distracted — copying the address is a deliberate act in a way that
 * clicking a red button is not. The server enforces the same check, so this is
 * a courtesy to the admin rather than the actual guard.
 */
export function DeleteUserDialog({ open, onOpenChange, user, onDeleted }: DeleteUserDialogProps) {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [reason, setReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const matches = confirmEmail.trim().toLowerCase() === user.email.toLowerCase();

  const handleDelete = async () => {
    if (!matches) return;
    setIsDeleting(true);
    try {
      const result = await userAdminApi.deleteUser(user._id, confirmEmail.trim(), reason.trim() || undefined);
      const totalRemoved = Object.values(result.removed).reduce((a, b) => a + b, 0);
      toast.success(`${result.user.name} deleted`, {
        description: `${totalRemoved} related records removed${
          result.media.failed ? `, ${result.media.failed} media files could not be deleted` : ''
        }`,
      });
      onOpenChange(false);
      onDeleted();
    } catch {
      /* the interceptor already surfaced the reason */
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setConfirmEmail('');
          setReason('');
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete {user.name} permanently
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-2 text-sm">
              <p>
                This erases the account and everything attached to it — posts, comments, likes,
                messages, wallet, payment records, support tickets and verification history.
              </p>
              <p className="font-medium text-foreground">
                There is no undo. Nothing here can be restored afterwards.
              </p>
              <p>
                If you only want to stop them using the app, close this and suspend them instead —
                that is reversible.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="confirmEmail">
              Type <span className="font-mono text-foreground">{user.email}</span> to confirm
            </Label>
            <Input
              id="confirmEmail"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={user.email}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason (recorded in the audit log)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. account deletion requested by the user"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={!matches || isDeleting}>
            {isDeleting ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1.5" />
            )}
            {isDeleting ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
