"use client";

import React from "react";
import SumsubWebSdk from "@sumsub/websdk-react";
import Header from "@/components/Header";
import { usePrivy, useLinkAccount } from "@privy-io/react-auth";
import { useUserSync } from "../hooks/useUserSync";
import toast from "react-hot-toast";

interface SumsubConfig {
  lang: string;
  email: string;
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
// const { linkEmail } = useLinkAccount({
//   onSuccess: ({ user, linkMethod, linkedAccount }) => {
//     // console.log("Linked account to user ", linkedAccount);
//     toast.success("Email linked successfully!");
//   },
//   onError: (error) => {
//     // console.error("Failed to link account with error ", error);
//     toast.error("Failed to link email. Please try again.");
//   },
// });
const SumsubVerification = () => {
  const { user, ready: privyReady } = usePrivy();
  const { hasEmail, addEmail } = useUserSync();
  const { linkEmail } = useLinkAccount({
    onSuccess: () => {
      toast.success("Email linked successfully!");
      // After email is added, reload the component to proceed with verification
      window.location.reload();
    },
    onError: (error) => {
      console.error("Email linking failed:", error);
      toast.error("Failed to link email. Please try again.");
    },
  });

  const [accessToken, setAccessToken] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>("");
  const [linkingEmail, setLinkingEmail] = React.useState<boolean>(false);

  const applicantEmail = user?.email?.address;
  const userId = user?.id;
  const levelName = "id-and-liveness";
  const API_URL = "/api/sumsub/generate-access-token";

  const generateAccessToken = async (): Promise<string> => {
    if (!applicantEmail) {
      throw new Error("Email is required for verification");
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          levelName,
          email: applicantEmail,
          ttlInSecs: 600,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TokenResponse = await response.json();

      if (!data.success) {
        throw new Error("Failed to generate access token");
      }

      return data.data.token;
    } catch (err) {
      console.error("Error generating access token:", err);
      throw new Error("Failed to generate access token");
    }
  };

  React.useEffect(() => {
    if (!privyReady) return;

    // Only proceed with token generation if user has email
    if (!hasEmail) {
      setLoading(false);
      return;
    }

    const initializeToken = async () => {
      try {
        setLoading(true);
        const token = await generateAccessToken();
        setAccessToken(token);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    initializeToken();
  }, [privyReady, hasEmail]);

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
      // console.log("Access token expired, generating new one...");
      const newToken = await generateAccessToken();
      setAccessToken(newToken);
      return newToken;
    } catch (err) {
      // console.error("Failed to handle token expiration:", err);
      throw err;
    }
  };

  const handleMessage = (type: string, payload: any): void => {
    // console.log("WebSDK onMessage", type, payload);
  };

  const handleError = (error: any): void => {
    // console.error("WebSDK onError", error);
  };

  const config: SumsubConfig = {
    lang: "en",
    email: applicantEmail || "",
    i18n: {
      document: {
        subTitles: {
          IDENTITY: "Upload a document that proves your identity",
        },
      },
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
      `,
    },
    onError: handleError,
  };

  const options: SumsubOptions = {
    addViewportTag: false,
    adaptIframeHeight: true,
  };

  if (!privyReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Loading Authentication
          </h2>
          <p className="text-gray-600">
            Please wait while we prepare your verification session...
          </p>
        </div>
      </div>
    );
  }

  if (!hasEmail) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Email Verification Required
              </h2>
              <p className="text-gray-600">
                To complete identity verification, please add and verify your
                email address.
              </p>
            </div>

            <button
              onClick={() => {
                try {
                  setLinkingEmail(true);
                  linkEmail();
                } catch (error) {
                  setLinkingEmail(false);
                  console.error("Error linking email:", error);
                }
              }}
              disabled={linkingEmail}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {linkingEmail ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Verifying Email...
                </span>
              ) : (
                "Add Email Address"
              )}
            </button>

            <p className="text-gray-500 text-sm mt-4">
              You'll receive a verification code to confirm your email address.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Initializing Verification
          </h2>
          <p className="text-gray-600">
            Please wait while we prepare your verification session...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="bg-red-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Verification Error
          </h2>
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
        <div className="max-w-4xl mx-auto w-full">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Identity Verification
            </h1>
            <p className="text-gray-300">
              Complete verification to access all platform features
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

          <div className="mt-6 text-center text-gray-400 text-sm">
            <p>Having trouble with verification? Contact <a href="mailto:support@nedapay.xyz" className="text-blue-500 hover:text-blue-700 underline">support@nedapay.xyz</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SumsubVerification;
