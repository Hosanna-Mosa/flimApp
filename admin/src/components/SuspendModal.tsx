import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

interface SuspendModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { status: 'suspended' | 'banned', reason: string, duration?: string }) => void;
    isLoading: boolean;
    title?: string;
}

export function SuspendModal({ isOpen, onClose, onConfirm, isLoading, title = "Suspend User" }: SuspendModalProps) {
    const [status, setStatus] = useState<'suspended' | 'banned'>('suspended');
    const [reason, setReason] = useState('');
    const [duration, setDuration] = useState('7'); // Default 7 days

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm({ status, reason, duration: status === 'suspended' ? duration : undefined });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to suspend this user? This will restrict their access.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Action Type</Label>
                            <RadioGroup value={status} onValueChange={(v) => setStatus(v as 'suspended' | 'banned')}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="suspended" id="suspended" />
                                    <Label htmlFor="suspended">Temporary Suspension</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="banned" id="banned" />
                                    <Label htmlFor="banned">Permanent Ban</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {status === 'suspended' && (
                            <div className="grid gap-2">
                                <Label htmlFor="duration">Duration (Days)</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    min="1"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="reason">Reason</Label>
                            <Textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Violation of terms..."
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="destructive" disabled={isLoading}>
                            {isLoading ? 'Processing...' : 'Confirm Action'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
