import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface RequestCreditsModalProps {
  children: React.ReactNode;
}

const RequestCreditsModal: React.FC<RequestCreditsModalProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [requestedCredits, setRequestedCredits] = useState(10);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'You must be logged in to request credits.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      await apiClient.requestCredits(token, requestedCredits);
      toast({ title: 'Credit request submitted successfully!' });
      setOpen(false);
    } catch (error: any) {
      toast({ title: 'Failed to submit credit request.', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Credits</DialogTitle>
          <DialogDescription>
            Select the amount of credits you would like to request. An admin will review your request.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="credits" className="text-right">
              Credits
            </Label>
            <Input
              id="credits"
              type="number"
              value={requestedCredits}
              onChange={(e) => setRequestedCredits(Number(e.target.value))}
              className="col-span-3"
              step={10}
              min={10}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestCreditsModal;
