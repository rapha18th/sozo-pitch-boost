import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Session } from '@/lib/api';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const SessionDetail = () => {
  const { id: projectId, sessionId } = useParams<{ id: string; sessionId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      if (!user || !projectId || !sessionId) return;
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const sessionData = await apiClient.getSessionDetails(token, projectId, sessionId);
        setSession(sessionData);
      } catch (error) {
        console.error("Failed to fetch session", error);
        toast({ title: 'Failed to fetch session details.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [user, projectId, sessionId, toast]);

  const ScoreBar: React.FC<{ score: number; label: string }> = ({ score, label }) => (
    <div className="space-y-2">
      <div className="flex justify-between">
        <p className="text-steel-grey">{label}</p>
        <p className="font-semibold text-deep-navy">{score}/100</p>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-grey">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card><CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader><CardContent><Skeleton className="h-40" /></CardContent></Card>
              <Card><CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader><CardContent><Skeleton className="h-20" /></CardContent></Card>
            </div>
            <div className="space-y-8">
              <Card><CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader><CardContent><Skeleton className="h-48" /></CardContent></Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-warm-grey">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-deep-navy">Session not found</h1>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-grey">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-deep-navy">Session Analysis</h1>
          <p className="text-sm text-steel-grey mt-2">
            Session from {new Date(session.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader><CardTitle>Transcript</CardTitle></CardHeader>
              <CardContent>
                <p className="text-steel-grey whitespace-pre-wrap">{session.transcript}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Context-Specific Feedback</CardTitle></CardHeader>
              <CardContent>
                <blockquote className="border-l-4 pl-4 italic text-steel-grey">
                  {session.feedback?.contextSpecificFeedback}
                </blockquote>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader><CardTitle>Performance Scores</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <ScoreBar score={session.feedback?.communicationScore ?? 0} label="Communication" />
                <ScoreBar score={session.feedback?.contentMasteryScore ?? 0} label="Content Mastery" />
                <ScoreBar score={session.feedback?.engagementDeliveryScore ?? 0} label="Engagement & Delivery" />
                <ScoreBar score={session.feedback?.resilienceScore ?? 0} label="Resilience" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Strengths</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-steel-grey space-y-2">
                  {session.feedback?.qualitativeStrengths.split('\n').map((item, i) => item.trim() && <li key={i}>{item.trim()}</li>)}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Areas for Improvement</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-steel-grey space-y-2">
                  {session.feedback?.qualitativeImprovements.split('\n').map((item, i) => item.trim() && <li key={i}>{item.trim()}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SessionDetail;
