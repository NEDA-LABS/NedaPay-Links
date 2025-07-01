
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Clock, User, Building, AlertTriangle, CheckCircle } from 'lucide-react';

const MOCK_QUEUE_ITEMS = [
  {
    id: '1',
    type: 'KYC',
    applicant: 'Sarah Johnson',
    priority: 'HIGH',
    estimatedTime: '15 mins',
    progress: 75,
    assignedTo: 'Agent Smith',
    lastActivity: '2 mins ago'
  },
  {
    id: '2',
    type: 'KYB',
    applicant: 'Global Tech Corp',
    priority: 'MEDIUM',
    estimatedTime: '45 mins',
    progress: 30,
    assignedTo: 'Agent Johnson',
    lastActivity: '15 mins ago'
  },
  {
    id: '3',
    type: 'KYC',
    applicant: 'Michael Chen',
    priority: 'LOW',
    estimatedTime: '20 mins',
    progress: 10,
    assignedTo: null,
    lastActivity: '1 hour ago'
  }
];

export function VerificationQueue() {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Verification Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Queue Status:</strong> 3 items in queue, 2 currently being processed, average processing time: 28 minutes
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {MOCK_QUEUE_ITEMS.map((item) => (
              <Card key={item.id} className="border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        {item.type === 'KYC' ? (
                          <User className="w-6 h-6 text-primary" />
                        ) : (
                          <Building className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{item.applicant}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{item.type}</Badge>
                          <Badge className={getPriorityColor(item.priority)}>
                            {item.priority} Priority
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Est. Time: {item.estimatedTime}</p>
                      <p className="text-xs text-gray-500">Last activity: {item.lastActivity}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Verification Progress</span>
                        <span>{item.progress}%</span>
                      </div>
                      <Progress value={item.progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {item.assignedTo ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Assigned to {item.assignedTo}
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-yellow-500" />
                            Awaiting assignment
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {!item.assignedTo && (
                          <Button size="sm">
                            Assign to Me
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
