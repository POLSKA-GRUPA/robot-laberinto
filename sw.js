/* Service Worker de ROBOT: Laberinto de Plataformas.
   Precachea el juego completo en install (incluido robot.glb) para que funcione
   sin conexión. Same-origin: cache-first con relleno de caché. CDN de three.js:
   stale-while-revalidate. Navegaciones: index.html de caché con fallback a red. */

const VERSION = "1.6.1-voz-diagnostico";
const CACHE = "robot-" + VERSION;
const PRECACHE = [
  "./",
  "./index.html",
  "./levels.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./robot.glb",
  "./budy.glb",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(
        claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Navegaciones: siempre el documento de la app.
  if (req.mode === "navigate") {
    // RED PRIMERO para el documento: si hay conexion ves la ultima version;
    // sin conexion cae a la copia cacheada. Los assets pesados siguen cache-first.
    e.respondWith(
      fetch(req).then((resp) => {
        const copia = resp.clone();
        caches.open(CACHE).then((c) => c.put("./index.html", copia));
        return resp;
      }).catch(() =>
        caches.match("./index.html").then((r) => r || caches.match("./"))
      )
    );
    return;
  }

  // Mismo origen (juego, niveles, iconos, GLB): cache-first.
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then((r) =>
        r || fetch(req).then((resp) => {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
          return resp;
        }).catch(() => caches.match("./"))
      )
    );
    return;
  }

  // CDN de three.js: stale-while-revalidate (cache si la hay, actualiza detrás).
  if (url.hostname === "cdn.jsdelivr.net") {
    e.respondWith(
      caches.match(req).then((enCache) => {
        const actualizar = fetch(req).then((resp) => {
          if (resp && resp.status === 200) {
            const copia = resp.clone();
            caches.open(CACHE).then((c) => c.put(req, copia));
          }
          return resp;
        }).catch(() => enCache);
        return enCache || actualizar;
      })
    );
  }
});
