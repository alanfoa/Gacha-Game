# 🃏 PROYECTO: GACHA PACK OPENING - PERSONA STYLE

Este archivo sirve de mapa de ruta para el desarrollo del juego utilizando OpenCode.
A medida que se completen los módulos, marcar con [x] para el tilde verde.

---

## 🛠️ FASE 1: Configuración del Entorno y Arquitectura Base

- [x] **1.1. Inicialización del proyecto con Stack Moderno**
  - Proyecto Vite + React + TypeScript creado.
  - Dependencias instaladas: GSAP, Zustand, Howler.js, idb-keyval, Tailwind CSS.
  - Estructura de carpetas: `/client`, `/server`.
  - Cliente con Tailwind CSS v4 + Vite plugin.

- [x] **1.2. Sistema de Inputs Globales Unificado (Teclado + Joystick)**
  - Hook `useInputManager` con eventos abstractos: NAV_UP/DOWN/LEFT/RIGHT, CONFIRM, BACK.
  - Teclado (flechas + WASD + Enter/Esc) y Gamepad API nativa.
  - Debounce de 200ms en D-Pad.
  - D-Pad mapeado correctamente (12=UP, 13=DOWN, 14=LEFT, 15=RIGHT).

---

## 🎨 FASE 2: Menú Principal "Estilo Persona"

- [x] **2.1. Maquetación Geométrica Inclinada con Tailwind**
  - Layout con polígonos abstractos, cortes angulares (`clip-path`, líneas inclinadas).
  - Botones con tipografía grande, desalineada y superpuesta.

- [x] **2.2. Animaciones de Navegación y Foco (GSAP)**
  - Al recibir foco, el botón se estira (scaleX 1.15), cambia color de borde, desplaza el texto.
  - Transiciones de entrada con GSAP timeline.

- [x] **2.3. Transición de Pantallas con clip-path Animado**
  - Navegación entre Menu → Pack → Album → Options.
  - Store de navegación con back() que siempre vuelve a menú.

---

## 📦 FASE 3: Lógica del Gacha y Estado Global (Probabilidades)

- [x] **3.1. Estado Global con Zustand + Persistencia en IndexedDB**
  - Store de autenticación, perfil, inventario, cartas globales.
  - Middleware `persist` con IndexedDB para el token.

- [x] **3.2. Base de Datos de Cartas (TypeScript)**
  - 26 cartas en `server/src/data/cards.ts` con tipos fuertes.
  - Atributos: id, nombre, anime, rareza, stats (ATK/DEF/MAG/LCK).

- [x] **3.3. Motor de Probabilidades con Pity System**
  - Rangos: Common 70%, Rare 20%, Epic 9%, Legendary 1%.
  - Pity System: legendario forzado a los 50 intentos.
  - Server-side (intocable desde el navegador).

---

## 🔥 FASE 4: La Cinemática del Pack Opening (El Clímax)

- [x] **4.1. Escenario del Sobre Interactivo**
  - Sobre flotando con animación de flotación GSAP (yoyo).
  - Click o Enter para abrir.
  - Animación de apertura: escala → encoge → desaparece.

- [x] **4.2. Animación de "Caminante" (Hype Pre-revelación)**
  - Luces y vibraciones al obtener carta Épica o Legendaria.
  - Screen shake con GSAP, flash overlay, badge animado (★ LEGENDARIO / ▲ ÉPICO).

- [x] **4.3. Skip button para cinemáticas repetidas**
  - Botón "SALTAR ▶▶" durante la apertura para saltear animación y ver carta al instante.

- [x] **4.4. Manejo de errores en apertura**
  - Si la API falla, se muestra error + botón REINTENTAR.
  - Transacción en DB para evitar inconsistencias.

---

## 🗂️ FASE 5: El Álbum / Colección y Persistencia

- [x] **5.1. Cuadrícula Asimétrica de Colección**
  - Grilla de cartas con placeholders.
  - Cartas bloqueadas en silueta oscura (opacity 0.2).

- [x] **5.2. Persistencia con SQLite (servidor)**
  - Base de datos SQLite con tabla users e inventory.
  - Persistencia robusta, no se pierde nada limpiando cache.

- [x] **5.3. Sistema de Canje por Duplicados**
  - Carta repetida → mensaje "DUPLICADO" + 25 monedas.

