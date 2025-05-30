import { useState } from "react";
import { useRouter } from "next/navigation";

interface AuthenticationModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

export default function AuthenticationModal({ 
  isOpen, 
  onClose, 
  address 
}: AuthenticationModalProps) {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="mx-auto bg-white dark:bg-slate-900 rounded-xl p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto" style={{ width: "80%", }}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 z-10"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-center pt-2"><br/>
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white p-2">
            Authenticated Successfully!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
            Welcome, {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
          
          <div className="flex flex-col gap-3 justify-center">
            <button
              onClick={() => {
                setIsClosing(true);
                setTimeout(() => {
                  router.push("/dashboard");
                }, 200);
              }}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Continue to Dashboard
            </button>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 text-sm font-medium"
            >
              Stay on Home Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}