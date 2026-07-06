# PLAN — PvE Dificultades + PvP Ranked

---

## Sprint 1: Dificultades PvE (Server)

- [ ] Crear `server/src/data/difficulties.ts` con dificultades: `{ id, name, statMult, rarityCap, rewardMult }`
- [ ] Endpoint `GET /api/battle/difficulties`
- [ ] Modificar `POST /api/battle/start` para aceptar `difficulty` (default `normal`)
- [ ] Modificar `generateEnemyTeam()` para filtrar pool por `rarityCap`
- [ ] Aplicar `statMult` a stats enemigas (HP, ataque, defensa, magia, speed)
- [ ] Mejorar IA enemiga por dificultad: Fácil (random), Difícil+ (target débil, skills situacionales, ultimate)

## Sprint 2: Dificultades PvE (Client)

- [ ] Selector de dificultad en `TeamSelectScreen.tsx` (4 botones)
- [ ] Mostrar multiplicador de recompensa en cada botón
- [ ] Pasar `difficulty` al `POST /api/battle/start`
- [ ] Mostrar dificultad + recompensa final en resultado de batalla

## Sprint 3: Matchmaking + Sesiones PvP (Server)

- [ ] Instalar `socket.io` en server
- [ ] Crear `server/src/logic/matchmaking.ts` con cola de jugadores
- [ ] Crear `server/src/routes/pvp.ts`: `POST /api/pvp/queue`, `POST /api/pvp/leave`
- [ ] WebSocket handler para turnos: `match_found`, `submit_actions`, `turn_result`, `disconnect`
- [ ] Reutilizar `processTurn()` existente para resolver PvP
- [ ] Timeout 60s por turno (pierde el que no responde)

## Sprint 4: Sistema de Ranking (Server)

- [ ] Tabla `ranked` en DB: `user_id, rating, wins, losses, streak, tier`
- [ ] ELO simplificado: `rating ± 25 * (winner_rating / loser_rating)`
- [ ] Tiers: Bronce / Plata / Oro / Platino / Diamante
- [ ] Actualizar rating al finalizar partida PvP
- [ ] Endpoint `GET /api/ranked/leaderboard` — top 100

## Sprint 5: UI PvP Ranked (Client)

- [ ] `RankedScreen.tsx` con rating, tier, W/L, botón "BUSCAR OPONENTE"
- [ ] WebSocket al entrar a cola
- [ ] "Partida encontrada vs {nombre}" con countdown
- [ ] Reutilizar `BattleScreen.tsx` para el combate (mostrar nombre rival)
- [ ] Resultado final + cambio de rating + animación de tier
- [ ] Acceso a Ranked desde el menú principal

## Sprint 6: Extras y pulido

- [ ] Mostrar equipo del rival antes de la partida PvP
- [ ] Animación de tier up (Bronce → Plata, etc.)
- [ ] Efecto de racha en PvP (win streak bonus rating)
- [ ] Sonido de emparejamiento encontrado
- [ ] Validar que las 3 cartas sean distintas en equipo PvP
- [ ] Validar que las 3 cartas estén vivas

## Sprint 7: Fix Misiones Diarias + Pack Gratis

- [x] Modificar `POST /api/missions/claim`: cuando `reward === 1` (open_packs), devolver `{ freePack }` 
- [x] Modificar `claimMission()` en `gameStore.ts`: devuelve `boolean` si `freePack === true`
- [x] Después de reclamar la misión, navegar automáticamente a `PackScreen` con `{ freePack: true }`
- [x] `PackScreen` detecta el param y auto-abre sobre básico gratis sin cobrar
- [x] Server `POST /api/open` acepta `free: true` para saltar chequeo de monedas

## Sprint 8 — MenuPrincipal (Pantalla de Título)

- [x] Agregar `'mainmenu'` y `'login'` al tipo `Screen` en `screenStore.ts`
- [x] Crear `components/Menu/MenuPrincipal.tsx` con:
  - Logo grande "GACHA PERSONA" con skewX
  - Botones: **NUEVA PARTIDA** · **CARGAR PARTIDA** · **OPCIONES**
  - Primer click → `BGM.start()` + navega a login/menu
  - Fondo con gradiente + radial glow + líneas geométricas
- [x] Modificar `App.tsx`:
  - `current` default pasa a ser `'mainmenu'`
  - Sacar `useEffect` de BGM automático
  - Login/Nombre pasa a ser `'login'` screen
- [x] **CARGAR PARTIDA**: si hay token en localStorage, navega directo al menú del juego; si no, botón deshabilitado
- [x] **NUEVA PARTIDA**: navega a `'login'` (input de nombre + register)
- [x] **OPCIONES**: navega a `'options'`; al volver → `'mainmenu'`
- [x] BGM arranca con el primer click (bypass de autoplay policy)
- [x] Crear `SaveSlotsScreen.tsx` con 10 ranuras en scroll + CRUD
- [x] NUEVA PARTIDA y CARGAR PARTIDA → `'saveSlots'` en vez de login directo
- [x] Crear `saveSlotsStore.ts` con persistencia local de 10 slots
- [x] Auto-detectar última ranura usada al iniciar la app
- [x] Ranura vacía → botón CREAR PARTIDA → login con slot param
- [x] Ranura ocupada → muestra nombre, 🪙, 🃏, ⏱, 📅 + botones CARGAR / BORRAR
- [x] `POST /api/profiles/batch` para refrescar datos de ranuras desde el server