- [x] **5.4. Export / Import de Partida**
  - Botón en Opciones que descarga JSON con token.

- [x] **5.5. Estadísticas Globales**
  - Monedas, sobres abiertos, legendarios, pity counter.

---

## 🏁 FASE 6: Pulido de Rendimiento y Audio Loop

- [x] **6.1. Sistema de Audio con Web Audio API + Howler.js**
  - ~~BGM: pad ambiental procedural con LFO~~ → Reemplazado por "Color Your Night" (Persona 3 Reload) en loop con Howler.js.
  - SFX generados por código (nav, confirm, back, packOpen, cardReveal por rareza, duplicate).
  - Panel de opciones con toggle ON/OFF y barra de volumen.

- [x] **6.2. Optimización a 60 FPS**
  - `will-change: transform` en todos los contenedores con animaciones GSAP.
  - Lazy loading de imágenes del álbum pendiente hasta reemplazar placeholders.

---

## 🖼️ FASE 7: Reemplazo de Assets (Al Final)

- [x] **7.1. Imágenes de Personajes Reales**
- [x] **7.2. Sonidos Reales**
- [x] **7.3. Música de Fondo (BGM)**
  - "Color Your Night" (Persona 3 Reload) en loop con Howler.js desde `/audio/bgm.ogg`.

---

## 🧩 FASE 8 (Opcional): Features Extra

- [x] **8.1. Misiones Diarias**
- [ ] **8.2. Efecto de Sonido Dinámico** — SFX que cambian según contexto (ej: música más intensa en batalla, tono distinto en tienda vs menú, variación de pitch en apertura de sobre según rareza)

---

## ✨ FASE 9: Polaco y Features Faltantes

- [x] **9.1. Importar partida**
  - Botón en Opciones para seleccionar archivo JSON exportado y restaurar token/sesión.
  - `importSave()` en gameStore, hidden file input + FileReader.

- [x] **9.2. Detalle de carta**
  - Al clickear una carta del álbum, modal con stats ampliados (ATK/DEF/MAG/LCK), animación de entrada.
  - Componente `CardModal` con GSAP, cierra con Escape o click fuera.

- [x] **9.3. Transición glass shatter entre pantallas**
  - Cortina con clip-path animado con GSAP al navegar entre Menu/Pack/Album/Options.
  - Wipe de izquierda a derecha cubre pantalla vieja, nueva renderiza debajo, wipe continúa.

- [x] **9.4. Pantalla de carga con spinner animado**
  - Spinner tipo Persona (4 cuadrados inclinados con animación pulse).
  - Usado en lugar del texto "Cargando..." mientras se conecta.

---

## 🎮 FASE 10: 3D Pack Opening con React Three Fiber

- [x] **10.1. Setup de Render 3D**
  - Instalar `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`.
  - Crear `client/src/components/Sobre/PackScene3D.tsx` con Canvas de Three.js.
  - Cámara perspectiva, luces ambientales + direccionales, fondo oscuro.

- [x] **10.2. Texturizado de Cartas en 3D**
  - Renderizar el PlaceholderCard actual a un `<canvas>` off-screen → usarlo como `THREE.CanvasTexture`.
  - Cada carta es un `PlaneGeometry` con esa textura.
  - Rareza afecta el borde (emisivo, color de glow).

- [x] **10.3. Animación de Apertura del Sobre**
  - Modelo 3D del sobre (box + tapa triangular) con geometrías básicas + flap que rota.
  - Animación con GSAP: sobre flotando → tapa se abre → card emerge y gira hacia cámara.
  - Skip button interrumpe animación y va directo al resultado.

- [x] **10.4. Efectos Visuales por Rareza**
  - Partículas (Points) que estallan coloreadas por rareza.
  - Screen shake animando la posición de la cámara (solo Epic/Legendary).
  - Glow emisivo en la carta (más intenso en Legendary).

- [x] **10.5. HUD Superpuesto 2D sobre 3D**
  - Overlay HTML/CSS con z-index superior al Canvas para botones, monedas, hype badge.
  - Animación de la etiqueta de rareza (★LEGENDARIO) con GSAP.
  - Botón "ABRIR OTRO" resetea escena (remount via key).

