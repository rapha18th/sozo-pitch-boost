import React from 'react';
import { Session } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '../ui/button';

interface SessionDetailModalProps {
  session: Session;
  children: React.ReactNode;
}

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({ session, children }) => {
  const ScoreBar: React.FC<{ score: number; label: string }> = ({ score, label }) => (
    <div className="space-y-2">
      <div className="flex justify-between">
        <p className="text-steel-grey">{label}</p>
        <p className="font-semibold text-deep-navy">{score}/100</p>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Session Analysis</DialogTitle>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto p-4">
            <p className="text-sm text-steel-grey mt-2 mb-8">
                Session from {new Date(session.createdAt).toLocaleString()}
            </p>

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
                        {session.feedback?.qualitativeStrengths.split('\\n').map((item, i) => item.trim() && <li key={i}>{item.trim()}</li>)}
                    </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Areas for Improvement</CardTitle></CardHeader>
                    <CardContent>
                    <ul className="list-disc list-inside text-steel-grey space-y-2">
                        {session.feedback?.qualitativeImprovements.split('\\n').map((item, i) => item.trim() && <li key={i}>{item.trim()}</li>)}
                    </ul>
                    </CardContent>
                </Card>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionDetailModal;
