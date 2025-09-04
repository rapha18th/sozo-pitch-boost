import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Phone, Mic, Loader, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Project } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  project: Project | null;
}

type CallState = 'idle' | 'connecting' | 'connected' | 'ending' | 'ended';

const CallModal: React.FC<CallModalProps> = ({ isOpen, onClose, projectId, project }) => {
  const { user, profile: userProfile, setProfile } = useAuth();
  const [callState, setCallState] = useState<CallState>('idle');
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const callBeganRef = useRef<number | null>(null);
  const isProcessingEndRef = useRef(false);
  const creditCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    startSession,
    stopSession,
    isConnecting,
    connErr,
    termination,
    chat,
    messages,
  } = useConversation({
    agentId: 'agent_2201k4ant3h5fmdshkhnpary29wp',
    onConnect: () => {
      callBeganRef.current = Date.now();
      setCallState('connected');
    },
    onMessage: (message) => {
      const newMessage = { ...message, timestamp: new Date().toISOString() };
      setConversationMessages(prev => [...prev, newMessage]);
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      // Reset state on error
      if (callState !== 'idle') {
        resetCallState();
      }
    },
    onDisconnect: () => {
      console.log("Conversation disconnected");
      // Only handle disconnect if we're not already processing an end
      if (!isProcessingEndRef.current && callState === 'connected') {
        resetCallState();
      }
    }
  });

  const resetCallState = useCallback(() => {
    setCallState('idle');
    setConversationMessages([]);
    callBeganRef.current = null;
    isProcessingEndRef.current = false;
    
    // Clear any existing intervals
    if (creditCheckIntervalRef.current) {
      clearInterval(creditCheckIntervalRef.current);
      creditCheckIntervalRef.current = null;
    }
  }, []);

  const generatePitchPersonaDescription = (useCase: string | undefined): string => {
    switch (useCase) {
      case 'Job Interview':
        return "You are a sharp, experienced hiring manager at a major tech company.";
      case 'Investor Pitch':
        return "You are a skeptical but fair venture capitalist looking for your next big investment.";
      case 'Academic Presentation':
        return "You are a seasoned professor and a leading expert in the field, known for asking tough questions.";
      default:
        return "You are a helpful and inquisitive conversational partner.";
    }
  };

  const startCall = async () => {
    if (callState !== 'idle') return; // Prevent multiple starts
    
    setCallState('connecting');
    
    if (!user || !userProfile || !project) {
      console.error("Missing user, profile, or project info");
      setCallState('idle');
      return;
    }
    
    if (userProfile.credits < 3) {
      alert("You need at least 3 credits to start a call.");
      setCallState('idle');
      return;
    }
    
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      alert("Microphone access is required to start the practice session.");
      setCallState('idle');
      return;
    }

    try {
      const token = await user.getIdToken();
      const briefingData = await apiClient.getAgentBriefing(token, projectId);

      const vars = {
        user_name: user.displayName || 'User',
        user_credits: String(userProfile.credits),
        memory_summary: briefingData.briefing,
        project_title: project.title,
        project_short_description: project.short_description || '',
        project_key_points: project.key_points || '',
        pitch_persona_description: generatePitchPersonaDescription(project.detectedUseCase),
      };

      await startSession({ dynamicVariables: vars });
    } catch (error) {
      console.error("Failed to start session:", error);
      setCallState('idle');
      alert("Failed to start the session. Please try again.");
    }
  };

  const forceClose = useCallback(() => {
    // Force close without saving - used for emergency close
    isProcessingEndRef.current = true;
    
    try {
      stopSession();
    } catch (error) {
      console.error("Error stopping session:", error);
    }
    
    resetCallState();
    onClose();
  }, [stopSession, resetCallState, onClose]);

  const handleClose = useCallback(() => {
    if (callState === 'connected' || callState === 'ending') {
      // If actively in a call, ask for confirmation
      const shouldClose = window.confirm(
        "You're currently in a call. Are you sure you want to close without saving? This will end the session immediately."
      );
      if (shouldClose) {
        forceClose();
      }
      return;
    }
    
    // Safe to close immediately
    resetCallState();
    onClose();
  }, [callState, forceClose, resetCallState, onClose]);

  const endCallAndSave = useCallback(async () => {
    // Prevent multiple simultaneous end attempts
    if (isProcessingEndRef.current || callState === 'ending' || callState === 'ended') {
      return;
    }

    isProcessingEndRef.current = true;
    setCallState('ending');

    try {
      // Stop the session first
      stopSession();

      // Save session data if we have a valid call
      if (callBeganRef.current && user) {
        const durationSeconds = Math.round((Date.now() - callBeganRef.current) / 1000);
        
        if (durationSeconds > 0) {
          const transcript = conversationMessages
            .map(msg => `[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.author}: ${msg.text}`)
            .join('\n');

          const token = await user.getIdToken();
          
          // Add timeout to prevent hanging
          const savePromise = apiClient.endSession(token, projectId, { 
            durationSeconds, 
            transcript 
          });
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Save timeout')), 10000)
          );

          await Promise.race([savePromise, timeoutPromise]);

          // Update user profile
          const profile = await apiClient.getUserProfile(token);
          setProfile(profile);
        }
      }
    } catch (error) {
      console.error("Failed to save session:", error);
      // Don't block the modal from closing on save errors
      alert("There was an error saving your session. The modal will close anyway.");
    } finally {
      // Always reset and close, regardless of save success/failure
      resetCallState();
      onClose();
    }
  }, [callState, user, projectId, conversationMessages, stopSession, setProfile, onClose, resetCallState]);

  // Handle termination from the conversation hook
  useEffect(() => {
    if (termination && !isProcessingEndRef.current) {
      console.log("Termination detected:", termination);
      endCallAndSave();
    }
  }, [termination, endCallAndSave]);

  // Credit monitoring
  useEffect(() => {
    if (callState === 'connected' && callBeganRef.current && userProfile) {
      creditCheckIntervalRef.current = setInterval(() => {
        if (callBeganRef.current && userProfile && !isProcessingEndRef.current) {
          const durationSeconds = Math.round((Date.now() - callBeganRef.current) / 1000);
          const cost = Math.ceil(durationSeconds / 60) * 3;
          
          if (userProfile.credits <= cost) {
            alert("Credit limit reached. The call will now end.");
            endCallAndSave();
          }
        }
      }, 5000);

      return () => {
        if (creditCheckIntervalRef.current) {
          clearInterval(creditCheckIntervalRef.current);
          creditCheckIntervalRef.current = null;
        }
      };
    }
  }, [callState, userProfile, endCallAndSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (creditCheckIntervalRef.current) {
        clearInterval(creditCheckIntervalRef.current);
      }
    };
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetCallState();
    }
  }, [isOpen, resetCallState]);

  if (!isOpen) {
    return null;
  }

  const getStatusContent = () => {
    if (callState === 'ending') return <div className="flex items-center"><Loader className="animate-spin mr-2" /> Ending call...</div>;
    if (callState === 'connecting' || isConnecting) return <div className="flex items-center"><Loader className="animate-spin mr-2" /> Connecting...</div>;
    if (connErr) return <div className="text-red-500">Connection Error: {connErr}</div>;
    if (termination) return <div className="text-yellow-500">Call Ended: {termination.reason}</div>;
    if (callState === 'connected') return <div className="text-green-500">Connected</div>;
    return <div>Ready to start your practice session.</div>;
  };

  const renderContent = () => {
    if (callState === 'idle' || callState === 'connecting') {
      return (
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">{project?.title}</h2>
          <p className="text-muted-foreground mb-8">
            You are about to start a practice session for a "{project?.detectedUseCase}".
            <br />
            Ensure you are in a quiet environment.
          </p>
          <Button 
            onClick={startCall} 
            disabled={callState === 'connecting'} 
            size="lg"
          >
            {callState === 'connecting' ? (
              <><Loader className="animate-spin mr-2" /> Starting...</>
            ) : (
              <><Mic className="mr-2 h-5 w-5" /> Start Call</>
            )}
          </Button>
        </div>
      );
    }

    return (
      <>
        <CardContent className="flex-grow overflow-y-auto">
          <div className="space-y-4">
            {conversationMessages.map((msg, index) => (
              <div key={index} className={`flex ${msg.author === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-lg max-w-xs lg:max-w-md ${msg.author === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}`}>
                  <p className="font-bold capitalize">{msg.author}</p>
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Button 
              onClick={endCallAndSave} 
              variant="destructive" 
              className="flex-1"
              disabled={callState === 'ending'}
            >
              {callState === 'ending' ? (
                <><Loader className="animate-spin mr-2 h-4 w-4" /> Ending...</>
              ) : (
                <><Phone className="mr-2 h-4 w-4" /> End & Save Session</>
              )}
            </Button>
            <Button 
              onClick={forceClose} 
              variant="outline" 
              size="sm"
              disabled={callState === 'ending'}
            >
              Force Close
            </Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[90vh] flex flex-col">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Practice Session
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose}
              disabled={callState === 'ending'}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
          <div className="text-sm text-muted-foreground">{getStatusContent()}</div>
        </CardHeader>
        {renderContent()}
      </Card>
    </div>
  );
};

export default CallModal;
