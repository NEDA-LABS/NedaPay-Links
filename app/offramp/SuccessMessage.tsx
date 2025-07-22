import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface SuccessMessageProps {
  success: string;
  onBack: () => void;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ success, onBack }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">
          Your offramp transaction has been initiated successfully
        </p>
        
        <div className="bg-gray-50 rounded-xl p-6 text-left mb-6">
          <pre className="whitespace-pre-wrap text-sm text-gray-800">{success}</pre>
        </div>
        
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 mx-auto px-6 py-3 !bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 !text-white !font-medium !rounded-xl !shadow-lg hover:!shadow-xl !transition-all !duration-300 text-base transform hover:-translate-y-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Make Another Transaction
        </button>
        
        <p className="text-sm text-gray-500 mt-4">
          You can track the status of your transaction in your account history
        </p>
      </div>
    </div>
  );
};

export default SuccessMessage;