# HANDOFF: Mini juego "Robot: Laberinto de Plataformas"

Fecha: 2026-09-07. Origen: sesión Claude en PGK_Empresa_Autonoma (proyecto personal de Natalia, NO es trabajo de clientes PGK).

## Qué es esto

Mini juego web 3D con un robot diseñado por Natalia en Tripo AI. Aprobado por ella: juego de plataformas por niveles (laberinto de plataformas flotantes, 5 niveles con dificultad creciente). Todo corre en navegador, sin build, sin npm.

## Estado actual (verificar al retomar)

Ubicación actual: `/Users/nataliasikora/PGK/robot-game/`

| Archivo | Estado |
|---|---|
| `robot.glb` | Modelo Tripo (16.4 MB). 1 malla, 307k vértices, 3 texturas PBR. SIN animaciones ni esqueleto. NO modificar |
| `index.html` | Juego completo en un solo archivo (Three.js 0.160 vía CDN jsdelivr, importmap, inline CSS/JS). Escrito por un subagente Sonnet, posiblemente aún sin verificar en navegador |
| `jugar.command` | Lanzador macOS: levanta `python3 -m http.server 8321` y abre el navegador |
| `HANDOFF.md` | Este documento |

Un subagente Sonnet ("currito-juego") estaba terminando la verificación cuando se cortó la sesión. El código existe pero PUEDE quedar verificación pendiente: asumir NO verificado hasta probarlo.

## Spec del juego (lo aprobado con Natalia)

- Control: flechas Y WASD para mover, ESPACIO saltar. Movimiento relativo a cámara. Cámara tercera persona con lerp suave.
- Robot sin esqueleto: animación procedural (bob senoidal en idle, inclinación al moverse y girar). Auto-centrado y escalado a ~1.6 unidades de alto al cargar el GLB.
- 5 niveles definidos como datos puros (arrays de plataformas): N1 tutorial, N2 huecos mayores, N3 introduce plataformas móviles, N4 plataformas que caen (tiemblan ~0.5s y caen), N5 combinación.
- Portal brillante (torus animado) al final de cada nivel. Caer bajo y=-10: respawn en el spawn del nivel, contador de caídas +1. Sin game over.
- HUD y toda la UI en ESPAÑOL: "Nivel X / 5", "Caídas: N", overlays de nivel superado y final, pantalla de inicio con "Jugar" / "Continuar".
- Progreso en localStorage (nivel máximo + caídas totales).
- Estética sci-fi: vacío oscuro, niebla, plataformas con bordes emisivos, sombras (shadow map 1024, pixelRatio máx 2).

## Decisiones ya tomadas (no reabrir)

1. Formato GLB elegido sobre USD/FBX/OBJ/STL/3MF: carga nativa en Three.js con texturas y materiales en un solo binario.
2. Web con Three.js por CDN, sin Unity/Unreal, sin build tools.
3. Tipo de juego: plataformas por niveles (Natalia descartó runner y recolector).
4. Trabajo implementado por subagentes baratos (Sonnet); el orquestador solo supervisa (petición explícita de Natalia para ahorrar créditos).

## Próximos pasos, en orden

1. Mover el proyecto a su sitio correcto: `mv ~/PGK/robot-game "/Users/nataliasikora/Mis documentos/PROGRAMADOR_FRIKI_PGK/robot-game"` (Natalia quiere el trabajo en la carpeta PROGRAMADOR_FRIKI_PGK).
2. Verificar que el juego arranca: doble clic en `jugar.command` o `cd` a la carpeta y `python3 -m http.server 8321`, abrir `http://localhost:8321`. El GLB necesita servidor HTTP, NO funciona abriendo el archivo con file://.
3. Probar en navegador: cargar sin errores de consola, robot visible con texturas, moverse/saltar, completar nivel 1, probar respawn al caer, plataformas móviles (N3) y que caen (N4), portal final.
4. Arreglar lo que falle (bugs típicos esperables: escala/orientación del robot, colisiones AABB, cámara).
5. Enseñárselo a Natalia y pulir según su feedback (posible siguiente petición: controles táctiles móvil, sonido).

## Gotchas

- El GLB pesa 16.4 MB y tiene 307k vértices: primera carga tarda unos segundos, poner/mantener pantalla de carga.
- Si la consola muestra error CORS o 404 del GLB: se está abriendo por file:// en vez de servidor.
- `jugar.command`: si macOS bloquea la primera ejecución, botón derecho > Abrir, o `chmod +x jugar.command`.
- Regla de estilo de Natalia para cualquier texto: prohibido em dash y en dash como separador.