### Fixes aplicados en FASE 10
- Eliminado `forwardRef`/`useImperativeHandle` → props directas (evita bug de refs cruzando Canvas boundary de R3F v9).
- `inset: 0` reemplazado por `top/left/right/bottom: 0` (compatibilidad).
- Props de Canvas extraídos a constantes fuera del componente.
- GSAP cleanup en todos los `useEffect` con return de kill().
- Timeline sincronizado sin setTimeout arbitrario: fase 'revealed' se dispara a los 650ms via GSAP onComplete.
- Particles + CameraShake añadidos con manejo de cleanup.
- Skip: `skip` como prop booleano que el scene lee en el useEffect → evita animación y salta a revealed.
- HypeRarity se limpia a los 800ms (coincide con duración de animación 3D).

---

## ⚔️ FASE 11: Batalla Turn-based 2D Estilo Persona

- [x] **11.1. Preparación de Datos de Combate**
  - Agregados `hp` y `element` a la interfaz Card y a todas las 26 cartas en `server/src/data/cards.ts`.
  - Sistema de elementos: FUEGO > VIENTO > TIERRA > AGUA > FUEGO, LUZ <-> SOMBRA.
  - Skills generados por rareza: COMUN → 1 skill (Ataque), RARO → 2 (Ataque + Magia), EPICO → 3 (+ Habilidad elemental), LEGENDARIO → 4 (+ Ultimate).
  - Habilidades generadas en runtime según elemento (no tabla SQLite separada).
  - API: `POST /api/battle/start` recibe 3 cardIds, genera enemigos según win_streak.
  - `POST /api/battle/action` recibe battleId + acciones, procesa turno, devuelve resultado.

- [x] **11.2. Sistema de Daño**
  - Fórmula: `daño = base = (atk * power / 100) - (def × 0.3)`, mínimo 1.
  - Multiplicador elemental: fuerte ×1.5, débil ×0.5, neutral ×1.
  - Critical según LCK: 1% por punto, daño ×1.5.
  - Todo el cálculo es server-side.
  - Columna `win_streak` y `total_battles` agregadas a tabla `users`.

- [x] **11.3. Pantalla de Selección de Equipo**
  - `TeamSelectScreen.tsx` con grilla de inventario (4 columnas).
  - Selección de hasta 3 cartas con toggle visual (borde amarillo ✓).
  - Navegación por teclado/gamepad (flechas + WASD + Enter).
  - Botón "INICIAR BATALLA" deshabilitado hasta tener 3 cartas seleccionadas.
  - Canvas compacto de carta usando `getCardCanvas`.

- [x] **11.4. BattleScreen (Escena de Combate 2D)**
  - Layout: enemigos arriba, jugadores abajo, log en el medio.
  - Mini tarjetas con barra de HP coloreada (verde > naranja > rojo).
  - Cartas inactivas se atenúan (opacity 0.35) al morir.
  - Log de acciones se muestra línea por línea con delay de 800ms.

- [x] **11.5. Sistema de Turnos y Menú de Acciones**
  - Por cada aliado vivo: menú horizontal ATACAR / MAGIA / DEFENDER / HABILIDAD.
  - Submenú de habilidad al seleccionar HABILIDAD (navegación vertical).
  - Target selection con flechas LEFT/RIGHT + Enter.
  - DEFENDER: reduce daño ×0.5 este turno, sin selección de target.
  - Todas las acciones se acumulan, luego se envían al servidor en un batch.

- [x] **11.6. IA Enemiga**
  - Enemigo elige target aleatorio entre aliados vivos.
  - 60% ataque básico, 30% habilidad especial (segunda skill), 10% defender.
  - Dificultad escala según win_streak del jugador (max rareza del pool enemigo).

- [x] **11.7. Fin de Batalla**
  - Victoria: pantalla amarilla "¡VICTORIA!" + coins ganados (30/60/100/200 según rareza máxima).
  - Derrota: pantalla roja "DERROTA" - 10 monedas.
  - Botón "VOLVER AL MENÚ" en ambos casos.
  - Coins se actualizan en servidor inmediatamente; perfil se refresca al finalizar.
  - Sin experiencia aún (futuro).

- [x] **11.8. Integración con Gacha**
  - [x] Batallas ganadas dan coins (para comprar sobres).
  - [x] Misiones diarias: "Ganá 3 batallas" → recompensa de sobre gratis.
  - [ ] Conexión con sistema de logros.

---

## 📦 FASE 12: Features Extra (Combate)

