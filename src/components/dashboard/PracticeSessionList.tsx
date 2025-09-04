import React from 'react';
import { Session } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface PracticeSessionListProps {
  sessions: Record<string, Session>;
  projectId: string;
}

const PracticeSessionList: React.FC<PracticeSessionListProps> = ({ sessions, projectId }) => {
  const sessionArray = Object.values(sessions);

  if (sessionArray.length === 0) {
    return <p className="text-steel-grey">No practice sessions yet.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Practice Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Communication</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Resilience</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessionArray.map((session) => (
              <TableRow key={session.sessionId}>
                <TableCell>{new Date(session.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{Math.round(session.durationSeconds / 60)} min</TableCell>
                <TableCell>{session.feedback?.communicationScore ?? 'N/A'}</TableCell>
                <TableCell>{session.feedback?.contentMasteryScore ?? 'N/A'}</TableCell>
                <TableCell>{session.feedback?.engagementDeliveryScore ?? 'N/A'}</TableCell>
                <TableCell>{session.feedback?.resilienceScore ?? 'N/A'}</TableCell>
                <TableCell>
                  <Link to={`/project/${projectId}/session/${session.sessionId}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PracticeSessionList;
