import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/signin");
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-warm-grey">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/6d93a223-52fd-45a0-9880-510d76c5c0f3.png" 
                alt="Sozo Pitch Helper" 
                className="h-8 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-steel-grey">Welcome, {profile.displayName}</span>
              <Button variant="ghost" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-deep-navy">Dashboard</h1>
          <p className="text-steel-grey mt-2">Manage your pitch practice sessions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-deep-navy mb-2">Credits</h3>
            <p className="text-3xl font-bold text-soft-sky">{profile.credits}</p>
            <p className="text-steel-grey text-sm">Available credits</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-deep-navy mb-2">Account Type</h3>
            <p className="text-lg font-medium text-steel-grey">
              {profile.is_admin ? 'Admin' : 'Standard'}
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-deep-navy mb-2">Member Since</h3>
            <p className="text-lg font-medium text-steel-grey">
              {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </Card>
        </div>

        <Card className="mt-8 p-6">
          <h2 className="text-2xl font-bold text-deep-navy mb-4">Start Practicing</h2>
          <p className="text-steel-grey mb-6">
            Choose your pitch type and begin your AI-powered practice session.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="bg-soft-sky hover:bg-soft-sky/90 text-deep-navy font-medium">
              Job Interview
            </Button>
            <Button className="bg-soft-sky hover:bg-soft-sky/90 text-deep-navy font-medium">
              Investor Pitch
            </Button>
            <Button className="bg-soft-sky hover:bg-soft-sky/90 text-deep-navy font-medium">
              Academic Defense
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;