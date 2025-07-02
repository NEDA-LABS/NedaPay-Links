
import { useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { DocumentUpload } from '../../kyc/DocumentUpload';
import { DocumentType, VerificationStatus } from '../../../types/kyc';
import { FileText, Building, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BusinessDocumentsStepProps {
  onNext: (data: any) => void;
  onPrevious: () => void;
}

interface DocumentState {
  type: DocumentType;
  title: string;
  description: string;
  file?: File;
  status: VerificationStatus;
  required: boolean;
}

export function BusinessDocumentsStep({ onNext, onPrevious }: BusinessDocumentsStepProps) {
  const [documents, setDocuments] = useState<DocumentState[]>([
    {
      type: DocumentType.BUSINESS_REGISTRATION,
      title: 'Certificate of Incorporation',
      description: 'Official business registration certificate or articles of incorporation',
      status: VerificationStatus.PENDING,
      required: true,
    },
    {
      type: DocumentType.ARTICLES_OF_INCORPORATION,
      title: 'Articles of Association/Bylaws',
      description: 'Company bylaws or articles of association document',
      status: VerificationStatus.PENDING,
      required: true,
    },
    {
      type: DocumentType.TAX_CERTIFICATE,
      title: 'Tax Registration Certificate',
      description: 'Tax identification number certificate or EIN documentation',
      status: VerificationStatus.PENDING,
      required: true,
    },
    {
      type: DocumentType.PROOF_OF_ADDRESS,
      title: 'Business Address Verification',
      description: 'Utility bill, lease agreement, or official document showing business address',
      status: VerificationStatus.PENDING,
      required: true,
    },
    {
      type: DocumentType.FINANCIAL_STATEMENT,
      title: 'Financial Statements',
      description: 'Recent audited financial statements or bank statements (if required)',
      status: VerificationStatus.PENDING,
      required: false,
    },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (docType: DocumentType, file: File) => {
    setDocuments(prev => prev.map(doc => 
      doc.type === docType 
        ? { ...doc, file, status: VerificationStatus.IN_REVIEW }
        : doc
    ));
  };

  const handleRemoveFile = (docType: DocumentType) => {
    setDocuments(prev => prev.map(doc => 
      doc.type === docType 
        ? { ...doc, file: undefined, status: VerificationStatus.PENDING }
        : doc
    ));
  };

  const canProceed = documents.filter(doc => doc.required).every(doc => doc.file);

  const handleNext = async () => {
    if (!canProceed) return;

    setIsProcessing(true);
    
    // Simulate document processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update document statuses
    setDocuments(prev => prev.map(doc => ({
      ...doc,
      status: doc.file ? VerificationStatus.APPROVED : doc.status
    })));

    const documentData = documents.reduce((acc, doc) => {
      if (doc.file) {
        acc[doc.type] = {
          type: doc.type,
          file: doc.file,
          status: VerificationStatus.APPROVED,
        };
      }
      return acc;
    }, {} as any);

    setIsProcessing(false);
    onNext({ businessDocuments: documentData });
  };

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.APPROVED:
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case VerificationStatus.IN_REVIEW:
        return <Shield className="w-5 h-5 text-warning" />;
      case VerificationStatus.REJECTED:
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: VerificationStatus, required: boolean) => {
    switch (status) {
      case VerificationStatus.APPROVED:
        return <Badge className="bg-success">Verified</Badge>;
      case VerificationStatus.IN_REVIEW:
        return <Badge className="bg-warning">Processing</Badge>;
      case VerificationStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant={required ? "default" : "outline"}>
          {required ? "Required" : "Optional"}
        </Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Business documents are securely encrypted and stored. We comply with international data protection standards.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {documents.map((doc) => (
          <Card key={doc.type} className="transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(doc.status)}
                  <div>
                    <CardTitle className="text-lg">{doc.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                  </div>
                </div>
                {getStatusBadge(doc.status, doc.required)}
              </div>
            </CardHeader>
            <CardContent>
              <DocumentUpload
                documentType={doc.type}
                onFileUpload={(file) => handleFileUpload(doc.type, file)}
                onFileRemove={() => handleRemoveFile(doc.type)}
                currentFile={doc.file}
                maxSize={10} // 10MB
                acceptedTypes={['image/jpeg', 'image/png', 'application/pdf']}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Document Requirements */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Building className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Document Requirements</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• All documents must be current and not expired</li>
                <li>• Documents should be clear, readable, and in color</li>
                <li>• Accepted formats: PDF, JPG, PNG (max 10MB each)</li>
                <li>• Documents must be official and issued by relevant authorities</li>
                <li>• Translated documents must include certified translations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!canProceed || isProcessing}
          className="px-8"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing Documents...
            </>
          ) : (
            'Continue to Ownership Structure'
          )}
        </Button>
      </div>
    </div>
  );
}