- [ ] **12.1. Drops Post-Batalla**
  - Al ganar, 10% de dropear una carta aleatoria (tira gacha gratis).

- [ ] **12.2. Dificultad Progresiva**
  - Enemigos se escalan según tu nivel/racha de victorias.
  - Boss cada 5 victorias con recompensa garantizada.

- [ ] **12.3. Animaciones de Habilidad**
  - Efectos visuales con GSAP + partículas CSS según elemento (fuego: partículas naranjas, agua: ondas azules).

---

## ⚔️ FASE 13: Motor de Combate Definitivo (Speed-Sorted + Status Effects)

- [ ] **13.1. Nuevas Estadísticas en Cartas**
  - Agregar campo `speed` a todas las 26 cartas en `server/src/data/cards.ts`
  - Agregar campo `mag` separado de `atk` a todas las cartas
  - Rebalancear HP, ATK, MAG, DEF, SPD, LUCK según blueprint
  - Renombrar IDs de cartas estilo `tanjiro_c`, `gojo_r`, `giorno_l`
  - Migrar o truncar DB existente para compatibilidad

- [ ] **13.2. Sistema de Status Effects (Server-side)**
  - Crear tipo `StatusEffect` (`BLEED | STUN | DEF_DOWN | SPD_DOWN | MAG_DOWN | FROZEN`)
  - Agregar array `statusEffects` a `BattleCard` con `remainingTurns` y `value`
  - Agregar flag `skipNextTurn: boolean` a `BattleCard`
  - Lógica de aplicar/expirar efectos al inicio de cada ronda
  - Lógica de daño por sangrado (15% ATK del atacante al inicio del turno del afectado)

- [ ] **13.3. Speed-Sorted Round Resolution**
  - Modificar `processTurn()`:
    1. Expirar status effects del turno anterior
    2. Procesar daño de sangrado (BLEED)
    3. Reset `isDefending` de todas las cartas
    4. Unir acciones player + enemy en pool común
    5. Ordenar por `speed` descendente
    6. Procesar acciones una por una en ese orden
    7. Si carta tiene `skipNextTurn == true`, skipear su acción y resetear flag
    8. Ejecutar DEFEND → activa `isDefending`
    9. Ejecutar ataques con fórmula de mitigación porcentual
  - Nueva fórmula: `base = (statOfensivo * power / 100) * (100 / (100 + defReceptor))`
  - Log devuelto en orden cronológico exacto de velocidad

- [ ] **13.4. Implementación de Skills Especiales**
  - **ÉPICOS**: Joseph (ignore 20% DEF), Orsted (-30% MAG 1 turno), Sukuna (sangrado 2 turnos), Madara (+15% crit), Kaido (20% stun)
  - **LEGENDARIOS**:
    - Giorno: Strike cura aliado 40% daño infligido, Ultimate reduce SPD a 0
    - Rudeus: Strike reduce DEF 40% 2 turnos, Ultimate congela (skipNextTurn)
    - Gojo: Strike reduce SPD 30% 2 turnos, Ultimate ignora 100% DEF
  - Modificar `generateSkills()` para incluir efectos en el objeto skill

- [ ] **13.5. Frontend: Target Selection Mejorado**
  - Permitir apuntar a aliados cuando la skill lo requiera (ej. Giorno Strike)
  - Skills de curación: color verde en target selector
  - Skills de daño: mantener rojo para enemigos

- [ ] **13.6. Frontend: Manejo de Turnos Skipeados**
  - Excluir automáticamente cartas con `skipNextTurn` de la selección
  - Mostrar "CONGELADO" o indicador visual en la carta

- [ ] **13.7. Frontend: Mostrar Velocidad (SPD)**
  - Agregar SPD a `MiniBattleCard` (indicador compacto)
  - Agregar SPD al `CardModal` en álbum
  - Agregar SPD al `TeamSelectScreen`

- [ ] **13.8. Frontend: Feedback Visual de Status Effects**
  - Iconos de estado (sangrado, stun, defensa baja, etc.) sobre cartas en batalla
  - Tooltip explicativo al hacer hover
  - Animación de aplicar efecto (flash del color correspondiente)

- [ ] **13.9. Migración de Saves**
  - Script de migración para IDs viejos → nuevos
  - Actualizar `importSave` para detectar versión de save

