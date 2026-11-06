import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, FastForward } from 'lucide-react';
import { formatAudioDuration } from '../utils/audioNotes';

interface VoiceNotePlayerProps {
  audioUrl: string;
  duration?: number;
  senderName?: string;
  variant?: 'outgoing' | 'incoming';
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  audioUrl,
  duration = 0,
  variant = 'incoming'
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(duration || 0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.warn('Audio play prevented:', err);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Number(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const cyclePlaybackRate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const rates = [1.0, 1.5, 2.0];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
  const isOutgoing = variant === 'outgoing';

  // Waveform bars simulation
  const waveHeights = [20, 45, 75, 30, 90, 60, 40, 85, 55, 35, 70, 40, 65, 80, 50, 30, 60, 90, 45, 35, 75, 50, 30];

  return (
    <div
      className={`rounded-2xl p-2.5 sm:p-3 max-w-xs sm:max-w-sm flex flex-col gap-1.5 shadow-2xs select-none transition-all ${
        isOutgoing
          ? 'bg-gradient-to-r from-violet-600 to-indigo-700 text-white'
          : 'bg-white border border-stone-200 text-stone-900 shadow-xs'
      }`}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center gap-2.5">
        {/* Play / Pause Circular Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs ${
            isOutgoing
              ? 'bg-white text-violet-700 hover:bg-violet-50'
              : 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700'
          }`}
          title={isPlaying ? 'Pausar nota de audio' : 'Reproducir nota de audio'}
          aria-label={isPlaying ? 'Pausar audio' : 'Reproducir audio'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Waveform Visualization & Slider */}
        <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
          <div className="relative h-6 flex items-center">
            {/* Waveform Bars */}
            <div className="w-full flex items-center justify-between gap-[2px] h-5 pointer-events-none px-0.5">
              {waveHeights.map((h, i) => {
                const barPercent = (i / waveHeights.length) * 100;
                const isPlayed = barPercent <= progressPercent;
                return (
                  <span
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      isPlayed
                        ? isOutgoing
                          ? 'bg-amber-300'
                          : 'bg-violet-600'
                        : isOutgoing
                        ? 'bg-white/35'
                        : 'bg-stone-300'
                    } ${isPlaying && isPlayed ? 'animate-pulse' : ''}`}
                  />
                );
              })}
            </div>

            {/* Hidden native range slider for scrubbing */}
            <input
              type="range"
              min="0"
              max={totalDuration || 1}
              step="0.05"
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-full z-10"
              title="Deslizar para avanzar o retroceder audio"
              aria-label="Posición de audio"
            />
          </div>

          {/* Time & Speed Controls */}
          <div className="flex items-center justify-between text-[10px] font-mono font-semibold">
            <span className={isOutgoing ? 'text-violet-100' : 'text-stone-500'}>
              {formatAudioDuration(currentTime)} / {formatAudioDuration(totalDuration)}
            </span>

            <div className="flex items-center gap-1.5">
              {isPlaying && (
                <span className="flex items-center gap-1 text-[9px] font-sans font-bold uppercase tracking-wider text-amber-300">
                  <Volume2 className="w-3 h-3 animate-pulse" />
                  <span>Audio</span>
                </span>
              )}

              {/* Speed Button (1x / 1.5x / 2x) */}
              <button
                type="button"
                onClick={cyclePlaybackRate}
                className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono transition-colors cursor-pointer ${
                  isOutgoing
                    ? 'bg-white/20 hover:bg-white/30 text-white'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
                title="Cambiar velocidad de reproducción (1x, 1.5x, 2x)"
              >
                {playbackRate}x
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
