import React, { useEffect, useState } from 'react';
import { ImSpinner8 } from 'react-icons/im';

const loadingMessages = [
  "Converting your voice to text...",
  "Processing audio...",
  "Analyzing speech patterns...",
  "Almost there...",
  "Finalizing transcription...",
];

interface TranscriptionLoadingProps {
  isVisible: boolean;
}

export const TranscriptionLoading: React.FC<TranscriptionLoadingProps> = ({ isVisible }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center space-y-4 max-w-md mx-4">
        <ImSpinner8 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-lg text-center text-gray-700 animate-fade-in">
          {loadingMessages[messageIndex]}
        </p>
      </div>
    </div>
  );
};

// Add this to your global CSS or as a styled component
const styles = `
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-in-out;
}
`; 