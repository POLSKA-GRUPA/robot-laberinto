#!/bin/bash
# jugar.command
# Lanzador de doble clic (macOS) para "Robot: Laberinto de Plataformas".
# 1) Se coloca en su propia carpeta (funciona sin importar desde donde se invoque).
# 2) Mata cualquier servidor previo que estuviera escuchando en el puerto del juego.
# 3) Arranca un servidor HTTP simple para servir index.html y robot.glb.
# 4) Abre el navegador por defecto en esa URL.
# 5) Se queda vivo (wait) para que el servidor no muera al cerrar el proceso.

set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR" || { echo "No se pudo entrar en $DIR"; exit 1; }

PORT=8321
URL="http://localhost:${PORT}/"

echo "== Robot: Laberinto de Plataformas =="
echo "Carpeta del juego: $DIR"

# Matar cualquier proceso previo escuchando en ese puerto (si lsof está disponible).
if command -v lsof >/dev/null 2>&1; then
  PREV_PIDS="$(lsof -ti tcp:${PORT} 2>/dev/null || true)"
  if [ -n "${PREV_PIDS}" ]; then
    echo "Cerrando servidor anterior en el puerto ${PORT} (PID: ${PREV_PIDS})..."
    kill ${PREV_PIDS} 2>/dev/null || true
    sleep 0.5
  fi
fi

echo "Arrancando servidor en ${URL} ..."
python3 -m http.server "${PORT}" --bind 127.0.0.1 > "${DIR}/.jugar-server.log" 2>&1 &
SERVER_PID=$!

# Esperar un instante a que el servidor levante antes de abrir el navegador.
sleep 0.7
open "${URL}"

echo "Servidor corriendo (PID ${SERVER_PID}). Cierra esta ventana de Terminal para detenerlo."
wait "${SERVER_PID}"
