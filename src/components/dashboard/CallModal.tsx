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

type CallState = 'idle' | 'connecting' | 'connected' | 'ended';

const CallModal: React.FC<CallModalProps> = ({ isOpen, onClose, projectId, project }) => {
  const { user, profile: userProfile, setProfile } = useAuth();
  const [callState, setCallState] = useState<CallState>('idle');
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const callBeganRef = useRef<number | null>(null);

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
    },
    onDisconnect: () => {
      // The hangUp logic will handle this
    }
  });

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

    startSession({ dynamicVariables: vars });
  };

  const handleClose = useCallback(() => {
    if (callState === 'connected') {
      stopSession();
      // No need to save session if user just closes modal
    }
    setConversationMessages([]);
    callBeganRef.current = null;
    setCallState('idle');
    onClose();
  }, [callState, stopSession, onClose]);

  const hangUpAndSave = useCallback(async () => {
    stopSession();
    setCallState('ended');

    try {
      if (callBeganRef.current && user) {
        const durationSeconds = Math.round((Date.now() - callBeganRef.current) / 1000);
        if (durationSeconds > 0) {
          const transcript = conversationMessages
            .map(msg => `[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.author}: ${msg.text}`)
            .join('\n');

          const token = await user.getIdToken();
          await apiClient.endSession(token, projectId, { durationSeconds, transcript });

          const profile = await apiClient.getUserProfile(token);
          setProfile(profile);
        }
      }
    } catch (error) {
      console.error("Failed to save session:", error);
      alert("There was an error saving your session. Your credits were not deducted.");
    } finally {
      setConversationMessages([]);
      callBeganRef.current = null;
      setCallState('idle');
      onClose();
    }
  }, [user, projectId, conversationMessages, stopSession, onClose, setProfile]);

  useEffect(() => {
    if (callState === 'connected') {
      const interval = setInterval(() => {
        if (callBeganRef.current && userProfile) {
          const durationSeconds = Math.round((Date.now() - callBeganRef.current) / 1000);
          const cost = Math.ceil(durationSeconds / 60) * 3;
          if (userProfile.credits <= cost) {
            alert("Credit limit reached. The call will now end.");
            hangUpAndSave();
          }
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [callState, userProfile, hangUpAndSave]);

  if (!isOpen) {
    return null;
  }

  const getStatusContent = () => {
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
          <Button onClick={startCall} disabled={callState === 'connecting'} size="lg">
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
          <Button onClick={hangUpAndSave} variant="destructive" className="w-full">
            <Phone className="mr-2 h-4 w-4" /> End & Save Session
          </Button>
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
            <Button variant="ghost" size="icon" onClick={handleClose}>
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