- [ ] **13.10. Balance Testing**
  - Test: 5 batallas equipo común vs común
  - Test: 5 batallas equipo legendario
  - Ajustar HP/power según duración (target: 3-5 rondas por batalla)

| Herramienta     | Para qué                                |
|-----------------|------------------------------------------|
| Vite            | Build tool rápido                        |
| React + TypeScript | UI con tipado fuerte                  |
| Tailwind CSS    | Estilos rápidos consistentes             |
| GSAP            | Animaciones de alto rendimiento          |
| Zustand         | Estado global liviano con persistencia   |
| Howler.js       | Audio profesional sin cortes             |
| Express + SQLite | Backend server-side (RNG, persistencia) |
| Three.js + R3F   | Render 3D para apertura de sobres        |
| Drei + Postprocessing | Helper 3D, Bloom, efectos de cámara   |

---

## 🚀 PLAN: Expansión Masiva de Gacha Persona

### FASE 1 — Bugs críticos

- [x] **1.1 Pantalla de resultado de batalla**
  - Mover `BattleResult` al centro como modal con overlay oscuro
  - Mostrar: VICTORIA/DERROTA, monedas, botón VOLVER AL MENÚ siempre visible
- [x] **1.2 Animación de sobres**
  - Corregido PackScene3D: flap con pivot correcto (base de triángulo como bisagra), timeline no vacío con 0.25s de duración, fase 'revealed' se dispara después de la animación del sobre
- [x] **1.3 Cards consistentes**
  - Ya implementado: unificación con `size` en vez de `compact`

### FASE 2 — Nuevo sistema de combate: Maná + Cooldowns

- [x] **2.1 Recurso de Maná**
  - Cada carta tiene `maxMana`: 50 comunes, 70 raros, 100 épicos, 130 legendarios
  - Empiezan con `mana = maxMana`
  - Regeneran 20% del maxMana por turno
- [x] **2.2 Costos por tipo de habilidad**

  | Tipo | Costo Maná | Cooldown |
  |---|---|---|
  | Ataque Físico | 0 | 0 |
  | Magia | 15-25 | 1-2 turnos |
  | Strike | 30-45 | 2-3 turnos |
  | Ultimate | 60-80 | 4-5 turnos |

- [x] **2.3 UI de batalla**
  - Barra de maná debajo de cada carta (similar a HP bar)
  - Menú de acciones muestra costo de maná + cooldown restante
  - Habilidades no disponibles se ven deshabilitadas (grises)

### FASE 3 — Catálogo completo con skills oficiales [x]

#### Estructura nueva de `Card`
```typescript
interface Card {
  id: string;
  name: string;
  anime: string;
  rarity: 'COMUN' | 'RARO' | 'EPICO' | 'LEGENDARIO';
  stats: { attack, defense, magic, luck, speed };
  hp: number;
  maxMana: number;
  element: Element;
  attackName: string;       attackCost: 0;       attackCooldown: 0;
  magicName?: string;       magicCost?: number;  magicCooldown?: number;
  skillName?: string;       skillCost?: number;  skillCooldown?: number;  // Strike
  ultimateName?: string;    ultimateCost?: number; ultimateCooldown?: number;
}
```

#### COMUNES (solo ataque)
| ID | Personaje | Anime | Ataque |
|---|---|---|---|
| c01 | Sakura | Naruto | Impacto de Cerezo |
| c02 | Iruka | Naruto | Lanzamiento de Shuriken |
| c03 | Coby | One Piece | Smasher de la Marina |
| c04 | Usopp | One Piece | Kayaku Hoshi |
| c05 | Genya | Demon Slayer | Disparo de Escopeta Nichirin |
| c06 | Murata | Demon Slayer | Estilo de Agua Básica |
| c07 | Armin | Attack on Titan | Tajo de Presión |
| c08 | Connie | Attack on Titan | Maniobra Rápida |
| c09 | Leorio | Hunter x Hunter | Golpe de Maletín |
| c10 | Kuwabara | Yu Yu Hakusho | Espada de Aura Astral |
| c11 | Matsuda | Death Note | Disparo de Retención |
| c12 | Pieck | Attack on Titan | Carga de Suministros |
| c13 | Mineta | MHA | Esferas Pegajosas Pop Off |
| c14 | Hide | Tokyo Ghoul | Aliento de Ánimo Físico |

