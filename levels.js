/* =========================================================================
   levels.js: niveles del juego "Robot: Laberinto de Plataformas".
   Exporta generarNiveles() que devuelve SIEMPRE 17 niveles completables:
   los 5 primeros son los manuales originales (tal cual) y del 6 al 17 se
   generan por procedimiento con PRNG determinista mulberry32 sembrado por
   el numero de nivel (el nivel 12 es siempre identico).
   Tambien exporta nivelEsCompletable(nivel): geometria pura (sin THREE)
   usada por el generador y por los tests externos.
   ========================================================================= */

/* ----------------------------- PRNG ----------------------------------- */

function mulberry32(semilla) {
  let a = semilla >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lerp(a, b, t) { return a + (b - a) * t; }

/* ------------------- Geometria pura de validacion ---------------------- */
/* Constantes fisicas del juego (solo lectura, duplicadas para no importar
   three ni tocar index.html): MOVE_SPEED 6, JUMP_SPEED 11, GRAVITY -30.
   Tiempo de vuelo al caer de vuelta a la misma altura: 0.733 s.
   Alcance horizontal a igual altura: 4.4 unidades. Apex: 2.02. */

const FISICA = {
  velocidad: 6,
  salto: 11,
  gravedad: 30,
  margen: 0.8, // holgura de seguridad sobre el alcance teorico
};

function normalizar(p) {
  return {
    type: p.type || "static",
    x: p.pos[0], y: p.pos[1], z: p.pos[2],
    w: p.size[0], h: p.size[1], d: p.size[2],
    top: p.pos[1] + p.size[1] / 2,
    axis: p.axis || null,
    amplitude: p.amplitude || 0,
    speed: p.speed || 1,
    phase: p.phase || 0,
  };
}

function posicionFase(p, angulo) {
  const off = Math.sin(angulo) * p.amplitude;
  return p.axis === "x" ? { x: p.x + off, z: p.z } : { x: p.x, z: p.z + off };
}

function distBordes(ax, az, aw, ad, bx, bz, bw, bd) {
  const dx = Math.max(0, Math.abs(bx - ax) - (aw + bw) / 2);
  const dz = Math.max(0, Math.abs(bz - az) - (ad + bd) / 2);
  return Math.hypot(dx, dz);
}

// Distancia minima borde a borde entre dos plataformas, evaluando la
// oscilacion de las moving en 16 fases (por regla de generacion nunca hay
// dos moving consecutivas, pero el doble bucle lo cubre igualmente).
function distMinima(a, b) {
  const fasesA = a.type === "moving" ? 16 : 1;
  const fasesB = b.type === "moving" ? 16 : 1;
  let mejor = Infinity;
  for (let i = 0; i < fasesA; i++) {
    const pa = posicionFase(a, (i / 16) * Math.PI * 2 + a.phase);
    for (let j = 0; j < fasesB; j++) {
      const pb = posicionFase(b, (j / 16) * Math.PI * 2 + b.phase);
      const d = distBordes(pa.x, pa.z, a.w, a.d, pb.x, pb.z, b.w, b.d);
      if (d < mejor) mejor = d;
    }
  }
  return mejor;
}

// Alcance horizontal permisible para saltar de A (top a.top) a B (top b.top).
// Si B es mas alta (g > 0) se aterriza en el ramal DESCENDENTE del salto,
// que es cuando el cuerpo vuelve a cruzar la altura g: t = (11 + raiz(121 -
// 60g)) / 30. (La rama de subida seria el alcance minimo para rozar la
// altura, no para aterrizar encima.) Valido mientras g < 121/60 = 2.016.
function alcancePermitido(g) {
  if (g <= 0) return 4.4 - FISICA.margen;
  const rad = Math.max(0, 121 - 60 * g);
  const t = (FISICA.salto + Math.sqrt(rad)) / FISICA.gravedad;
  return FISICA.velocidad * t - FISICA.margen;
}

export function nivelEsCompletable(nivel) {
  if (!nivel || !Array.isArray(nivel.platforms) || nivel.platforms.length < 2) return false;
  if (!nivel.spawn || !nivel.portal) return false;
  const ps = nivel.platforms.map(normalizar);

  for (let i = 0; i + 1 < ps.length; i++) {
    const dist = distMinima(ps[i], ps[i + 1]);
    const permiso = alcancePermitido(ps[i + 1].top - ps[i].top);
    if (dist > permiso) return false;
  }

  // Portal: alineado con la ultima plataforma y a menos de 3.0 del borde.
  // Se permite hasta 1.0 de solape (portal casi sobre el borde).
  const ult = ps[ps.length - 1];
  if (Math.abs(nivel.portal.x - ult.x) > 1.6) return false;
  const dzPortal = (ult.z - ult.d / 2) - nivel.portal.z;
  if (dzPortal < -1.0 || dzPortal > 3.0) return false;

  // Spawn dentro de la primera plataforma.
  const prim = ps[0];
  if (Math.abs(nivel.spawn.x - prim.x) > prim.w / 2) return false;
  if (Math.abs(nivel.spawn.z - prim.z) > prim.d / 2) return false;
  return true;
}

/* ------------------------ Niveles manuales 1 a 5 ------------------------ */

const NIVELES_MANUALES = [
  {
    nombre: "Nivel 1",
    spawn: { x: 0, y: 0.5, z: 2 },
    portal: { x: 1.5, y: 1.5, z: -33 },
    platforms: [
      { type: "static", pos: [0, 0, 0], size: [6, 1, 6] },
      { type: "static", pos: [0, 0, -7], size: [5, 1, 5] },
      { type: "static", pos: [0, 0, -14], size: [5, 1, 5] },
      { type: "static", pos: [1.5, 0, -21], size: [5, 1, 5] },
      { type: "static", pos: [1.5, 0, -28], size: [6, 1, 6] },
    ],
  },
  {
    nombre: "Nivel 2",
    spawn: { x: 0, y: 0.5, z: 2 },
    portal: { x: 0, y: 1.5, z: -38 },
    platforms: [
      { type: "static", pos: [0, 0, 0], size: [5, 1, 5] },
      { type: "static", pos: [0, 0.3, -6], size: [3.5, 1, 3.5] },
      { type: "static", pos: [3, 0.8, -11], size: [3, 1, 3] },
      { type: "static", pos: [3, 0.8, -16.5], size: [3, 1, 3] },
      { type: "static", pos: [-1, 0.2, -22], size: [3, 1, 3] },
      { type: "static", pos: [-1, 0, -27.5], size: [4, 1, 4] },
      { type: "static", pos: [0, 0, -33], size: [5, 1, 5] },
    ],
  },
  {
    nombre: "Nivel 3",
    spawn: { x: 0, y: 0.5, z: 2 },
    portal: { x: 3, y: 1.5, z: -37.5 },
    platforms: [
      { type: "static", pos: [0, 0, 0], size: [5, 1, 5] },
      { type: "static", pos: [0, 0, -6], size: [3.5, 1, 3.5] },
      {
        type: "moving", pos: [3, 0, -11], size: [2.8, 1, 2.8],
        axis: "x", amplitude: 3, speed: 1.0, phase: 0,
      },
      { type: "static", pos: [6.5, 0, -11], size: [3, 1, 3] },
      { type: "static", pos: [6.5, 0, -16.5], size: [3, 1, 3] },
      {
        type: "moving", pos: [6.5, 0, -21.5], size: [2.8, 1, 2.8],
        axis: "z", amplitude: 3, speed: 0.9, phase: 1.2,
      },
      { type: "static", pos: [6.5, 0, -27.5], size: [3.5, 1, 3.5] },
      { type: "static", pos: [3, 0, -32.5], size: [4, 1, 4] },
    ],
  },
  {
    nombre: "Nivel 4",
    spawn: { x: 0, y: 0.5, z: 2 },
    portal: { x: 0, y: 1.5, z: -39 },
    platforms: [
      { type: "static", pos: [0, 0, 0], size: [5, 1, 5] },
      { type: "static", pos: [0, 0, -6], size: [3.5, 1, 3.5] },
      { type: "falling", pos: [0, 0, -10.5], size: [3, 1, 3] },
      { type: "falling", pos: [0, 0, -15], size: [3, 1, 3] },
      { type: "static", pos: [0, 0, -20], size: [3.5, 1, 3.5] },
      { type: "falling", pos: [2, 0, -24.5], size: [2.8, 1, 2.8] },
      { type: "falling", pos: [-2, 0, -29], size: [2.8, 1, 2.8] },
      { type: "static", pos: [0, 0, -34], size: [4, 1, 4] },
    ],
  },
  {
    nombre: "Nivel 5",
    spawn: { x: 0, y: 0.5, z: 2 },
    portal: { x: 0, y: 1.5, z: -59.5 },
    platforms: [
      { type: "static", pos: [0, 0, 0], size: [5, 1, 5] },
      { type: "static", pos: [0, 0.3, -6], size: [3.5, 1, 3.5] },
      {
        type: "moving", pos: [3, 0.3, -11], size: [2.8, 1, 2.8],
        axis: "x", amplitude: 2.8, speed: 1.0, phase: 0,
      },
      { type: "static", pos: [5.8, 0.3, -11], size: [3, 1, 3] },
      { type: "falling", pos: [5.8, 0.3, -16], size: [2.8, 1, 2.8] },
      { type: "static", pos: [5.8, 0.8, -20.5], size: [3, 1, 3] },
      {
        type: "moving", pos: [5.8, 0.8, -25.5], size: [2.8, 1, 2.8],
        axis: "z", amplitude: 3, speed: 0.9, phase: 0.6,
      },
      { type: "static", pos: [5.8, 0.8, -31.5], size: [3.5, 1, 3.5] },
      { type: "falling", pos: [3, 0.8, -36], size: [2.8, 1, 2.8] },
      { type: "falling", pos: [0, 0.8, -40], size: [2.8, 1, 2.8] },
      { type: "static", pos: [0, 0.4, -44.5], size: [3.5, 1, 3.5] },
      {
        type: "moving", pos: [0, 0.4, -49.5], size: [2.8, 1, 2.8],
        axis: "x", amplitude: 3, speed: 1.1, phase: 0,
      },
      { type: "static", pos: [0, 0, -54.5], size: [4.5, 1, 4.5] },
    ],
  },
];

export const TOTAL_NIVELES = 17;

/* ------------------------- Generador procedural ------------------------ */

function redondear(v, decimales) {
  const f = Math.pow(10, decimales);
  return Math.round(v * f) / f;
}

// Un intento de nivel procedural n. Determinista en (n, intento, reduccion).
function intentarNivel(n, intento, reduccion) {
  const rng = mulberry32(((n * 2654435761) ^ (intento * 40503) ^ (reduccion * 97001)) >>> 0);
  const t = (n - 6) / (TOTAL_NIVELES - 6); // 0 en el nivel 6, 1 en el ultimo
  const gapFactor = Math.pow(0.9, reduccion);
  const num = Math.round(6 + 8 * t);

  const pMoving = lerp(0.12, 0.45, t);
  const pFalling = lerp(0.12, 0.45, t);

  const platforms = [];
  const s0 = redondear(4.5 + rng() * 1.0, 2);
  platforms.push({ type: "static", pos: [0, 0, 0], size: [s0, 1, s0] });

  let xAcum = 0, yAcum = 0;
  let ultimoMovingIdx = -10;

  for (let i = 1; i < num; i++) {
    const esUltima = i === num - 1;
    const prev = platforms[platforms.length - 1];
    const prevN = normalizar(prev);

    // Tamano.
    let s = lerp(4.2, 2.7, t) * (0.85 + 0.3 * rng());
    if (esUltima) s = Math.max(s, 3.2);
    s = redondear(Math.max(2.4, s), 2);

    // Tipo segun reglas.
    const prevType = prev.type;
    const movingPermitido = !esUltima && (i - ultimoMovingIdx) >= 3;
    const fallingPermitido = !esUltima && i >= 2 && prevType !== "falling";
    const r = rng();
    let tipo = "static";
    if (movingPermitido && r < pMoving) tipo = "moving";
    else if (fallingPermitido && r < pMoving + pFalling) tipo = "falling";

    // Altura.
    const maxUp = lerp(0.6, 1.2, t);
    const r2 = rng();
    let dy = 0;
    if (r2 < 0.35) dy = rng() * maxUp;
    else if (r2 < 0.6) dy = -rng() * 1.5;
    let yNuevo = Math.min(2.0, Math.max(-0.5, yAcum + dy));
    dy = yNuevo - yAcum;

    // Separacion objetivo de bordes.
    let gapTarget = (1.4 + rng() * (1.2 + 1.8 * t)) * gapFactor;
    gapTarget = Math.min(gapTarget, 3.2);
    if (tipo === "moving" || prevType === "moving") gapTarget = Math.min(gapTarget, 2.9);
    const permisoAltura = alcancePermitido(dy) - 0.15;
    gapTarget = Math.max(1.0, Math.min(gapTarget, permisoAltura));

    // Lateral con deriva limitada.
    let dxLat = (rng() * 2 - 1) * 2.2;
    dxLat = Math.min(5 - xAcum, Math.max(-5 - xAcum, dxLat));
    let dxEdge = Math.max(0, Math.abs(dxLat) - (prevN.w + s) / 2);
    if (dxEdge >= gapTarget) {
      // El paso lateral se come el hueco: aplastar lateral y reintentar el calculo.
      dxLat *= (gapTarget * 0.5) / Math.max(0.001, Math.abs(dxLat));
      dxLat = Math.min(5 - xAcum, Math.max(-5 - xAcum, dxLat));
      dxEdge = Math.max(0, Math.abs(dxLat) - (prevN.w + s) / 2);
    }
    const xNuevo = redondear(xAcum + dxLat, 2);

    // Colocacion en z para que la distancia borde a borde sea el objetivo.
    const dzEdge = Math.sqrt(Math.max(0.25, gapTarget * gapTarget - dxEdge * dxEdge));
    const dzCentro = dzEdge + (prevN.d + s) / 2;
    const zNuevo = redondear(prevN.z - dzCentro, 2);

    const plataforma = { type: tipo, pos: [xNuevo, redondear(yNuevo, 2), zNuevo], size: [s, 1, s] };

    if (tipo === "moving") {
      let axis = rng() < 0.5 ? "x" : "z";
      let amplitude = 1.6 + rng() * 1.4;
      const speed = redondear(0.7 + rng() * 0.5, 2);
      const phase = redondear(rng() * Math.PI * 2, 2);
      if (axis === "z") {
        // Evitar que el barrido en z invada la anterior: limitar amplitud.
        amplitude = Math.min(amplitude, dzEdge - 0.4);
        if (amplitude < 0.8) axis = "x";
      }
      plataforma.axis = axis;
      plataforma.amplitude = redondear(Math.min(amplitude, 3.0), 2);
      plataforma.speed = speed;
      plataforma.phase = phase;
      ultimoMovingIdx = i;
    }

    platforms.push(plataforma);
    xAcum = xNuevo;
    yAcum = yNuevo;
  }

  // Recorte simétrico de amplitud: ninguna moving en z puede invadir visualmente
  // a su vecina anterior ni a la posterior (hueco mínimo 0.4 en ambos lados).
  // Si no cabe, se reconvier­te a eje x (el barrido lateral nunca recorta z, así
  // que no puede atravesar a las vecinas).
  for (let i = 1; i < platforms.length - 1; i++) {
    const p = platforms[i];
    if (p.type !== "moving" || p.axis !== "z") continue;
    const pn = normalizar(p);
    const prevN = normalizar(platforms[i - 1]);
    const nextN = normalizar(platforms[i + 1]);
    const dzPrev = Math.max(0.1, Math.abs(pn.z - prevN.z) - (pn.d + prevN.d) / 2);
    const dzNext = Math.max(0.1, Math.abs(nextN.z - pn.z) - (nextN.d + pn.d) / 2);
    const amp = Math.min(p.amplitude, dzPrev - 0.4, dzNext - 0.4);
    if (amp < 0.8) {
      p.axis = "x";
      p.amplitude = 2.0;
    } else {
      p.amplitude = redondear(amp, 2);
    }
  }
  const primera = normalizar(platforms[0]);
  const ult = normalizar(platforms[platforms.length - 1]);
  const spawn = {
    x: primera.x,
    y: redondear(primera.top, 2),
    z: redondear(Math.min(2, primera.d / 2 - 0.5), 2),
  };
  const portal = {
    x: redondear(ult.x, 2),
    y: redondear(ult.top + 1.0, 2),
    z: redondear(ult.z - ult.d / 2 - 2.2, 2),
  };

  return { nombre: `Nivel ${n}`, spawn, portal, platforms };
}

// Nivel de respaldo 100 por 100 estatico y holgado. Solo se usa si tras
// todos los reintentos algo fallara (no deberia ocurrir nunca).
function nivelRespaldo(n) {
  const platforms = [];
  for (let i = 0; i < 8; i++) {
    platforms.push({ type: "static", pos: [0, 0, -i * 6.4], size: [5, 1, 5] });
  }
  return {
    nombre: `Nivel ${n}`,
    spawn: { x: 0, y: 0.5, z: 2 },
    portal: { x: 0, y: 1.5, z: redondear(-7 * 6.4 - 2.5 - 2.2, 2) },
    platforms,
  };
}

function generarNivelProcedural(n) {
  for (let reduccion = 0; reduccion < 6; reduccion++) {
    for (let intento = 0; intento < 25; intento++) {
      const nivel = intentarNivel(n, intento, reduccion);
      if (nivelEsCompletable(nivel)) return nivel;
    }
  }
  return nivelRespaldo(n);
}

/* ------------------------------ API ------------------------------------ */

export function generarNiveles() {
  const niveles = NIVELES_MANUALES.map((nivel) => nivel);
  for (let n = 6; n <= TOTAL_NIVELES; n++) {
    niveles.push(generarNivelProcedural(n));
  }
  return niveles;
}
