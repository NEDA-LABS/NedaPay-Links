
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { VerificationQueue } from './VerificationQueue';
import { ComplianceReports } from './ComplianceReports';
import { AuditTrail } from './AuditTrail';
import { VerificationStatus, RiskLevel } from '../../types/kyc';
import { 
  Users, 
  Building, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  BarChart3,
  Shield,
  Search,
  Filter
} from 'lucide-react';

interface AdminDashboardProps {
  onVerificationAction?: (id: string, action: 'approve' | 'reject', notes?: string) => void;
}

// Mock data for demonstration
const MOCK_STATS = {
  totalVerifications: 1247,
  pendingKYC: 23,
  pendingKYB: 12,
  completedToday: 8,
  rejectedToday: 2,
  highRiskCases: 5,
};

const MOCK_PENDING_VERIFICATIONS = [
  {
    id: '1',
    type: 'KYC',
    name: 'John Smith',
    email: 'john.smith@email.com',
    submittedAt: '2024-01-15T10:30:00Z',
    riskLevel: RiskLevel.LOW,
    status: VerificationStatus.IN_REVIEW,
    documentsCount: 3,
  },
  {
    id: '2',
    type: 'KYB',
    name: 'Tech Solutions Inc.',
    email: 'admin@techsolutions.com',
    submittedAt: '2024-01-15T09:15:00Z',
    riskLevel: RiskLevel.MEDIUM,
    status: VerificationStatus.IN_REVIEW,
    documentsCount: 8,
  },
  {
    id: '3',
    type: 'KYC',
    name: 'Maria Rodriguez',
    email: 'maria.r@email.com',
    submittedAt: '2024-01-15T08:45:00Z',
    riskLevel: RiskLevel.HIGH,
    status: VerificationStatus.IN_REVIEW,
    documentsCount: 4,
  },
];

export function AdminDashboard({ onVerificationAction }: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const getRiskBadgeColor = (risk: RiskLevel) => {
    switch (risk) {
      case RiskLevel.LOW:
        return 'bg-green-100 text-green-800';
      case RiskLevel.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case RiskLevel.HIGH:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage KYC/KYB verifications and compliance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Shield className="w-4 h-4 mr-2" />
            Run Compliance Scan
          </Button>
          <Button>
            <BarChart3 className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Verifications</p>
                <p className="text-2xl font-bold">{MOCK_STATS.totalVerifications}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending KYC</p>
                <p className="text-2xl font-bold text-yellow-600">{MOCK_STATS.pendingKYC}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending KYB</p>
                <p className="text-2xl font-bold text-orange-600">{MOCK_STATS.pendingKYB}</p>
              </div>
              <Building className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">{MOCK_STATS.completedToday}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected Today</p>
                <p className="text-2xl font-bold text-red-600">{MOCK_STATS.rejectedToday}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Risk Cases</p>
                <p className="text-2xl font-bold text-red-600">{MOCK_STATS.highRiskCases}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending Verifications</TabsTrigger>
          <TabsTrigger value="queue">Verification Queue</TabsTrigger>
          <TabsTrigger value="reports">Compliance Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="KYC">KYC</SelectItem>
                    <SelectItem value="KYB">KYB</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Pending Verifications Table */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_PENDING_VERIFICATIONS.map((verification) => (
                  <div key={verification.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          {verification.type === 'KYC' ? (
                            <Users className="w-6 h-6 text-gray-600" />
                          ) : (
                            <Building className="w-6 h-6 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold">{verification.name}</h4>
                          <p className="text-sm text-gray-600">{verification.email}</p>
                          <p className="text-xs text-gray-500">
                            Submitted: {formatDate(verification.submittedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{verification.type}</Badge>
                        <Badge className={getRiskBadgeColor(verification.riskLevel)}>
                          {verification.riskLevel} Risk
                        </Badge>
                        <Badge variant="secondary">
                          {verification.documentsCount} docs
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => console.log('View details:', verification.id)}
                          >
                            Review
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => onVerificationAction?.(verification.id, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onVerificationAction?.(verification.id, 'reject')}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue">
          <VerificationQueue />
        </TabsContent>

        <TabsContent value="reports">
          <ComplianceReports />
        </TabsContent>

        <TabsContent value="audit">
          <AuditTrail />
        </TabsContent>
      </Tabs>
    </div>
  );
}
