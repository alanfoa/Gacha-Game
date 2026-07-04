import { useCallback, useRef } from 'react';
import { SFX, BGM, initAudio, DEFAULT_MENU_VOLUME } from '../audio/sounds';

export function useSound() {
  const bgmRef = useRef(false);

  const play = useCallback((sound: keyof typeof SFX, ...args: Parameters<typeof SFX[keyof typeof SFX]>) => {
    initAudio();
    (SFX[sound] as (...args: any[]) => void)(...args);
  }, []);

  const startBGM = useCallback((volume = DEFAULT_MENU_VOLUME) => {
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
    BGM.start(volume);
  }, []);

  const setBGMVolume = useCallback((vol: number) => {
    BGM.setVolume(vol);
  }, []);

  return { play, startBGM, startBattleBGM, stopBGM, pauseBGM, resumeBGM, restartMenuBGM, setBGMVolume };
}
