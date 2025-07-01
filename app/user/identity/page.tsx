
'use client'

import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { KYCWizard } from '../components/kyc/KYCWizard'
import { Badge } from '../components/ui/badge'
import { User, Building, Shield, CheckCircle } from 'lucide-react'

export default function HomePage() {
  const [activeView, setActiveView] = useState<'home' | 'kyc' | 'kyb'>('home')

  const handleKYCComplete = () => {
    console.log('KYC completed')
    setActiveView('home')
  }

  if (activeView === 'kyc') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button 
              onClick={() => setActiveView('home')}
              className="mb-4"
            >
              ← Back to Home
            </Button>
          </div>
          <KYCWizard onComplete={handleKYCComplete} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            KYC/KYB Verification Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamlined identity and business verification for compliance and security
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* KYC Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                Know Your Customer (KYC)
              </CardTitle>
              <CardDescription>
                Individual identity verification for personal accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Personal Information Verification
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Identity Document Upload
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Financial Information
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Individual</Badge>
              <Button 
                className="w-full" 
                onClick={() => setActiveView('kyc')}
              >
                Start KYC Verification
              </Button>
            </CardContent>
          </Card>

          {/* KYB Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building className="w-6 h-6 text-green-600" />
                </div>
                Know Your Business (KYB)
              </CardTitle>
              <CardDescription>
                Business entity verification for corporate accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Business Registration Details
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Corporate Documents
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Ownership Structure
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Business</Badge>
              <Button 
                className="w-full" 
                disabled
              >
                Start KYB Verification
                <span className="text-xs ml-2">(Coming Soon)</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-8">Why Choose Our Platform?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6">
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Secure & Compliant</h3>
              <p className="text-gray-600">Bank-level security with full regulatory compliance</p>
            </div>
            <div className="p-6">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Fast Processing</h3>
              <p className="text-gray-600">Quick verification with real-time status updates</p>
            </div>
            <div className="p-6">
              <User className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">User Friendly</h3>
              <p className="text-gray-600">Intuitive interface with step-by-step guidance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
