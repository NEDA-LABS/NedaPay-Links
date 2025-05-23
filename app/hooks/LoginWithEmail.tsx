import React, { useState } from 'react';
import { useLoginWithEmail } from '@privy-io/react-auth';

interface LoginWithEmailProps {
  onLoginSuccess?: () => void; // Optional callback for successful login
}

const LoginWithEmail: React.FC<LoginWithEmailProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false); // Track if OTP has been sent
  const { sendCode, loginWithCode } = useLoginWithEmail();

  // Handle sending OTP
  const handleSendCode = async () => {
    try {
      await sendCode({ email });
      setOtpSent(true); // Show OTP input after successful send
      alert('OTP sent to your email!');
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('Failed to send OTP. Please try again.');
    }
  };

  // Handle login with OTP
  const handleLoginWithCode = async () => {
    try {
      await loginWithCode({ code });
      if (onLoginSuccess) {
        onLoginSuccess(); // Call the success callback if provided
      }
    } catch (error) {
      console.error('Error logging in with OTP:', error);
      alert('Invalid OTP or login failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full sm:w-auto">
      {!otpSent ? (
        <>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-xl p-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendCode}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 w-full"
          >
            Send OTP
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={code}
            onChange={(e) => setCode(e.currentTarget.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-xl p-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setOtpSent(false)} // Allow going back to email input
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 w-full"
            >
              Back
            </button>
            <button
              onClick={handleLoginWithCode}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 w-full"
            >
              Login
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LoginWithEmail;