#### RAROS (ataque + magia)
| ID | Personaje | Anime | Ataque | Magia |
|---|---|---|---|---|
| r01 | Nezuko | Demon Slayer | Garra Demoniaca | Exploding Blood |
| r02 | Zenitsu | Demon Slayer | Tajo del Relámpago | Destello del Relámpago |
| r03 | Inosuke | Demon Slayer | Colmillo Perforador | Cincel Loco |
| r04 | Mikasa | AOT | Tajo de Alta Velocidad | Lanza Relámpago |
| r05 | Gon | HxH | Puñetazo Fuerte | Jajanken: Papel |
| r06 | Yukari Takeba | Persona 3 | Flecha de Viento | Garu Estelar |
| r07 | Junpei Iori | Persona 3 | Tajo de Bate | Agi Ígneo |
| r08 | Yosuke Hanamura | Persona 4 | Doble Daga | Garula Elástico |
| r09 | Chie Satonaka | Persona 4 | Patada Alta | Bufu de Hielo |
| r10 | Ryuji Sakamoto | Persona 5 | Golpe de Tubo | Zio Eléctrico |
| r11 | Ann Takamaki | Persona 5 | Latigazo | Agilao de Fuego |
| r12 | Misa Amane | Death Note | Devoción de Shinigami | Ojos de Shinigami |
| r13 | Kana Arima | Oshi no Ko | Pataleta de Actriz | Brillo de Lamer Enchufes |
| r14 | Mem-cho | Oshi no Ko | Ataque de Streamer | Hype de Redes |
| r15 | Lucy Heartfilia | Fairy Tail | Patada de Lucy | Invocación de Aquario |
| r16 | Gray Fullbuster | Fairy Tail | Espada de Hielo | Ice-Make: Cañón |
| r17 | Uraraka | MHA | Golpe de Escombros | Gravedad Zero |
| r18 | Iida | MHA | Patada Recipro | Turbo Motor |
| r19 | Touka Kirishima | Tokyo Ghoul | Zarpazo de Kagune | Cristal de Ukaku |

#### ÉPICOS (ataque + magia + strike)
| ID | Personaje | Anime | Ataque | Magia | Strike |
|---|---|---|---|---|---|
| e01 | Tanjiro | Demon Slayer | Tajo de la Superficie | Vals de Fuego | Dragón del Cambio |
| e02 | Naruto (Base) | Naruto | Combo de Naruto | Rasengan | Odama Rasengan |
| e03 | Luffy (Base) | One Piece | Gomu Gomu no Pistol | Red Hawk | Elephant Gun |
| e04 | Eren Titán | AOT | Golpe de Titán | Endurecimiento | Rugido de Ataque |
| e05 | Joseph Joestar | JoJo's | Golpe con Hilos | Hamon Overdrive | Elástico de Hamon |
| e06 | Gojo (Base) | JJK | Golpe Directo | Azul (Ao) | Rojo (Aka) |
| e07 | Sukuna (Base) | JJK | Desmantelar | Flecha de Fuego | Partir |
| e08 | Rudeus Greyrat | Mushoku Tensei | Golpe de Bastón | Stone Cannon | Perturbación de Magia |
| e09 | Itadori | JJK | Puño Divergente | Destello Negro | Impacto de Alma |
| e10 | Killua | HxH | Garras de Asesino | Palma de Trueno | Godspeed |
| e11 | Sasuke (Base) | Naruto | Tajo Kusanagi | Chidori | Kirin |
| e12 | Makoto Yuki | Persona 3 | Corte de Espada | Agidyne | Cadenza de Orpheus |
| e13 | Yu Narukami | Persona 4 | Tajo de Katana | Ziodyne | Myriad Truths |
| e14 | Ren Amamiya | Persona 5 | Tiro de Pistola | Eigaon | Balas de Alta |
| e15 | Light Yagami | Death Note | Estratagema Genial | Sentencia del Cuaderno | Dios del Nuevo Mundo |
| e16 | L Lawliet | Death Note | Deducción Analítica | Trampa de Captura | Jaque Mate de Justicia |
| e17 | Aqua Hoshino | Oshi no Ko | Mirada Fría | Ojos de Estrella Oscura | Venganza Calculada |
| e18 | Ruby Hoshino | Oshi no Ko | Baile Escénico | Carisma de Idol | Renacimiento de Sarina |
| e19 | Natsu Dragneel | Fairy Tail | Puño de Dragón de Fuego | Rugido del Dragón | Loto Carmesí |
| e20 | Deku | MHA | Delaware Smash | Detroit Smash | OFA 20% |
| e21 | Ken Kaneki | Tokyo Ghoul | Azote de Rize | Ciempiés de Kakuja | ¿1000 menos 7? |

