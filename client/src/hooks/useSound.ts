import { useCallback, useRef } from 'react';
import { SFX, BGM, initAudio } from '../audio/sounds';

export function useSound() {
  const bgmRef = useRef(false);

  const play = useCallback((sound: keyof typeof SFX, ...args: Parameters<typeof SFX[keyof typeof SFX]>) => {
    initAudio();
    (SFX[sound] as (...args: any[]) => void)(...args);
  }, []);

  const startBGM = useCallback((volume = 0.04) => {
    if (bgmRef.current) return;
    bgmRef.current = true;
    BGM.start(volume);
  }, []);

  const stopBGM = useCallback(() => {
    bgmRef.current = false;
    BGM.stop();
  }, []);

  const setBGMVolume = useCallback((vol: number) => {
    BGM.setVolume(vol);
  }, []);

  return { play, startBGM, stopBGM, setBGMVolume };
}
