import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BGM, MENU_TRACKS } from '../../audio/sounds';

const PLAYER_ACTIONS = ['prev', 'play', 'next', 'dropdown'] as const;

export function MusicPlayer() {
  const [visible, setVisible] = useState(false);
  const [trackName, setTrackName] = useState('Tema Principal');
  const [isPlaying, setIsPlaying] = useState(true);
  const [trackIndex, setTrackIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [playerFocused, setPlayerFocused] = useState(false);
  const [focusIdx, setFocusIdx] = useState(0);
  const [dropdownFocusIdx, setDropdownFocusIdx] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const focusedRef = useRef(false);
  const focusIdxRef = useRef(0);
  const showDropdownRef = useRef(false);
  const dropdownFocusIdxRef = useRef(0);

  useEffect(() => {
    const track = BGM.getCurrentTrack();
    if (track) {
      setTrackName(track.name);
    }
    setTrackIndex(BGM.getCurrentTrackIndex());
    setIsPlaying(BGM.isPlaying());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaying(BGM.isPlaying());
      const idx = BGM.getCurrentTrackIndex();
      setTrackIndex(idx);
      const track = BGM.getCurrentTrack();
      if (track) setTrackName(track.name);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    focusedRef.current = playerFocused;
  }, [playerFocused]);

  useEffect(() => {
    focusIdxRef.current = focusIdx;
  }, [focusIdx]);

  useEffect(() => {
    showDropdownRef.current = showDropdown;
  }, [showDropdown]);

  useEffect(() => {
    dropdownFocusIdxRef.current = dropdownFocusIdx;
  }, [dropdownFocusIdx]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const close = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showDropdown]);

  // Keyboard input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (visible) {
          setVisible(false);
          setPlayerFocused(false);
          setShowDropdown(false);
        } else {
          setVisible(true);
          setPlayerFocused(true);
          setFocusIdx(0);
          focusIdxRef.current = 0;
        }
        return;
      }

      if (!visible || !focusedRef.current) return;

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        e.stopImmediatePropagation();
        BGM.nextTrack();
        setShowDropdown(false);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        setVisible(false);
        setPlayerFocused(false);
        setShowDropdown(false);
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (showDropdownRef.current) {
          setShowDropdown(false);
          return;
        }
        const idx = (focusIdxRef.current - 1 + PLAYER_ACTIONS.length) % PLAYER_ACTIONS.length;
        setFocusIdx(idx);
        focusIdxRef.current = idx;
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (showDropdownRef.current) {
          setShowDropdown(false);
          return;
        }
        const idx = (focusIdxRef.current + 1) % PLAYER_ACTIONS.length;
        setFocusIdx(idx);
        focusIdxRef.current = idx;
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (showDropdownRef.current) {
          BGM.playTrack(dropdownFocusIdxRef.current);
          setShowDropdown(false);
          return;
        }
        const action = PLAYER_ACTIONS[focusIdxRef.current];
        switch (action) {
          case 'prev':
            BGM.prevTrack();
            setShowDropdown(false);
            break;
          case 'play':
            BGM.togglePause();
            break;
          case 'next':
            BGM.nextTrack();
            setShowDropdown(false);
            break;
          case 'dropdown':
            setShowDropdown(true);
            setDropdownFocusIdx(0);
            dropdownFocusIdxRef.current = 0;
            break;
        }
        return;
      }

      if (e.key === 'ArrowUp') {
        if (showDropdownRef.current) {
          e.preventDefault();
          e.stopImmediatePropagation();
          const idx = (dropdownFocusIdxRef.current - 1 + MENU_TRACKS.length) % MENU_TRACKS.length;
          setDropdownFocusIdx(idx);
          dropdownFocusIdxRef.current = idx;
          return;
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        if (showDropdownRef.current) {
          e.preventDefault();
          e.stopImmediatePropagation();
          const idx = (dropdownFocusIdxRef.current + 1) % MENU_TRACKS.length;
          setDropdownFocusIdx(idx);
          dropdownFocusIdxRef.current = idx;
          return;
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKey, { capture: true });
    return () => document.removeEventListener('keydown', handleKey, { capture: true });
  }, [visible, playerFocused]);

  // Gamepad input
  useEffect(() => {
    let raf: number;
    let prevButtons: boolean[] = [];
    const GAMEPAD_INDEX = 0;
    const BTN_START = 9;
    const BTN_A = 0;
    const DPAD_LEFT = 14;
    const DPAD_RIGHT = 15;
    const DPAD_UP = 12;
    const DPAD_DOWN = 13;

    const poll = () => {
      const gamepads = navigator.getGamepads?.();
      const gp = gamepads?.[GAMEPAD_INDEX];
      if (gp) {
        const currentButtons = gp.buttons.map((b) => b.pressed);
        const currentFocused = focusedRef.current;

        // Start button → toggle visibility
        if (currentButtons[BTN_START] && !prevButtons[BTN_START]) {
          if (currentFocused) {
            setVisible(false);
            setPlayerFocused(false);
            setShowDropdown(false);
          } else {
            setVisible(true);
            setPlayerFocused(true);
            setFocusIdx(0);
            focusIdxRef.current = 0;
          }
          prevButtons = currentButtons;
          raf = requestAnimationFrame(poll);
          return;
        }

        // BACK button (B) → next track (always, even when hidden)
        const BTN_BACK = 1;
        if (currentButtons[BTN_BACK] && !prevButtons[BTN_BACK]) {
          BGM.nextTrack();
          setShowDropdown(false);
          prevButtons = currentButtons;
          raf = requestAnimationFrame(poll);
          return;
        }

        if (currentFocused) {
          // D-pad LEFT
          if (currentButtons[DPAD_LEFT] && !prevButtons[DPAD_LEFT]) {
            if (showDropdownRef.current) {
              setShowDropdown(false);
            } else {
              const idx = (focusIdxRef.current - 1 + PLAYER_ACTIONS.length) % PLAYER_ACTIONS.length;
              setFocusIdx(idx);
              focusIdxRef.current = idx;
            }
            prevButtons = currentButtons;
            raf = requestAnimationFrame(poll);
            return;
          }

          // D-pad RIGHT
          if (currentButtons[DPAD_RIGHT] && !prevButtons[DPAD_RIGHT]) {
            if (showDropdownRef.current) {
              setShowDropdown(false);
            } else {
              const idx = (focusIdxRef.current + 1) % PLAYER_ACTIONS.length;
              setFocusIdx(idx);
              focusIdxRef.current = idx;
            }
            prevButtons = currentButtons;
            raf = requestAnimationFrame(poll);
            return;
          }

          // D-pad UP
          if (currentButtons[DPAD_UP] && !prevButtons[DPAD_UP]) {
            if (showDropdownRef.current) {
              const idx = (dropdownFocusIdxRef.current - 1 + MENU_TRACKS.length) % MENU_TRACKS.length;
              setDropdownFocusIdx(idx);
              dropdownFocusIdxRef.current = idx;
            }
            prevButtons = currentButtons;
            raf = requestAnimationFrame(poll);
            return;
          }

          // D-pad DOWN
          if (currentButtons[DPAD_DOWN] && !prevButtons[DPAD_DOWN]) {
            if (showDropdownRef.current) {
              const idx = (dropdownFocusIdxRef.current + 1) % MENU_TRACKS.length;
              setDropdownFocusIdx(idx);
              dropdownFocusIdxRef.current = idx;
            }
            prevButtons = currentButtons;
            raf = requestAnimationFrame(poll);
            return;
          }

          // A button → activate
          if (currentButtons[BTN_A] && !prevButtons[BTN_A]) {
            if (showDropdownRef.current) {
              BGM.playTrack(dropdownFocusIdxRef.current);
              setShowDropdown(false);
            } else {
              const action = PLAYER_ACTIONS[focusIdxRef.current];
              switch (action) {
                case 'prev':
                  BGM.prevTrack();
                  setShowDropdown(false);
                  break;
                case 'play':
                  BGM.togglePause();
                  break;
                case 'next':
                  BGM.nextTrack();
                  setShowDropdown(false);
                  break;
                case 'dropdown':
                  setShowDropdown(true);
                  setDropdownFocusIdx(0);
                  dropdownFocusIdxRef.current = 0;
                  break;
              }
            }
            prevButtons = currentButtons;
            raf = requestAnimationFrame(poll);
            return;
          }
        }

        prevButtons = currentButtons;
      }
      raf = requestAnimationFrame(poll);
    };

    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, []);

  const btnBase: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: 0,
    lineHeight: 1,
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '3px',
    transition: 'color 0.15s, background 0.15s',
  };

  function getBtnStyle(idx: number): React.CSSProperties {
    const isFocused = playerFocused && focusIdx === idx;
    return {
      ...btnBase,
      color: isFocused ? '#60a5fa' : idx === 1 ? '#d1d5db' : '#9ca3af',
      background: isFocused ? 'rgba(96,165,250,0.12)' : 'none',
    };
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(1rem + 10vh)',
      right: '1rem',
      zIndex: 9999,
    }}>
      <AnimatePresence>
        {visible && (
      <motion.div
        initial={{ opacity:0, y:16, scale:0.95 }}
        animate={{ opacity:1, y:0, scale:1 }}
        exit={{ opacity:0, y:16, scale:0.95 }}
        transition={{ type:'spring', stiffness:350, damping:28 }}
      >
      {/* Main bar */}
      <div style={{
        width: '210px',
        height: '34px',
        background: 'rgba(10,10,20,0.8)',
        backdropFilter: 'blur(6px)',
        border: `1px solid ${playerFocused ? 'rgba(96,165,250,0.5)' : 'rgba(96,165,250,0.15)'}`,
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: '4px',
        boxSizing: 'border-box',
        transform: 'skewX(-4deg)',
        boxShadow: playerFocused ? '0 0 8px rgba(96,165,250,0.2)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}>
        <button
          onClick={() => { BGM.prevTrack(); setShowDropdown(false); }}
          style={getBtnStyle(0)}
          title="Anterior"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#60a5fa';
            if (!playerFocused) e.currentTarget.style.background = 'rgba(96,165,250,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9ca3af';
            if (!playerFocused) e.currentTarget.style.background = 'none';
          }}
        >
          ◀
        </button>

        <button
          onClick={() => { BGM.togglePause(); setIsPlaying(!isPlaying); }}
          style={{ ...getBtnStyle(1), fontSize: '0.8rem' }}
          title={isPlaying ? 'Pausar' : 'Reanudar'}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#60a5fa';
            if (!playerFocused) e.currentTarget.style.background = 'rgba(96,165,250,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#d1d5db';
            if (!playerFocused) e.currentTarget.style.background = 'none';
          }}
        >
          {isPlaying ? '■' : '▶'}
        </button>

        <button
          onClick={() => { BGM.nextTrack(); setShowDropdown(false); }}
          style={getBtnStyle(2)}
          title="Siguiente"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#60a5fa';
            if (!playerFocused) e.currentTarget.style.background = 'rgba(96,165,250,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9ca3af';
            if (!playerFocused) e.currentTarget.style.background = 'none';
          }}
        >
          ▶
        </button>

        <span
          onClick={() => {
            setShowDropdown(!showDropdown);
            setPlayerFocused(true);
            setDropdownFocusIdx(0);
            dropdownFocusIdxRef.current = 0;
          }}
          style={{
            cursor: 'pointer',
            color: '#60a5fa',
            fontWeight: focusIdx === 3 && playerFocused ? 800 : 600,
            fontSize: '0.7rem',
            letterSpacing: '0.05em',
            width: '124px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            padding: '0 4px',
            textTransform: 'uppercase',
            lineHeight: '28px',
            userSelect: 'none',
            transition: 'font-weight 0.15s',
          }}
          title={trackName}
        >
          {trackName}
        </span>

        <span style={{
          color: '#6b7280',
          fontSize: '0.7rem',
          width: '20px',
          textAlign: 'center',
          lineHeight: '28px',
          cursor: 'pointer',
          userSelect: 'none',
        }}>
          ♪
        </span>
      </div>

      {/* Dropdown playlist */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: '4px',
            background: 'rgba(10,10,20,0.95)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(96,165,250,0.15)',
            borderRadius: '4px',
            padding: '2px',
            minWidth: '210px',
            transform: 'skewX(-4deg)',
            transformOrigin: 'bottom right',
          }}
        >
          {MENU_TRACKS.map((track, i) => (
            <div
              key={i}
              onClick={() => { BGM.playTrack(i); setShowDropdown(false); }}
              style={{
                padding: '5px 8px',
                borderRadius: '2px',
                cursor: 'pointer',
                color: trackIndex === i ? '#60a5fa' : '#9ca3af',
                fontWeight: trackIndex === i ? 700 : 400,
                fontSize: '0.7rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                background: playerFocused && dropdownFocusIdx === i
                  ? 'rgba(96,165,250,0.15)'
                  : trackIndex === i
                    ? 'rgba(96,165,250,0.08)'
                    : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (trackIndex !== i && !(playerFocused && dropdownFocusIdx === i)) {
                  e.currentTarget.style.background = 'rgba(96,165,250,0.04)';
                }
              }}
              onMouseLeave={(e) => {
                if (trackIndex !== i && !(playerFocused && dropdownFocusIdx === i)) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {track.name}
            </div>
          ))}
        </div>
      )}
      </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}