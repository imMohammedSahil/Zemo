const React = require("react");
const { useEffect, useRef, useState } = React;

/**
 * useScrollAmbientAudio
 *
 * @param {Object} options
 * @param {string} options.audioSrc - URL or path of sound file
 * @param {number} [options.maxVolume=0.1] - Peak volume level (0.0 to 1.0)
 * @param {number} [options.fadeDistance=800] - Scroll distance in px over which volume fades to 0
 * @param {boolean} [options.loop=true] - Whether to loop playback
 * @returns {{ isPlaying: boolean, toggleAudio: Function, volume: number }}
 */
function useScrollAmbientAudio({
  audioSrc,
  maxVolume = 0.1,
  fadeDistance = 800,
  loop = true
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!audioSrc) return;

    const audio = new Audio(audioSrc);
    audio.loop = loop;
    audio.volume = 0;
    audioRef.current = audio;

    const updateVolume = () => {
      if (!audioRef.current || isMuted) return;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const progress = Math.min(1, Math.max(0, scrollY / fadeDistance));
      const targetVol = Math.max(0, +(maxVolume * (1 - progress)).toFixed(3));

      audioRef.current.volume = targetVol;
      if (targetVol === 0 && !audioRef.current.paused) {
        audioRef.current.pause();
      } else if (targetVol > 0 && audioRef.current.paused && isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    };

    const handleFirstGesture = () => {
      if (!audioRef.current || isPlaying || isMuted) return;
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          updateVolume();
        })
        .catch(() => {});
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
    };

    const handleVisibility = () => {
      if (!audioRef.current) return;
      if (document.hidden) {
        audioRef.current.pause();
      } else if (isPlaying && !isMuted) {
        updateVolume();
      }
    };

    window.addEventListener("pointerdown", handleFirstGesture, { passive: true });
    window.addEventListener("keydown", handleFirstGesture, { passive: true });
    window.addEventListener("scroll", updateVolume, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
      window.removeEventListener("scroll", updateVolume);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioSrc, maxVolume, fadeDistance, loop, isPlaying, isMuted]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsMuted(true);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsMuted(false);
        })
        .catch(() => {});
    }
  };

  return { isPlaying, toggleAudio };
}

module.exports = { useScrollAmbientAudio };
