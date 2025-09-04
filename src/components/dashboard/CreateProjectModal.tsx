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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CreateProjectModalProps {
  children: React.ReactNode;
  onProjectCreated: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ children, onProjectCreated }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'You must be logged in to create a project.', variant: 'destructive' });
      return;
    }
    if (!text && !file) {
      toast({ title: 'Please provide either text or a file.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      if (text) {
        formData.append('text', text);
      }
      if (file) {
        formData.append('file', file);
      }

      await apiClient.createProject(token, formData);
      toast({ title: 'Project created successfully!' });
      onProjectCreated();
      setOpen(false);
    } catch (error: any) {
      toast({ title: 'Failed to create project.', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Provide your job description, pitch deck abstract, or presentation summary.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="text" className="py-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Paste Text</TabsTrigger>
            <TabsTrigger value="file">Upload PDF</TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="mt-4">
            <Textarea
              placeholder="Paste your content here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
            />
          </TabsContent>
          <TabsContent value="file" className="mt-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="pdf">PDF File</Label>
              <Input
                id="pdf"
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              />
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;
