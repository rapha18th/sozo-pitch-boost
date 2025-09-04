import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RequestCreditsModal from "@/components/dashboard/RequestCreditsModal";
import CreateProjectModal from "@/components/dashboard/CreateProjectModal";
import { useEffect, useState } from "react";
import { apiClient, Project } from "@/lib/api";
import ProjectList from "@/components/dashboard/ProjectList";

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const fetchProjects = async () => {
    if (!user) return;
    setLoadingProjects(true);
    try {
      const token = await user.getIdToken();
      const projectList = await apiClient.listProjects(token);
      setProjects(projectList);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  return (
    <div className="min-h-screen bg-warm-grey">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-deep-navy">Dashboard</h1>
            <p className="text-steel-grey mt-2">Manage your pitch practice sessions</p>
          </div>
          <div className="flex space-x-4">
            <RequestCreditsModal>
              <Button variant="outline">Request Credits</Button>
            </RequestCreditsModal>
            <CreateProjectModal onProjectCreated={fetchProjects}>
              <Button className="bg-soft-sky hover:bg-soft-sky/90 text-deep-navy font-medium">
                Create New Project
              </Button>
            </CreateProjectModal>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-deep-navy mb-2">Credits</h3>
            <p className="text-3xl font-bold text-soft-sky">{profile?.credits}</p>
            <p className="text-steel-grey text-sm">Available credits</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-deep-navy mb-2">Account Type</h3>
            <p className="text-lg font-medium text-steel-grey">
              {profile?.is_admin ? 'Admin' : 'Standard'}
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-deep-navy mb-2">Member Since</h3>
            <p className="text-lg font-medium text-steel-grey">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-deep-navy mb-4">My Projects</h2>
          <ProjectList projects={projects} loading={loadingProjects} onProjectChange={fetchProjects} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;