// app/components/SumsubVerification.tsx
'use client';

import React from 'react';
import SumsubWebSdk from "@sumsub/websdk-react";
import Header from '@/components/Header';

interface SumsubConfig {
  lang: string;
  email: string;
  phone: string;
  i18n: {
    document: {
      subTitles: {
        IDENTITY: string;
      };
    };
  };
  onMessage: (type: string, payload: any) => void;
  uiConf: {
    customCssStr: string;
  };
  onError: (error: any) => void;
}

interface SumsubOptions {
  addViewportTag: boolean;
  adaptIframeHeight: boolean;
}

interface TokenResponse {
  success: boolean;
  data: {
    token: string;
    userId: string;
  };
}

const SumsubVerification = () => {
  const [accessToken, setAccessToken] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>("");
  
  // Configuration - replace these with your actual values
  const applicantEmail = "user@example.com";
  const applicantPhone = "+1234567890";
  const userId = "user123"; // Unique identifier for your user
  const levelName = "id-and-liveness"; // Your KYC level name
  
  // Using Next.js API route
  const API_URL = '/api/sumsub/generate-access-token';

  // Function to generate access token from backend
  const generateAccessToken = async (): Promise<string> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          levelName,
          email: applicantEmail,
          phone: applicantPhone,
          ttlInSecs: 600 // 10 minutes
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TokenResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to generate access token');
      }

      return data.data.token;
    } catch (err) {
      console.error('Error generating access token:', err);
      throw new Error('Failed to generate access token');
    }
  };

  // Initialize access token on component mount
  React.useEffect(() => {
    const initializeToken = async () => {
      try {
        setLoading(true);
        const token = await generateAccessToken();
        setAccessToken(token);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    initializeToken();
  }, []);

  const updateAccessToken = async (): Promise<void> => {
    try {
      console.log("Updating access token...");
      const newToken = await generateAccessToken();
      setAccessToken(newToken);
    } catch (err) {
      console.error("Failed to update access token:", err);
    }
  };

  const expirationHandler = async (): Promise<string> => {
    try {
      console.log("Access token expired, generating new one...");
      const newToken = await generateAccessToken();
      setAccessToken(newToken);
      return newToken;
    } catch (err) {
      console.error("Failed to handle token expiration:", err);
      throw err;
    }
  };

  const handleMessage = (type: string, payload: any): void => {
    console.log("WebSDK onMessage", type, payload);
  };

  const handleError = (error: any): void => {
    console.error("WebSDK onError", error);
  };

  const config: SumsubConfig = {
    lang: "en",
    email: applicantEmail,
    phone: applicantPhone,
    i18n: {
      document: {
        subTitles: {
          IDENTITY: "Upload a document that proves your identity"
        }
      }
    },
    onMessage: handleMessage,
    uiConf: {
      customCssStr: `
        :root {
          --black: #1f2937;
          --grey: #f9fafb;
          --grey-darker: #6b7280;
          --border-color: #d1d5db;
        }

        p {
          color: var(--black);
          font-size: 16px;
          line-height: 24px;
        }

        section {
          margin: 40px auto;
        }

        input {
          color: var(--black);
          font-weight: 600;
          outline: none;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px;
        }

        section.content {
          background-color: var(--grey);
          color: var(--black);
          padding: 40px 40px 16px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          border-radius: 12px;
        }

        button.submit,
        button.back {
          text-transform: capitalize;
          border-radius: 8px;
          height: 48px;
          padding: 0 30px;
          font-size: 16px;
          font-weight: 600;
          background-image: none !important;
          transform: none !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
          transition: all 0.2s ease-in-out;
          border: none;
        }

        button.submit {
          min-width: 132px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        button.submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        }

        button.back {
          background-color: #f3f4f6;
          color: var(--black);
        }

        .round-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          background-image: none !important;
        }
      `
    },
    onError: handleError
  };

  const options: SumsubOptions = {
    addViewportTag: false,
    adaptIframeHeight: true
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Initializing Verification</h2>
          <p className="text-gray-600">Please wait while we prepare your verification session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="bg-red-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Initialization Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
        <Header />
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-100 text-center mb-2">
            Identity Verification
          </h1>
          <p className="text-gray-100 text-center mb-4">
            Please complete the verification process below to continue
          </p>
        </div>
        
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <SumsubWebSdk
            accessToken={accessToken}
            expirationHandler={expirationHandler}
            config={config}
            options={options}
            onMessage={handleMessage}
            onError={handleError}
          />
        </div>
      </div>
    </div>
    </div>
  );
};

export default SumsubVerification;