import { useCallback, useRef } from 'react';
import { SFX, BGM, initAudio } from '../audio/sounds';

export function useSound() {
  const bgmRef = useRef(false);

  const ensureBGM = useCallback(() => {
    if (bgmRef.current && !BGM.isPlaying()) {
      BGM.start();
    }
  }, []);

  const play = useCallback((sound: keyof typeof SFX, ...args: Parameters<typeof SFX[keyof typeof SFX]>) => {
    initAudio();
    ensureBGM();
    (SFX[sound] as (...args: any[]) => void)(...args);
  }, [ensureBGM]);

  const startBGM = useCallback((volume = 0.04) => {
    if (bgmRef.current) return;
    bgmRef.current = true;
    BGM.start(volume);
  }, []);

  const startBattleBGM = useCallback((volume = 0.25) => {
    bgmRef.current = true;
    BGM.startBattle(volume);
  }, []);

  const stopBGM = useCallback(() => {
    bgmRef.current = false;
    BGM.stop();
  }, []);

  const pauseBGM = useCallback(() => {
    BGM.pause();
  }, []);

  const resumeBGM = useCallback(() => {
    BGM.resume();
  }, []);

  const restartMenuBGM = useCallback((volume = 0.25) => {
    BGM.switchToMenu(volume);
  }, []);

  const setBGMVolume = useCallback((vol: number) => {
    BGM.setVolume(vol);
  }, []);

  return { play, startBGM, startBattleBGM, stopBGM, pauseBGM, resumeBGM, restartMenuBGM, setBGMVolume };
}
