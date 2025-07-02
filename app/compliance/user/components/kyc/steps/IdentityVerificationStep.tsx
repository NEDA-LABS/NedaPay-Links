
import { useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { DocumentUpload } from '../DocumentUpload';
import { DocumentType, VerificationStatus } from '../../../types/kyc';
import { Upload, Camera, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from 'sonner';

interface IdentityVerificationStepProps {
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

export function IdentityVerificationStep({ onNext, onPrevious }: IdentityVerificationStepProps) {
  const { user } = usePrivy();
  const [documents, setDocuments] = useState<DocumentState[]>([
    {
      type: DocumentType.NATIONAL_ID,
      title: 'Government-Issued ID',
      description: 'Upload a clear photo of your passport, driver\'s license, or national ID',
      status: VerificationStatus.PENDING,
      required: true,
    },
    {
      type: DocumentType.SELFIE,
      title: 'Selfie Verification',
      description: 'Take a clear selfie holding your ID document',
      status: VerificationStatus.PENDING,
      required: true,
    },
    // {
    //   type: DocumentType.PROOF_OF_ADDRESS,
    //   title: 'Proof of Address',
    //   description: 'Upload a recent utility bill, bank statement, or official document showing your address',
    //   status: VerificationStatus.PENDING,
    //   required: true,
    // },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const walletAddress = user?.wallet?.address;

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
    
    try {
      // Create FormData object
      const formData = new FormData();
      
      // Add each document file
      documents.forEach(doc => {
        if (doc.file) {
          formData.append('files', doc.file);
        }
      });
      
      // Add application ID (using user's wallet address as ID)
      formData.append('applicationId', user?.wallet?.address || '');

      // Submit to API
      const response = await fetch('/api/kyc/documents', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Update document statuses based on API response
      setDocuments(prev => prev.map(doc => ({
        ...doc,
        status: doc.file ? VerificationStatus.APPROVED : doc.status
      })));

      toast.success('Documents uploaded successfully');
      onNext({ documents: result.data.documents });
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Failed to upload documents');
    } finally {
      setIsProcessing(false);
    }
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
        return <Upload className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.APPROVED:
        return <Badge className="bg-success">Verified</Badge>;
      case VerificationStatus.IN_REVIEW:
        return <Badge className="bg-warning">Processing</Badge>;
      case VerificationStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Required</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your documents are encrypted and securely stored. We use industry-standard security measures to protect your personal information.
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
                {getStatusBadge(doc.status)}
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

      {/* Security Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Shield className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Document Security</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• All documents are encrypted using AES-256 encryption</li>
                <li>• Files are automatically deleted after verification is complete</li>
                <li>• We comply with GDPR and other privacy regulations</li>
                <li>• Your data is never shared with third parties without consent</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-6">
      <p className="text-sm">Make sure to fill all the required fields correctly, if you click continue you can't go back</p>
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
            'Continue to Financial Information'
          )}
        </Button>
      </div>
    </div>
  );
}
