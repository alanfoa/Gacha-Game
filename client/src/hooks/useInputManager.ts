import { useEffect, useRef, useCallback } from 'react';

export type GameAction =
  | 'NAV_UP'
  | 'NAV_DOWN'
  | 'NAV_LEFT'
  | 'NAV_RIGHT'
  | 'CONFIRM'
  | 'BACK'
  | 'SKIP';

type GamepadState = {
  axes: number[];
  buttons: boolean[];
};

const DEBOUNCE_MS = 100;
const AXIS_THRESHOLD = 0.5;
const GAMEPAD_INDEX = 0;

export function useInputManager(onAction: (action: GameAction) => void) {
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  const lastActionRef = useRef<Record<string, number>>({});
  const rafRef = useRef<number>(0);
  const prevStateRef = useRef<GamepadState | null>(null);

  const debounceAction = useCallback((action: GameAction) => {
    const now = Date.now();
    const last = lastActionRef.current[action] ?? 0;
    if (now - last < DEBOUNCE_MS) return;
    lastActionRef.current[action] = now;
    onActionRef.current(action);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          debounceAction('NAV_UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          debounceAction('NAV_DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          debounceAction('NAV_LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          debounceAction('NAV_RIGHT');
          break;
        case 'Enter':
        case ' ':
          debounceAction('CONFIRM');
          break;
        case 'Escape':
          debounceAction('BACK');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [debounceAction]);

  useEffect(() => {
    const pollGamepad = () => {
      const gamepads = navigator.getGamepads?.();
      const gp = gamepads?.[GAMEPAD_INDEX];
      if (!gp) {
        rafRef.current = requestAnimationFrame(pollGamepad);
        return;
      }

      const currentState: GamepadState = {
        axes: [...gp.axes],
        buttons: gp.buttons.map((b) => b.pressed),
      };

      const prevState = prevStateRef.current;

      if (prevState) {
        if (currentState.axes[1] < -AXIS_THRESHOLD && prevState.axes[1] >= -AXIS_THRESHOLD)
          debounceAction('NAV_UP');
        if (currentState.axes[1] > AXIS_THRESHOLD && prevState.axes[1] <= AXIS_THRESHOLD)
          debounceAction('NAV_DOWN');
        if (currentState.axes[0] < -AXIS_THRESHOLD && prevState.axes[0] >= -AXIS_THRESHOLD)
          debounceAction('NAV_LEFT');
        if (currentState.axes[0] > AXIS_THRESHOLD && prevState.axes[0] <= AXIS_THRESHOLD)
          debounceAction('NAV_RIGHT');

        if (currentState.buttons[0] && !prevState.buttons[0])
          debounceAction('CONFIRM');
        if (currentState.buttons[1] && !prevState.buttons[1])
          debounceAction('BACK');

        // D-pad: 12=UP, 13=DOWN, 14=LEFT, 15=RIGHT
        if (currentState.buttons[12] && !prevState.buttons[12])
          debounceAction('NAV_UP');
        if (currentState.buttons[13] && !prevState.buttons[13])
          debounceAction('NAV_DOWN');
        if (currentState.buttons[14] && !prevState.buttons[14])
          debounceAction('NAV_LEFT');
        if (currentState.buttons[15] && !prevState.buttons[15])
          debounceAction('NAV_RIGHT');
      }

      prevStateRef.current = currentState;
      rafRef.current = requestAnimationFrame(pollGamepad);
    };

    rafRef.current = requestAnimationFrame(pollGamepad);
    return () => cancelAnimationFrame(rafRef.current);
  }, [debounceAction]);
}
