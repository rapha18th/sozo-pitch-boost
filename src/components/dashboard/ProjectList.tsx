import React from 'react';
import { apiClient, Project } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import EditProjectModal from './EditProjectModal';
import DeleteProjectConfirmModal from './DeleteProjectConfirmModal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProjectListProps {
  projects: Project[];
  loading: boolean;
  onProjectChange: () => void;
}

const ProjectCard: React.FC<{ project: Project; onProjectChange: () => void; }> = ({ project, onProjectChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const getBadgeVariant = (useCase: string) => {
    switch (useCase) {
      case 'Job Interview':
        return 'default';
      case 'Investor Pitch':
        return 'secondary';
      case 'Academic Presentation':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await apiClient.deleteProject(token, project.projectId);
      toast({ title: 'Project deleted successfully!' });
      onProjectChange();
    } catch (error: any) {
      toast({ title: 'Failed to delete project.', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Card className="p-6 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-deep-navy">{project.title}</h3>
          <Badge variant={getBadgeVariant(project.detectedUseCase)}>{project.detectedUseCase}</Badge>
        </div>
        <p className="text-sm text-steel-grey mb-4">
          Created on: {new Date(project.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex justify-end space-x-2 mt-4">
        <EditProjectModal project={project} onProjectUpdated={onProjectChange}>
          <Button variant="outline" size="sm">Edit</Button>
        </EditProjectModal>
        <DeleteProjectConfirmModal onConfirm={handleDelete}>
          <Button variant="destructive" size="sm">Delete</Button>
        </DeleteProjectConfirmModal>
        <Link to={`/project/${project.projectId}`}>
          <Button size="sm">View</Button>
        </Link>
      </div>
    </Card>
  );
};

const ProjectList: React.FC<ProjectListProps> = ({ projects, loading, onProjectChange }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <div className="flex justify-end space-x-2 mt-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <h3 className="text-xl font-semibold text-deep-navy">No projects yet</h3>
        <p className="text-steel-grey mt-2">Create your first project to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.projectId} project={project} onProjectChange={onProjectChange} />
      ))}
    </div>
  );
};

export default ProjectList;