## Sprint 9 — Fix: ESC en batalla abre modal de rendirse

- [x] En `BattleScreen.tsx:200`, cambiar `back()` por `setShowSurrenderConfirm(true)` — cuando el jugador aprieta ESC sin tener submenús abiertos, abre el modal "¿RENDIRSE?" en lugar de salir de la batalla
- [x] En el handler de `phase === 'result'` (line 173-178), agregar `BGM.switchToMenu()` antes de `navigate('menu')` — así la música vuelve al tema del menú incluso si se rinde por teclado (el BattleResult button ya lo hace, pero la tecla CONFIRM lo omitía)
- [x] Perder batalla ya no descuenta monedas — solo resetea win streak
- [x] Al rendirse, no se muestra "Perdiste 0 monedas" en el resultado

## Sprint 11 — Sistema de Logros Gigante (50 logros)

### DB
- [ ] Crear tabla `achievements` en `server/src/db/schema.ts` (user_id, achievement_id, progress, goal, completed, claimed, UNIQUE user + achievement)

### Data
- [ ] Crear `server/src/data/achievements.ts` con los 50 logros y sus condiciones

### Server Logic
- [ ] Crear `server/src/logic/achievements.ts` con `checkAchievements(userId, context)` evaluando condiciones post-batalla
- [ ] Hook en `battle.ts` → llamar `checkAchievements()` al terminar cada batalla

### Routes
- [ ] Crear `server/src/routes/achievements.ts`:
  - `GET /api/achievements` — lista del usuario con progreso
  - `POST /api/achievements/claim` — reclamar recompensa

### Client Store
- [ ] Agregar `achievements` al estado en `gameStore.ts`
- [ ] `fetchAchievements()` y `claimAchievement()` actions

### UI
- [ ] Crear `AchievementsScreen.tsx`:
  - Header con icono de logro (🏆 o SVG), barra de porcentaje de progreso total, contador "0/52"
  - 4 categorías colapsables (Fáciles/Medios/Difíciles/Complejos) con acordeón
  - Cada logro: título, descripción, barra de progreso individual, badge de recompensa, botón RECLAMAR si completado
  - Input navegable con teclado/gamepad
- [ ] Agregar `'achievements'` al tipo `Screen` y render en `App.tsx`
- [ ] Agregar "🏆 LOGROS" como 7ma opción en `MenuScreen.tsx`

### Logros — Fáciles (14)
- [ ] ach_easy_01: El Club de los Segundones — Ganar con 3 COMUNES — 100 monedas
- [ ] ach_easy_02: Linaje Hoshino — 2 Hoshino en equipo — 150
- [ ] ach_easy_03: ¡No me dejes solo! — Ganar con Zenitsu solo vivo — 150
- [ ] ach_easy_04: El Poder de la Amistad — Magia de soporte (Sakura/Lucy/Yukari) — 100
- [ ] ach_easy_05: Inspector de Tácticas — 5 usos "Análisis de Guion" e22 — 120
- [ ] ach_easy_06: La Llama del Dragón — Ganar con Natsu solo ataques FUEGO — 100
- [ ] ach_easy_07: El Más Rápido del Oeste — Ganar con Killua sin que enemigo ataque primero — 120
- [ ] ach_easy_08: Aprendiz de Héroe — 3 batallas con Deku — 100
- [ ] ach_easy_09: Coleccionista Novato — 20 cartas desbloqueadas — 150
- [ ] ach_easy_10: Fortuna Inicial — 1000 monedas acumuladas — 100
- [ ] ach_easy_11: Estilo de Agua Básica — Ganar con Murata sobreviviendo — 100
- [ ] ach_easy_12: Estrella en Ascenso — Ganar con Kana o Mem-cho — 100
- [ ] ach_easy_13: El Maletín de Leorio — Golpe final de Leorio — 120
- [ ] ach_easy_14: Primer Legendario — Obtener 1er legendario — 150

