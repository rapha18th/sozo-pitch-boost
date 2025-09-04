import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const DashboardHeader = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
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
            <span className="text-steel-grey">Credits: {profile?.credits}</span>
            <span className="text-steel-grey">Welcome, {profile?.displayName}</span>
            <Button variant="ghost" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
