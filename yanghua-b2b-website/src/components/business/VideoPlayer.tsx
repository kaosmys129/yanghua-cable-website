'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';

interface VideoSource {
  src: string;
  type: string;
}

interface VideoPlayerProps {
  videoSources: Record<string, VideoSource[]>;
  thumbnailUrl: string;
  title: string;
  className?: string;
}

export default function VideoPlayer({ videoSources, thumbnailUrl, title, className }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const t = useTranslations('VideoPlayer');
  const locale = useLocale();

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      setError(t('error.loading'));
    };

    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('error', handleError);

    // Set initial loading state
    if (videoElement.readyState < 3) {
      setIsLoading(true);
    }

    return () => {
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('error', handleError);
    };
  }, [t]);

  const currentVideoSources = videoSources[locale] || [];

  return (
    <div className={`relative w-full h-auto overflow-hidden rounded-lg ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        controls={isPlaying}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
        preload="metadata"
      >
        {currentVideoSources.map((source) => (
          <source key={source.src} src={source.src} type={source.type} />
        ))}
        {t('error.browserNotSupported')}
      </video>
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 cursor-pointer"
          style={{ backgroundImage: `url(${thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          onClick={handlePlay}
        >
          <div className="p-4 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50">
            {/* Play icon is removed as it's causing 404, the whole area is clickable now */}
          </div>
          <h3 className="mt-4 text-white text-xl font-semibold">company introduction video</h3>
        </div>
      )}
      {isLoading && isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="loader" />
          <p className="text-white ml-2">{t('loading')}</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <p className="text-white text-center">{error}</p>
        </div>
      )}
      <style jsx>{`
        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}