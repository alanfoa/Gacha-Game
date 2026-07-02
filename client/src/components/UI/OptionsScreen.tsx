import { useRef, useState } from 'react';
import { useScreenStore } from '../../store/screenStore';
import { useInputManager, type GameAction } from '../../hooks/useInputManager';
import { useSound } from '../../hooks/useSound';
import { useGameStore } from '../../store/gameStore';
import { getBgmVolume } from '../../audio/sounds';

const FOCUSABLES = ['back', 'bgmToggle', 'volDown', 'volUp', 'import', 'export', 'logout'] as const;

export function OptionsScreen() {
  const back = useScreenStore((s) => s.back);
  const logout = useGameStore((s) => s.logout);
  const importSave = useGameStore((s) => s.importSave);
  const { user } = useGameStore();
  const { play, startBGM, stopBGM, setBGMVolume } = useSound();
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [bgmOn, setBgmOn] = useState(true);
  const [volume, setVolume] = useState(getBgmVolume());
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [focusIdx, setFocusIdx] = useState(0);

  useInputManager((action: GameAction) => {
    switch (action) {
      case 'BACK':
        play('back'); back();
        return;
      case 'NAV_UP':
        play('nav'); setFocusIdx((i) => (i - 1 + FOCUSABLES.length) % FOCUSABLES.length);
        return;
      case 'NAV_DOWN':
        play('nav'); setFocusIdx((i) => (i + 1) % FOCUSABLES.length);
        return;
      case 'CONFIRM': {
        const key = FOCUSABLES[focusIdx];
        if (key === 'back') { play('back'); back(); }
        else if (key === 'bgmToggle') toggleBGM();
        else if (key === 'volDown') changeVolume(-0.05);
        else if (key === 'volUp') changeVolume(0.05);
        else if (key === 'import') handleImport();
        else if (key === 'export') handleExport();
        else if (key === 'logout') logout();
        return;
      }
    }
  });

  const toggleBGM = () => {
    if (bgmOn) {
      stopBGM();
    } else {
      startBGM(volume);
    }
    setBgmOn(!bgmOn);
  };

  const changeVolume = (delta: number) => {
    const newVol = Math.max(0, Math.min(1, +(volume + delta).toFixed(2)));
    setVolume(newVol);
    setBGMVolume(newVol);
  };

  const handleImport = () => {
    fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importSave(reader.result as string);
      setImportMsg(ok ? '✅ Partida importada. Reconectando...' : '❌ Archivo inválido');
      setTimeout(() => setImportMsg(null), 3000);
      if (ok) setTimeout(() => window.location.reload(), 500);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    const data = {
      token: useGameStore.getState().token,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gacha-persona-save-${user?.name ?? 'unknown'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      ref={containerRef}
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f1a',
        gap: '1.5rem',
        position: 'relative',
        willChange: 'transform',
      }}
    >
      <button
        data-focus-key="back"
        onClick={() => { play('back'); back(); }}
        style={{
          position: 'absolute', top: '1.5rem', left: '1.5rem',
          background: 'transparent',
          border: '1px solid #4b5563',
          color: '#d1d5db',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          outline: FOCUSABLES[focusIdx] === 'back' ? '2px solid #3b82f6' : undefined,
          outlineOffset: '2px',
        }}
      >
        ← VOLVER
      </button>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: '1rem' }}>OPCIONES</h1>

      <style>{`
        .opt-btn {
          transition: outline-color 0.15s, background 0.15s;
        }
        .opt-btn:focus { outline: none; }
      `}</style>

      {/* Audio section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1.5rem',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.08)',
        minWidth: '300px',
      }}>
        <p style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.2em', margin: 0 }}>AUDIO</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#d1d5db', fontSize: '0.875rem' }}>Música</span>
          <button
            data-focus-key="bgmToggle"
            onClick={toggleBGM}
            style={{
              padding: '0.4rem 1rem',
              background: bgmOn ? 'rgba(96,165,250,0.15)' : 'transparent',
              border: `1px solid ${bgmOn ? '#60a5fa' : '#6b7280'}`,
              color: bgmOn ? '#60a5fa' : '#9ca3af',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.75rem',
              outline: FOCUSABLES[focusIdx] === 'bgmToggle' ? '2px solid #3b82f6' : undefined,
              outlineOffset: '2px',
            }}
          >
            {bgmOn ? 'ON' : 'OFF'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <span style={{ color: '#d1d5db', fontSize: '0.875rem' }}>Volumen</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              data-focus-key="volDown"
              onClick={() => changeVolume(-0.05)}
              style={{
                ...volBtnStyle,
                outline: FOCUSABLES[focusIdx] === 'volDown' ? '2px solid #3b82f6' : undefined,
                outlineOffset: '2px',
              }}
            >−</button>
            <div style={{
              width: '100px',
              height: '6px',
              background: '#1e1e3a',
              borderRadius: '3px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${volume * 100}%`,
                height: '100%',
                background: '#60a5fa',
                borderRadius: '3px',
                transition: 'width 0.15s',
              }} />
            </div>
            <button
              data-focus-key="volUp"
              onClick={() => changeVolume(0.05)}
              style={{
                ...volBtnStyle,
                outline: FOCUSABLES[focusIdx] === 'volUp' ? '2px solid #3b82f6' : undefined,
                outlineOffset: '2px',
              }}
            >+</button>
          </div>
        </div>
      </div>

      <button
        data-focus-key="import"
        onClick={handleImport}
        style={{
          ...btnStyle,
          outline: FOCUSABLES[focusIdx] === 'import' ? '2px solid #3b82f6' : undefined,
          outlineOffset: '2px',
        }}
      >
        📤 IMPORTAR PARTIDA
      </button>
      <input ref={fileRef} type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />
      {importMsg && <p style={{ color: importMsg.startsWith('✅') ? '#4ade80' : '#ef4444', fontSize: '0.875rem', fontWeight: 600 }}>{importMsg}</p>}

      <button
        data-focus-key="export"
        onClick={handleExport}
        style={{
          ...btnStyle,
          outline: FOCUSABLES[focusIdx] === 'export' ? '2px solid #3b82f6' : undefined,
          outlineOffset: '2px',
        }}
      >
        📥 EXPORTAR PARTIDA
      </button>

      <button
        data-focus-key="logout"
        onClick={logout}
        style={{
          ...btnStyle,
          borderColor: '#ef4444',
          color: '#ef4444',
          outline: FOCUSABLES[focusIdx] === 'logout' ? '2px solid #ef4444' : undefined,
          outlineOffset: '2px',
        }}
      >
        🚪 CERRAR SESIÓN
      </button>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '0.75rem 2rem',
  background: 'transparent',
  border: '1px solid #60a5fa',
  color: '#60a5fa',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '1rem',
  minWidth: '250px',
  textAlign: 'center',
  transform: 'skewX(-10deg)',
};

const volBtnStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  background: 'transparent',
  border: '1px solid #4b5563',
  color: '#d1d5db',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