#### LEGENDARIOS (ataque + magia + strike + ultimate)
| ID | Personaje | Ataque | Magia | Strike | Ultimate |
|---|---|---|---|---|---|
| l01 | Gojo (Awakened) | Destello Negro Crítico | Azul Máximo | Rojo Invertido | Vacío Inconmensurable |
| l02 | Sukuna (Rey Maldiciones) | Desmantelar Continuo | Fuga Absoluta | Corte que Divide el Mundo | Reliquia Malévola |
| l03 | Rudeus Greyrat (Dios Magia) | Armadura Mágica MK-I | Cañón de Piedra Nuclear | Hidro-Bomba Cataclísmica | Cumulonimbus Absoluto |
| l04 | Naruto (S6C) | Rasen Shuriken de Lava | Rasengan Magnético | Toldo de Bestias | Flecha de Indra Final |
| l05 | Luffy (Gear 5) | Gomu Gomu no Gigant | Gomu Gomu no Lightning | Bajrang Gun | Amanecer Blanco de la Libertad |
| l06 | Sasuke (Rinnegan Supremo) | Chidori Kagutsuchi | Amaterasu | Susanoo: Flecha de Indra | Chibaku Tensei Celestial |
| l07 | Tanjiro (Marca Cazador) | Danza del Dios del Fuego | Sol Poniente | Decimotercera Postura | Tajo de la Cabeza del Dragón |
| l08 | Eren (Titán Fundador) | Pisotón del Retumbar | Control de Titanes | Endurecimiento Divino | El Retumbar Absoluto |
| l09 | Joseph (Maestro Supremo) | Clacker Volley Imbuido | Hamon Overdrive Máximo | Red de Hilos Solar | Predicción de Turno |
| l10 | Itadori (Despertado) | Combo de Destellos Negros | Santuario Efímero | Impacto Punzante de Alma | Corte de Almas Separadas |
| l11 | Killua (Godspeed) | Torbellino Eléctrico | Descarga Narukami | Velocidad Lumínica | Perforación de Corazón |
| l12 | Makoto Yuki (Mesías P3) | Tajo del Fin del Mundo | Megidolaon Cósmico | Gran Sello | Armagedón de Tánatos/Orpheus |
| l13 | Yu Narukami (Izanagi-no-Okami) | Tajo de la Verdad | Ziodyne Absoluto | Espada de Justicia | Myriad Truths Divino |
| l14 | Ren Amamiya (Satanael P5) | Disparo de Alta Traición | Maeigaon Cósmico | Balas de la Rebelión | Sinful Shell |
| l15 | Light Yagami (Kira) | Juicio Ejecutivo | Manipulación de Eventos | Sonrisa del Triunfo | Sentencia Final del Death Note |
| l16 | L Lawliet (Justicia Global) | Análisis Forense | Operación de Captura | Red de Espionaje | Jaque Mate Absoluto |
| l17 | Aqua Hoshino (Actor Oscuro) | Interpretación de Venganza | Ojos de Doble Filo | Manipulación Mediática | Destrucción Psicológica |
| l18 | Ruby Hoshino (Idol Nueva Era) | Baile de Escenario Perfecto | Brillo de Estrella | Concierto del Domo | Renacimiento de la Luz de Ai |
| l19 | Natsu (Dragón Negro) | Espada del Fénix | Rugido del Dios Dragón | Loto Carmesí Explosivo | Puño del Rey Dragón |
| l20 | Deku (100% Full Cowl) | Texas Smash | Fa Jin + Quinto Látigo | United States of World Smash | OFA 100% Shoot Style |
| l21 | Ken Kaneki (Dragón) | Azote de Tentáculos | Devoración de Células RC | Ruina de la CCG | El Despertar del Dragón |

### FASE 4 — Migración

- [x] **4.1.** Reset total: se borra la DB, inventario, monedas y progreso
- [x] **4.2.** Las cartas viejas (26) se reemplazan por el nuevo catálogo (75 cartas)
- [x] **4.3.** Se regeneran las imágenes desde la API de Jikan

