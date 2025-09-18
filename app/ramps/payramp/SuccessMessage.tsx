import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';

interface SuccessMessageProps {
  success: string;
  onBack: () => void;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ success, onBack }) => {
  return (
    <div className="bg-gray-800 backdrop-blur-sm rounded-3xl px-4 shadow-2xl border border-white/20">
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-30 h-30 mb-4">
          <Image
            src="/logo.svg"
            alt="Success"
            width={100}
            height={100}
          />
         
        </div>
        <h2 className="text-lg font-bold text-gray-100 mb-2">Payment Successful!</h2>
        <p className="text-gray-100 mb-6">
          Your offramp transaction has been initiated successfully
        </p>
        
        <div className="bg-gray-50 rounded-xl p-6 text-left mb-6">
          <pre className="whitespace-pre-wrap text-xs text-gray-800">{success}</pre>
        </div>
        
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 mx-auto px-6 py-3 !bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 !text-white !font-medium !rounded-xl !shadow-lg hover:!shadow-xl !transition-all !duration-300 text-base transform hover:-translate-y-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Make Another Transaction

        </button>
        <p className='text-xs text-gray-100'>If withdraw fails, your tokens will be refunded</p>
        <p className="text-sm text-gray-100 mt-4">
          You can track the status of your transaction in your account <a href="/all-notifications" className="text-blue-300 hover:underline">notification center</a> 
        </p>
      </div>
    </div>
  );
};

export default SuccessMessage;