### Logros — Medios (16)
- [ ] ach_med_01: ¿Cuánto es 1000 menos 7? — Kaneki <10% HP — 300
- [ ] ach_med_02: Actuación de Método Perfecta — Strike e22 mata devolviendo golpe — 350
- [ ] ach_med_03: Rivales de la Aldea — Naruto + Sasuke sobreviven — 400
- [ ] ach_med_04: Ladrón de Corazones — 5 combates con Persona (Makoto/Yu/Ren) — 450
- [ ] ach_med_05: Justicieros de Escritorio — Light + L, solo magia/strike — 400
- [ ] ach_med_06: Cazadores de Demonios — Nezuko + Zenitsu + Inosuke — 350
- [ ] ach_med_07: El Rey de los Piratas — 3 batallas Luffy + Coby — 350
- [ ] ach_med_08: Cazadores de Titanes — Mikasa + Eren + Armin sobreviven — 400
- [ ] ach_med_09: El Dúo Dinámico — 5 batallas Gojo + Sukuna sin muertes — 450
- [ ] ach_med_10: Sinergia Elemental — 3 elementos distintos en equipo — 300
- [ ] ach_med_11: Estratega del Guion — 10 usos "Análisis de Guion" e22 — 350
- [ ] ach_med_12: Mímica Perfecta — Akane l22 usa 4 habilidades en 1 batalla — 400
- [ ] ach_med_13: El Despertar del Dragón — Kaneki mata con Ultimate — 350
- [ ] ach_med_14: Hielo y Fuego — Gray + Natsu juntos — 300
- [ ] ach_med_15: Poder de Persona — 3 magias elementales distintas en 1 batalla — 350
- [ ] ach_med_16: Sin Miedo al Éxito — 3 batallas sin DEFENDER — 400

### Logros — Difíciles (12)
- [ ] ach_hard_01: Predicción de la Estrella Oscura — Akane l22 mitiga ultimate enemigo — 600
- [ ] ach_hard_02: El Despertar de los Dioses — 3 LEGENDARIAS en equipo — 700
- [ ] ach_hard_03: La Humillación Definitiva — Murata o Mineta mata épico/legendario — 800
- [ ] ach_hard_04: Tríada Definitiva — 3 Ultimates distintas en un mismo turno — 750
- [ ] ach_hard_05: Estrategia de la Tierra Endurecida — Eren sobrevive 5 turnos seguidos — 600
- [ ] ach_hard_06: Sinergia de Luz y Sombra — Aqua + Ruby juntos — 650
- [ ] ach_hard_07: Dios del Nuevo Mundo — 10 batallas seguidas con Light — 750
- [ ] ach_hard_08: Resistencia de Titán — Eren recibe 500+ daño y sobrevive — 600
- [ ] ach_hard_09: Alma de Artista — Solo Oshi no Ko (Aqua + Ruby + Akane) — 650
- [ ] ach_hard_10: Dúo de la Muerte — Itadori + Sukuna sin ataque aliado — 700
- [ ] ach_hard_11: Imbatible — Batalla sin recibir críticos — 650
- [ ] ach_hard_12: Estrategia desde las Sombras — 3 personajes SOMBRA — 700

### Logros — Complejos (8)
- [ ] ach_god_01: El Retumbar del Servidor — 500+ daño en 1 turno con Ultimate de Eren l08 — 1200
- [ ] ach_god_02: Expansión de Dominio Absoluta — Ultimate Gojo l01 + Sukuna l02 misma batalla matan equipo — 1500
- [ ] ach_god_03: Otaku Supremo — 1 batalla con cada uno de los 77 personajes — 5000 + título
- [ ] ach_god_04: Maestro de la Velocidad — 10 turnos consecutivos actuando primero — 1500
- [ ] ach_god_05: Supremacía Elemental — Ventaja elemental en los 3 matchups — 2000
- [ ] ach_god_06: Coleccionista Absoluto — 77 cartas desbloqueadas — 3000
- [ ] ach_god_07: Estratega de la Oscuridad — 50 batallas 3 estrellas (sin muertes) — 2500
- [ ] ach_god_08: Dios del Gacha — 500 sobres abiertos — 2000
- [ ] ach_god_09: Sinergia Legendaria Absoluta — Ganá una batalla usando las 3 cartas legendarias del mismo anime (ej: Gojo l01 + Sukuna l02 + Itadori l10 de JJK; o Naruto l04 + Sasuke l06 + Sakura de Naruto) — 3500
- [ ] ach_god_10: Marcado por el Destino — Completá los 49 logros anteriores — 10000 + Título Legendario "El Elegido"

---

## Sprint 10 — Music Player Widget + Menú de Pausa

- [x] Agregar `MENU_TRACKS` exportable en `sounds.ts` con `{ src, name }[]` y métodos `BGM.nextTrack()`, `BGM.prevTrack()`, `BGM.getCurrentTrack()`, `BGM.playTrack(index)`, `BGM.togglePause()`
- [x] Crear `components/UI/MusicPlayer.tsx`:
  - Posición `fixed; bottom: 1rem; right: 1rem; z-index: 9999`
  - Mini reproductor compacto: nombre canción (marquee) + ⏮ ⏸/▶ ⏭
  - Dropdown al clickear nombre con la playlist completa para cambiar de tema
- [x] Widget visible en `MenuScreen`
- [ ] Widget visible en `MenuPrincipal` (cuando se cree en Sprint 8)
- [ ] Widget oculto durante batalla, pack opening, álbum, team select, missions
