import React, { useState } from 'react';
import { PlayCircle, X } from 'lucide-react';

const YouTubeEmbedButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Extract video ID from YouTube URL
  const youtubeUrl = 'https://youtu.be/yKnwEMwoFXE';
  const videoId = youtubeUrl.split('/').pop();
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      {/* Watch Demo Button */}
      <button 
        onClick={openModal}
        className="group flex items-center gap-3 !px-4 !py-2 sm:!px-8 sm:!py-4 text-gray-700 hover:text-gray-900 font-medium !rounded-2xl !border !border-gray-200 hover:!border-gray-300 hover:!bg-white/50 transition-all duration-300"
      >
        <PlayCircle className="w-5 h-5" />
        <span className="text-xs sm:text-sm">Watch Demo</span>
      </button>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl mx-4">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors duration-200"
            >
              <X className="w-8 h-8" />
            </button>
            
            {/* Video Container */}
            <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl">
              <div className="aspect-video">
                <iframe
                  src={embedUrl}
                  title="Demo Video"
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default YouTubeEmbedButton;