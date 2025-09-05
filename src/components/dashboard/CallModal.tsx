import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Phone, Mic, Loader, X, PhoneOff, AlertTriangle } from 'lucide-react';
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

interface ConversationMessage {
  timestamp: string;
  source: 'agent' | 'user';
  message: string;
}

type CallState = 'idle' | 'connecting' | 'connected' | 'ending' | 'ended';

const CREDITS_PER_MINUTE = 3;
const CREDIT_GRACE_PERIOD = 59; // seconds before docking first credit

const CallModal: React.FC<CallModalProps> = ({ isOpen, onClose, projectId, project }) => {
  const { user, profile: userProfile, setProfile } = useAuth();
  const [callState, setCallState] = useState<CallState>('idle');
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [connErr, setConnErr] = useState<string | null>(null);
  const [termination, setTermination] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const callBeganRef = useRef<number | null>(null);
  const isProcessingEndRef = useRef(false);
  const creditCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    startSession,
    endSession,
    status,
    isSpeaking,
    error: sdkError
  } = useConversation({
    onConnect: () => {
      console.log("Connected to conversation");
      callBeganRef.current = Date.now();
      setCallState('connected');
      setConnErr(null);
      setTermination(null);
      // Clear previous conversation when new call starts
      setConversationMessages([]);
    },
    onMessage: (message) => {
      console.log(`Message received: ${message.source}: ${message.message}`);
      const newMessage: ConversationMessage = {
        timestamp: new Date().toLocaleTimeString(),
        source: message.source as 'agent' | 'user',
        message: message.message
      };
      setConversationMessages(prev => [...prev, newMessage]);
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      setConnErr(error.message);
      setCallState('idle');
    },
    onDisconnect: () => {
      console.log("Conversation disconnected");
      if (!isProcessingEndRef.current) {
        setTermination('The assistant ended the call');
        handleCallDisconnection();
      }
    }
  });

  const resetCallState = useCallback(() => {
    setCallState('idle');
    setConversationMessages([]);
    setConnErr(null);
    setTermination(null);
    setIsAnalyzing(false);
    callBeganRef.current = null;
    isProcessingEndRef.current = false;
    
    // Clear any existing intervals
    if (creditCheckIntervalRef.current) {
      clearInterval(creditCheckIntervalRef.current);
      creditCheckIntervalRef.current = null;
    }
  }, []);

  const buildTranscript = useCallback((messages: ConversationMessage[]): string => {
    if (messages.length === 0) return '';
    
    return messages.map(msg => {
      const speaker = msg.source === 'agent' ? 'Alfred (AI Assistant)' : 'User';
      return `[${msg.timestamp}] ${speaker}: ${msg.message}`;
    }).join('\n\n');
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

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      console.log('Requesting microphone permission');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: any) {
      console.error('Microphone permission denied:', error);
      setConnErr(`Microphone access required: ${error.message}`);
      return false;
    }
  };

  const saveSession = async (): Promise<void> => {
    if (!callBeganRef.current || !user || conversationMessages.length === 0) {
      console.log('No session to save or missing required data');
      return;
    }

    const durationSeconds = Math.round((Date.now() - callBeganRef.current) / 1000);
    
    if (durationSeconds < 5) {
      console.log('Session too short to save (< 5 seconds)');
      return;
    }

    const transcript = buildTranscript(conversationMessages);
    console.log(`Saving session: ${durationSeconds}s duration, ${conversationMessages.length} messages`);

    setIsAnalyzing(true);

    try {
      const token = await user.getIdToken();
      
      // Save session with timeout
      const savePromise = apiClient.endSession(token, projectId, { 
        durationSeconds, 
        transcript 
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Save timeout after 30 seconds')), 30000)
      );

      const result = await Promise.race([savePromise, timeoutPromise]);
      console.log('Session saved successfully:', result);

      // Update user profile to reflect new credits
      const updatedProfile = await apiClient.getUserProfile(token);
      setProfile(updatedProfile);
      
      setTermination(`Session saved! Credits used: ${result.creditsDeducted}, Remaining: ${result.remainingCredits}`);
      
    } catch (error: any) {
      console.error("Failed to save session:", error);
      setTermination(`Save failed: ${error.message}`);
      throw error; // Re-throw to handle in calling function
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCallDisconnection = useCallback(async () => {
    if (isProcessingEndRef.current) return;
    
    console.log('Handling call disconnection...');
    isProcessingEndRef.current = true;

    try {
      await saveSession();
    } catch (error) {
      console.error("Error saving session on disconnect:", error);
    }
  }, [saveSession]);

  const startCall = async () => {
    if (callState !== 'idle') return;
    
    console.log('Starting call...');
    setCallState('connecting');
    setConnErr(null);
    setTermination(null);
    
    if (!user || !userProfile || !project) {
      console.error("Missing user, profile, or project info");
      setConnErr("Missing required information");
      setCallState('idle');
      return;
    }
    
    if (userProfile.credits < CREDITS_PER_MINUTE) {
      setConnErr(`You need at least ${CREDITS_PER_MINUTE} credits to start a call.`);
      setCallState('idle');
      return;
    }
    
    // Request microphone permission
    if (!(await requestMicrophonePermission())) {
      setCallState('idle');
      return;
    }

    try {
      // Fetch briefing data
      const token = await user.getIdToken();
      const briefingData = await apiClient.getAgentBriefing(token, projectId);
      console.log('Briefing data loaded');

      const vars = {
        user_name: user.displayName || 'User',
        user_credits: String(userProfile.credits),
        memory_summary: briefingData.briefing || '',
        project_title: project.title || '',
        project_short_description: project.short_description || '',
        project_key_points: project.key_points || '',
        pitch_persona_description: generatePitchPersonaDescription(project.detectedUseCase),
      };

      console.log('Starting session with variables:', vars);
      await startSession({ 
        agentId: 'agent_2201k4ant3h5fmdshkhnpary29wp',
        dynamicVariables: vars 
      });
    } catch (error: any) {
      console.error("Failed to start session:", error);
      setConnErr(`Failed to start session: ${error.message}`);
      setCallState('idle');
    }
  };

  const endCallAndSave = useCallback(async () => {
    if (isProcessingEndRef.current || callState === 'ending' || callState === 'ended') {
      return;
    }

    console.log('Ending call and saving...');
    isProcessingEndRef.current = true;
    setCallState('ending');

    try {
      // Stop the session first
      if (status === 'connected') {
        endSession();
      }

      // Save session data
      await saveSession();
      
    } catch (error: any) {
      console.error("Failed to save session:", error);
      // Don't block closing if save fails, but show error
    } finally {
      // Always close after attempting to save
      setTimeout(() => {
        resetCallState();
        onClose();
      }, 2000); // Give user time to see the result message
    }
  }, [callState, status, endSession, saveSession, resetCallState, onClose]);

  const forceClose = useCallback(() => {
    console.log('Force closing modal');
    
    const shouldForceClose = window.confirm(
      "Are you sure you want to force close? This will end the session without saving your practice data."
    );
    
    if (!shouldForceClose) return;
    
    isProcessingEndRef.current = true;
    
    try {
      if (status === 'connected') {
        endSession();
      }
    } catch (error) {
      console.error("Error stopping session:", error);
    }
    
    resetCallState();
    onClose();
  }, [endSession, resetCallState, onClose, status]);

  const handleClose = useCallback(() => {
    if (callState === 'connected') {
      const shouldClose = window.confirm(
        "You're currently in a call. Closing will end and save your session. Continue?"
      );
      if (shouldClose) {
        endCallAndSave();
      }
      return;
    }
    
    if (callState === 'ending' || isAnalyzing) {
      // Don't allow closing while processing
      return;
    }
    
    resetCallState();
    onClose();
  }, [callState, isAnalyzing, endCallAndSave, resetCallState, onClose]);

  // Credit monitoring with grace period
  useEffect(() => {
    if (callState === 'connected' && callBeganRef.current && userProfile) {
      creditCheckIntervalRef.current = setInterval(() => {
        if (callBeganRef.current && userProfile && !isProcessingEndRef.current) {
          const callDurationSeconds = (Date.now() - callBeganRef.current) / 1000;
          
          // Only start docking credits after the grace period
          let creditsToDeduct = 0;
          if (callDurationSeconds > CREDIT_GRACE_PERIOD) {
            const billableSeconds = callDurationSeconds - CREDIT_GRACE_PERIOD;
            const billableMinutes = Math.ceil(billableSeconds / 60);
            creditsToDeduct = billableMinutes * CREDITS_PER_MINUTE;
          }
          
          console.log(`Call duration: ${Math.floor(callDurationSeconds)}s, Credits to deduct: ${creditsToDeduct}`);
          
          if (userProfile.credits <= creditsToDeduct) {
            console.log('Credit limit reached, ending call');
            setTermination('Credit limit reached - ending call');
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

  // Handle SDK errors
  useEffect(() => {
    if (sdkError) {
      console.error("SDK Error:", sdkError);
      setConnErr(sdkError.message);
      setCallState('idle');
    }
  }, [sdkError]);

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
    if (isAnalyzing) {
      return (
        <div className="flex items-center text-blue-600">
          <Loader className="animate-spin mr-2" /> Analyzing session and saving...
        </div>
      );
    }
    
    if (callState === 'ending') {
      return (
        <div className="flex items-center text-yellow-600">
          <Loader className="animate-spin mr-2" /> Ending call...
        </div>
      );
    }
    
    if (callState === 'connecting' || status === 'connecting') {
      return (
        <div className="flex items-center text-blue-600">
          <Loader className="animate-spin mr-2" /> Connecting...
        </div>
      );
    }
    
    if (connErr) {
      return (
        <div className="flex items-center text-red-500">
          <AlertTriangle className="mr-2" /> {connErr}
        </div>
      );
    }
    
    if (termination) {
      return (
        <div className="text-green-600">
          {termination}
        </div>
      );
    }
    
    if (callState === 'connected' || status === 'connected') {
      return (
        <div className="text-green-500">
          Connected - {isSpeaking ? 'Assistant speaking...' : 'Listening...'}
        </div>
      );
    }
    
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
            Ensure you are in a quiet environment with microphone access.
            <br />
            <span className="text-sm text-yellow-600">
              Cost: {CREDITS_PER_MINUTE} credits per minute (first {CREDIT_GRACE_PERIOD} seconds free)
            </span>
          </p>
          <Button 
            onClick={startCall} 
            disabled={callState === 'connecting' || status === 'connecting'} 
            size="lg"
            className="mb-4"
          >
            {callState === 'connecting' || status === 'connecting' ? (
              <><Loader className="animate-spin mr-2" /> Starting...</>
            ) : (
              <><Mic className="mr-2 h-5 w-5" /> Start Call</>
            )}
          </Button>
          
          {connErr && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {connErr}
            </div>
          )}
          
          {termination && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
              {termination}
            </div>
          )}
        </div>
      );
    }

    return (
      <>
        <CardContent className="flex-grow overflow-y-auto max-h-[400px]">
          <div className="space-y-4">
            {conversationMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Mic className={isSpeaking ? 'w-12 h-12 mx-auto mb-4 text-green-500 animate-pulse' : 'w-12 h-12 mx-auto mb-4 text-gray-400'} />
                <p>{isSpeaking ? 'Assistant is speaking...' : 'Listening for your voice...'}</p>
              </div>
            ) : (
              conversationMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.source === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg max-w-xs lg:max-w-md ${
                    msg.source === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}>
                    <p className="text-xs opacity-75 mb-1">
                      {msg.source === 'user' ? 'You' : 'Assistant'} - {msg.timestamp}
                    </p>
                    <p>{msg.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
        
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Button 
              onClick={endCallAndSave} 
              variant="destructive" 
              className="flex-1"
              disabled={callState === 'ending' || isAnalyzing}
            >
              {callState === 'ending' || isAnalyzing ? (
                <><Loader className="animate-spin mr-2 h-4 w-4" /> 
                  {isAnalyzing ? 'Saving...' : 'Ending...'}
                </>
              ) : (
                <><PhoneOff className="mr-2 h-4 w-4" /> End & Save Session</>
              )}
            </Button>
            <Button 
              onClick={forceClose} 
              variant="outline" 
              size="sm"
              disabled={callState === 'ending' || isAnalyzing}
            >
              Force Close
            </Button>
          </div>
          
          {callBeganRef.current && (
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Session duration: {Math.floor((Date.now() - callBeganRef.current) / 1000)}s
            </div>
          )}
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
              disabled={callState === 'ending' || isAnalyzing}
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