### FASE 5 — Animaciones

- [x] **5.1. Ataque físico** — impacto/zoom simple en la carta objetivo
- [x] **5.2. Magia** — partículas del color del elemento + flotación
- [x] **5.3. Strike** — animación más elaborada + brillo + screen shake medio
- [x] **5.4. Ultimate** — cámara lenta (scale pulse), filtro púrpura, pantalla vibra fuerte

---

## 🏪 FASE 14: Tienda de Sobres + Contenido del Sobre

- [x] **14.1. Tipos de sobre (server-side)**

  | Tipo | Costo | Cartas | Mínimo garantizado | Badge |
  |------|-------|--------|--------------------|-------|
  | Básico | 100 🪙 | 1 | — | COMÚN (azul) |
  | Deluxe | 300 🪙 | 3 | RARO+ | RARO+ (plata) |
  | Premium | 600 🪙 | 5 | ÉPICO+ | ÉPICO+ (oro) |
  | Legendario | 1000 🪙 | 7 | LEGENDARIO | ★ LEGENDARIO (rojo) |

  - `server/src/data/packs.ts` — definiciones
  - `GET /api/packs` devuelve los tipos

- [x] **14.2. Probabilidades con garantía**
  - `pullCardWithGuarantee()` en `probabilities.ts`
  - La última carta del pack se fuerza a la rareza mínima

- [x] **14.3. POST /api/open acepta packType**
  - Devuelve `{ cards: { card, isNew }[], user }` en vez de una sola carta
  - Inserta todas las cartas en inventory dentro de una transacción
  - Actualiza pity/totalPulls/legendaryCount por cada carta

- [x] **14.4. Store en grilla 2×2**
  - 4 tipos de sobre en cuadrícula con badge de rareza, costo y cantidad
  - Color del badge según tipo: azul / plata / oro / rojo
  - Navegación completa con teclado (↑↓←→ + Enter)
  - Botón VOLVER debajo

- [x] **14.5. Color dinámico del sobre 3D**
  - Cada tipo de sobre pasa `packColor` a PackScene3D
  - Envelope3D usa el color del tipo (azul/plata/oro/rojo)

- [x] **14.6. Flujo de apertura**
  1. Store → click pack → `phase='opening'` (animación 3D)
  2. → `phase='revealed'` (mejor carta + botón "VER CONTENIDO DEL SOBRE")
  3. → `phase='contents'` (fan-out 3D con navegación ← →)
  4. → "GUARDAR EN EL ÁLBUM" → vuelve a store

- [x] **14.7. Fan-out 3D (PackFan)**
  - Todas las cartas en abanico con Three.js
  - Carta seleccionada se acerca a cámara + escala 1.15
  - Navegación ← → entre cartas con animación smooth
  - Stats de la carta seleccionada en overlay inferior
  - Sombra/copia de cartas no seleccionadas para profundidad

---

## 🔙 REVERTIR DESPUÉS DEL TESTING

### Cosas que cambiar para volver a la lógica normal:

1. **`server/src/db/schema.ts`** — Cambiar `DEFAULT 999999` → `DEFAULT 500` (línea 18, columna `coins`)
2. **`server/src/routes/gacha.ts`** — Cambiar `coins: 999999` → `coins: 500` (línea 52, respuesta de registro)
3. **Eliminar `server/src/routes/debug.ts`** — Archivo entero de debug
4. **`server/src/index.ts`** — Eliminar `import debugRouter` y `app.use('/api', debugRouter)` (líneas 6 y 16)
5. **Opcional: reiniciar DB** — Borrar `server/data.db` para que los nuevos registros tomen el DEFAULT corregido

⚠️ Los cambios de PackScene3D (Canvas siempre montado, body scale [0,0,0], delay 0.05) **NO** se revierten — esos son fixes permanentes del bug "cuadrado feo".

### Partida guardada

El token del usuario Alan está en `Partida/gacha-persona-save-Alan.json`:
```
token: 35a2e7d6-ed71-4439-b0d6-562505f6e6f2
```
Para asignar 999999 coins ahora mismo, abrí consola del browser y pegá:
```js
fetch('/api/debug/coins',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:'35a2e7d6-ed71-4439-b0d6-562505f6e6f2'})}).then(r=>r.json()).then(console.log)
```
Después recargá la página.
