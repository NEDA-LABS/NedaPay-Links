
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Search, Shield, User, Building, FileText, Download, Filter } from 'lucide-react';

const MOCK_AUDIT_EVENTS = [
  {
    id: '1',
    timestamp: '2024-01-15T14:30:00Z',
    action: 'KYC_APPROVED',
    user: 'Agent Smith',
    subject: 'John Doe (KYC-001)',
    details: 'KYC verification approved after document review',
    ipAddress: '192.168.1.100',
    userAgent: 'Chrome/96.0.4664.110',
    riskLevel: 'LOW'
  },
  {
    id: '2',
    timestamp: '2024-01-15T14:15:00Z',
    action: 'DOCUMENT_UPLOADED',
    user: 'John Doe',
    subject: 'Passport Document',
    details: 'User uploaded passport document for KYC verification',
    ipAddress: '203.0.113.45',
    userAgent: 'Safari/14.1.2',
    riskLevel: 'LOW'
  },
  {
    id: '3',
    timestamp: '2024-01-15T13:45:00Z',
    action: 'KYB_REJECTED',
    user: 'Agent Johnson',
    subject: 'Tech Corp Inc (KYB-015)',
    details: 'KYB verification rejected due to incomplete documentation',
    ipAddress: '192.168.1.101',
    userAgent: 'Firefox/95.0',
    riskLevel: 'MEDIUM'
  },
  {
    id: '4',
    timestamp: '2024-01-15T13:30:00Z',
    action: 'SANCTIONS_CHECK',
    user: 'System',
    subject: 'Global Sanctions Database',
    details: 'Automated sanctions screening completed for 15 new applications',
    ipAddress: 'System',
    userAgent: 'System',
    riskLevel: 'HIGH'
  },
  {
    id: '5',
    timestamp: '2024-01-15T12:15:00Z',
    action: 'LOGIN_ATTEMPT',
    user: 'Agent Brown',
    subject: 'Admin Dashboard',
    details: 'Successful login to compliance dashboard',
    ipAddress: '192.168.1.102',
    userAgent: 'Chrome/96.0.4664.110',
    riskLevel: 'LOW'
  }
];

const ACTION_TYPES = [
  'KYC_APPROVED',
  'KYC_REJECTED',
  'KYB_APPROVED',
  'KYB_REJECTED',
  'DOCUMENT_UPLOADED',
  'SANCTIONS_CHECK',
  'LOGIN_ATTEMPT',
  'PROFILE_UPDATED'
];

export function AuditTrail() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');

  const getActionIcon = (action: string) => {
    if (action.includes('KYC') || action.includes('KYB')) {
      return action.includes('KYC') ? <User className="w-4 h-4" /> : <Building className="w-4 h-4" />;
    }
    if (action.includes('DOCUMENT')) {
      return <FileText className="w-4 h-4" />;
    }
    if (action.includes('SANCTIONS') || action.includes('CHECK')) {
      return <Shield className="w-4 h-4" />;
    }
    return <Shield className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('APPROVED')) return 'bg-green-100 text-green-800';
    if (action.includes('REJECTED')) return 'bg-red-100 text-red-800';
    if (action.includes('UPLOADED')) return 'bg-blue-100 text-blue-800';
    if (action.includes('CHECK')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredEvents = MOCK_AUDIT_EVENTS.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.user.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === 'all' || event.action === filterAction;
    const matchesUser = filterUser === 'all' || event.user === filterUser;
    
    return matchesSearch && matchesAction && matchesUser;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search audit events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {ACTION_TYPES.map(action => (
                  <SelectItem key={action} value={action}>
                    {action.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="Agent Smith">Agent Smith</SelectItem>
                <SelectItem value="Agent Johnson">Agent Johnson</SelectItem>
                <SelectItem value="Agent Brown">Agent Brown</SelectItem>
                <SelectItem value="System">System</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Audit Trail ({filteredEvents.length} events)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mt-1">
                      {getActionIcon(event.action)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getActionColor(event.action)}>
                          {event.action.replace(/_/g, ' ')}
                        </Badge>
                        <Badge className={getRiskColor(event.riskLevel)}>
                          {event.riskLevel} Risk
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-lg mb-1">{event.subject}</h4>
                      <p className="text-gray-600 mb-2">{event.details}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>User: {event.user}</span>
                        <span>IP: {event.ipAddress}</span>
                        <span>Time: {formatDate(event.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Technical Details (Collapsible) */}
                <details className="mt-3">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded text-sm space-y-1">
                    <div><strong>User Agent:</strong> {event.userAgent}</div>
                    <div><strong>Timestamp:</strong> {event.timestamp}</div>
                    <div><strong>Event ID:</strong> {event.id}</div>
                  </div>
                </details>
              </div>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No audit events found matching your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
