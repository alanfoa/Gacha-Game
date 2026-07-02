# GACHA PERSONA — Contexto Técnico Completo

## Stack
- **Frontend:** React 19, TypeScript 6, Vite 8, Zustand 5, GSAP 3, Three.js + React Three Fiber, Howler 2
- **Backend:** Express 5, SQLite (node:sqlite nativo), tsx (runtime)
- **Audio:** Howler (SFX/BGM cargados) + Web Audio API (menús procedurales)

## Estructura
```
client/ → Vite + React
  src/
    App.tsx (router pantallas)
    store/ (gameStore.ts + screenStore.ts — Zustand)
    hooks/ (useInputManager, useSound, usePreloader)
    audio/ (sounds.ts — BGM + SFX + sintetizador)
    components/
      Menu/ (menú principal, 4 opciones)
      Sobre/ (apertura gacha con escena 3D)
      Battle/ (batalla por turnos)
      Album/ (colección de cartas)
      UI/ (CardModal, PlaceholderCard, OptionsScreen, Spinner)
server/ → Express + SQLite
  src/
    index.ts (puerto 3001, rutas /api)
    data/cards.ts (26 cartas)
    db/schema.ts (tablas users, inventory)
    logic/ (battle.ts, probabilities.ts)
    routes/ (gacha.ts, battle.ts)
```

## Cartas (26 total)

### COMUN (10)
Tanjiro (Fuego), Nezuko (Fuego), Zenitsu (Viento), Inosuke (Tierra), Eren (Tierra), Mikasa (Viento), Naruto (Luz), Sasuke (Sombra), Luffy (Luz), Zoro (Viento)

### RARO (8)
Gojo (Luz), Rudeus (Agua), Jotaro (Luz), Dio (Sombra), Itadori (Fuego), Eren Titán (Tierra), Gon (Fuego), Killua (Viento)

### ÉPICO (5)
Joseph Joestar (Luz), Orsted (Agua), Sukuna (Sombra), Madara (Sombra), Kaido (Fuego)

### LEGENDARIO (3)
Giorno Giovanna (Luz), Rudeus Dios (Agua), Gojo Despertado (Luz)

Sistema de elementos: Fuego > Viento > Tierra > Agua > Fuego, Luz < > Sombra (1.5x fuerte, 0.5x débil).

## Sistema de Habilidades
Cada carta genera skills según rareza:
- **COMUN:** Ataque (ATK, power 80)
- **RARO:** Ataque + Magia (MAG, power 75)
- **ÉPICO:** Ataque + Magia + {Elemento} Strike (SKILL, power 120)
- **LEGENDARIO:** Ataque + Magia + {Elemento} Strike + Ultimate (SKILL, power 180)

Fórmula daño: `max(1, (atk * power / 100) - (def * 0.3)) * elementMult * critMult`
- Crítico: `random < luck` (1% por punto de suerte), multiplicador 1.5x
- Defender: reduce daño (def multiplicada x0.5)

## Batalla
- Turno por turno, seleccionás acción por cada carta viva (ATACAR/MAGIA/HABILIDAD/DEFENDER)
- Después seleccionás target enemigo
- Se envían todas las acciones al server → resuelve orden y devuelve log
- IA enemiga: 60% ATK, 30% SKILL, 10% DEFEND
- Recompensa: 30-200 monedas según rareza máxima del equipo, -10 si perdés
- Pity: 50 pulls sin legendario → forzado

## Música y Sonido
- **BGM:** `/audio/bgm.ogg` (loop), volumen default 0.25, control desde Options
- **SFX:** hit.wav, magicCast.ogg, magicHit.ogg, skill.wav, critical.wav, defend.ogg, victory.ogg, defeat.ogg
- **Menú:** generados proceduralmente con AudioContext (ondas cuadradas/sierra/triangulares)
- La carta se sacude con GSAP al recibir daño, critical hace screen shake + flash dorado

## Controles
- Flechas/WASD/Gamepad para navegar, Enter/Space confirmar, Escape volver
- 100ms debounce entre acciones, soporta auto-repeat al mantener tecla
- Álbum navegable con flechas, selección azul, scrollIntoView automático
- Modal de carta: 3D tilt siguiendo el mouse, rotación con flechas ← →

## Persistencia
- Token guardado en IndexedDB (idb-keyval)
- Perfil en SQLite (server/data.db): usuarios, inventario, contadores
- Export/Import save como JSON desde Options

## APIs
- `POST /api/register` → crear usuario
- `GET /api/profile` → perfil + inventario
- `POST /api/open` → abrir sobre (100 monedas)
- `GET /api/cards` → todas las definiciones
- `POST /api/battle/start` → iniciar batalla
- `POST /api/battle/action` → enviar acciones del turno
