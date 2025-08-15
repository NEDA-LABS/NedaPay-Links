"use client";
import React from 'react';
import SumsubWebSdk from "@sumsub/websdk-react";

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

const App: React.FC = () => {
  const applicantEmail = "";
  const applicantPhone = "";
  const accessToken = "";
  
  console.log(accessToken);

  const updateAccessToken = (): void => {
    console.log("updateAccessToken");
  };

  const expirationHandler = (): Promise<string> => {
    return Promise.resolve(accessToken);
  };

  const handleMessage = (type: string, payload: any): void => {
    console.log("WebSDK onMessage", type, payload);
  };

  const handleError = (error: any): void => {
    console.error("WebSDK onError", error);
  };

  const onMessage = (type: string, payload: any): void => {
    console.log("onMessage", type, payload);
  };

  const onError = (data: any): void => {
    console.log("onError", data);
  };

  const config: SumsubConfig = {
    lang: "ru-RU",
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
          --black: #000000;
          --grey: #F5F5F5;
          --grey-darker: #B2B2B2;
          --border-color: #DBDBDB;
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
        }

        section.content {
          background-color: var(--grey);
          color: var(--black);
          padding: 40px 40px 16px;
          box-shadow: none;
          border-radius: 6px;
        }

        button.submit,
        button.back {
          text-transform: capitalize;
          border-radius: 6px;
          height: 48px;
          padding: 0 30px;
          font-size: 16px;
          background-image: none !important;
          transform: none !important;
          box-shadow: none !important;
          transition: all 0.2s linear;
        }

        button.submit {
          min-width: 132px;
          background: none;
          background-color: var(--black);
        }

        .round-icon {
          background-color: var(--black) !important;
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
            Identity Verification
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Please complete the verification process below
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <SumsubWebSdk
            accessToken={accessToken}
            expirationHandler={expirationHandler}
            config={config}
            options={options}
            onMessage={onMessage}
            onError={onError}
          />
        </div>
      </div>
    </div>
  );
};

export default App;