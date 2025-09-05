import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Project } from '@/lib/api';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import PracticeSessionList from '@/components/dashboard/PracticeSessionList';
import CallModal from '@/components/dashboard/CallModal';
import { Link } from 'react-router-dom';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, setProfile } = useAuth();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  const fetchProject = async () => {
    if (!user || !id) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const projectData = await apiClient.getProject(token, id);
      setProject(projectData);
    } catch (error) {
      console.error("Failed to fetch project", error);
      toast({ title: 'Failed to fetch project details.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [user, id, toast]);

  const handleGenerateBriefing = async () => {
    if (!user || !id) return;
    setLoadingBriefing(true);
    try {
      // Briefing generation temporarily disabled
      setBriefing("Briefing generation is temporarily disabled. You can still start practice sessions using your original project briefing.");
    } catch (error) {
      console.error("Failed to generate briefing", error);
      toast({ title: 'Failed to generate briefing.', variant: 'destructive' });
    } finally {
      setLoadingBriefing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-grey">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Card className="p-6">
            <Skeleton className="h-6 w-1/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-warm-grey">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-deep-navy">Project not found</h1>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-grey">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button asChild variant="outline" className="mb-4">
          <Link to="/dashboard">&larr; Back to Dashboard</Link>
        </Button>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-deep-navy">{project.title}</h1>
          </div>
          <Badge>{project.detectedUseCase}</Badge>
        </div>
        <p className="text-sm text-steel-grey mb-8">
          Created on: {new Date(project.createdAt).toLocaleDateString()}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <PracticeSessionList sessions={project.practiceSessions} projectId={project.projectId} />
          </div>

          <div className="space-y-8">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-deep-navy mb-4">Agent Briefing</h2>
              <Button onClick={handleGenerateBriefing} disabled={loadingBriefing} className="w-full mb-4">
                {loadingBriefing ? 'Generating...' : 'Generate Briefing'}
              </Button>
              {briefing && (
                <div className="bg-warm-grey p-4 rounded-md">
                  <p className="text-steel-grey whitespace-pre-wrap">{briefing}</p>
                </div>
              )}
            </Card>
            <Card className="p-6 bg-gray-100 border-dashed">
                <h2 className="text-2xl font-bold text-deep-navy mb-4">Start Practice</h2>
                <p className="text-steel-grey mb-4">
                    Click the button below to start a real-time practice session with our AI agent.
                </p>
                <Button onClick={() => setIsCallModalOpen(true)} className="w-full">Start Practice Session</Button>
            </Card>
          </div>
        </div>
      </main>
      {isCallModalOpen && (
        <CallModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          projectId={project.projectId}
          project={project}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
