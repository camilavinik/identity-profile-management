import { Pause, Play, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function AudioPlayer({
  audioUrl,
  size = 'sm',
}: {
  audioUrl: string | null;
  size?: 'xs' | 'sm';
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [atStart, setAtStart] = useState(true);

  useEffect(() => {
    // If no audio URL, don't do anything
    if (!audioUrl) return;

    // Create a new audio element
    const audio = new Audio(audioUrl);
    audio.preload = 'none';

    // Event listeners
    const onEnded = () => setPlaying(false);
    const syncAtStart = () => setAtStart(audio.currentTime === 0);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', syncAtStart);
    audio.addEventListener('seeked', syncAtStart);

    // Set the audio ref
    audioRef.current = audio;

    // Cleanup event listeners and set audio ref to null on unmount
    return () => {
      audio.pause();
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', syncAtStart);
      audio.removeEventListener('seeked', syncAtStart);
      audioRef.current = null;
    };
  }, [audioUrl]);

  if (!audioUrl) return null;

  const restart = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
    }
  };

  const play = () => {
    const audio = audioRef.current;
    if (audio) {
      // If the audio has ended reset it
      if (audio.ended) {
        audio.currentTime = 0;
      }

      // Play the audio
      void audio.play();
      setPlaying(true);
    }
  };

  const pause = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setPlaying(false);
    }
  };

  const iconButton =
    'cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 hover:opacity-70 transition-opacity';

  return (
    <div
      className={`badge badge-neutral badge-soft ${size === 'xs' ? 'badge-sm gap-1.5' : 'gap-2'}`}
    >
      <button
        type="button"
        onClick={restart}
        disabled={atStart}
        className={iconButton}
        aria-label="Restart audio"
      >
        <Square
          className={`size-${size === 'xs' ? '2' : '3'} fill-current stroke-1`}
        />
      </button>
      <button
        type="button"
        onClick={play}
        disabled={playing}
        className={iconButton}
        aria-label="Play audio"
      >
        <Play
          className={`size-${size === 'xs' ? '2' : '3'} fill-current stroke-1`}
        />
      </button>
      <button
        type="button"
        onClick={pause}
        disabled={!playing}
        className={iconButton}
        aria-label="Pause audio"
      >
        <Pause
          className={`size-${size === 'xs' ? '2' : '3'} fill-current stroke-1`}
        />
      </button>
    </div>
  );
}
