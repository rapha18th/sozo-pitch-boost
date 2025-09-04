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
import { apiClient, Project } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface EditProjectModalProps {
  project: Project;
  onProjectUpdated: () => void;
  children: React.ReactNode;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ project, onProjectUpdated, children }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'You must be logged in to edit a project.', variant: 'destructive' });
      return;
    }
    if (!title.trim()) {
      toast({ title: 'Title cannot be empty.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      await apiClient.updateProject(token, project.projectId, title);
      toast({ title: 'Project updated successfully!' });
      onProjectUpdated();
      setOpen(false);
    } catch (error: any) {
      toast({ title: 'Failed to update project.', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Project Title</DialogTitle>
          <DialogDescription>
            Make changes to your project's title here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectModal;
