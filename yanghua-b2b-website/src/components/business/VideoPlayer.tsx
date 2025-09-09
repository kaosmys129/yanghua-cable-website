"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Play, Loader2, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: {
    en: string;
    es: string;
  };
  thumbnailUrl?: string;
  title?: string;
  className?: string;
}

export default function VideoPlayer({ 
  videoUrl, 
  thumbnailUrl = '/images/company-video-thumbnail.jpg',
  title,
  className = '' 
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const t = useTranslations();
  
  // Get current locale from URL or default to 'en'
  const currentLocale = typeof window !== 'undefined' 
    ? window.location.pathname.split('/')[1] || 'en'
    : 'en';
  
  const currentVideoUrl = videoUrl[currentLocale as keyof typeof videoUrl] || videoUrl.en;

  const handlePlayClick = () => {
    setIsLoading(true);
    setHasError(false);
    setIsPlaying(true);
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setHasError(true);
    setIsPlaying(false);
  };

  if (isPlaying && !hasError) {
    return (
      <div className={`relative w-full h-96 rounded-xl overflow-hidden ${className}`}>
        <video
          className="w-full h-full object-cover"
          controls
          autoPlay
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          poster={thumbnailUrl}
        >
          <source src={currentVideoUrl} type="video/mp4" />
          <source src={currentVideoUrl.replace('.mp4', '.webm')} type="video/webm" />
          {t('about.video.error')}
        </video>
        
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>{t('about.video.loading')}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-96 rounded-xl overflow-hidden cursor-pointer group ${className}`}>
      {/* Video Thumbnail */}
      <div 
        className="w-full h-full bg-cover bg-center bg-gray-200 border-2 border-dashed border-gray-300 group-hover:border-gray-400 transition-all duration-300"
        style={{
          backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : 'none'
        }}
        onClick={handlePlayClick}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          {hasError ? (
            <div className="text-center text-white">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 text-red-400" />
              <p className="text-sm">{t('about.video.error')}</p>
            </div>
          ) : (
            <div className="text-center text-white">
              {/* Play Button */}
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-6 mb-4 group-hover:bg-opacity-30 transition-all duration-300 transform group-hover:scale-110">
                <Play className="h-12 w-12 text-white fill-current" />
              </div>
              
              {/* Title and CTA */}
              <h3 className="text-xl font-semibold mb-2">
                {title || t('about.video.companyIntro')}
              </h3>
              <p className="text-sm opacity-90">
                {t('about.video.watchVideo')}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Play Button Text */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
          <span className="text-white font-medium">{t('about.video.playButton')}</span>
        </div>
      </div>
    </div>
  );
}