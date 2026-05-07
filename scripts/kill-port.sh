#!/bin/sh
# Kill whatever is on PORT and wait until the port is actually free.
# Usage: kill-port.sh [port]  — defaults to 8080
PORT=${1:-8080}
PORT_HEX=$(printf '%04X' "$PORT")

# SIGKILL anything holding the port
fuser -k -KILL "${PORT}/tcp" 2>/dev/null || true

# Wait until /proc/net/tcp and /proc/net/tcp6 no longer show the port
WAITED=0
while grep -qE ":${PORT_HEX} " /proc/net/tcp6 2>/dev/null \
   || grep -qE ":${PORT_HEX} " /proc/net/tcp  2>/dev/null; do
  sleep 1
  WAITED=$((WAITED + 1))
  if [ "$WAITED" -ge 20 ]; then
    echo "kill-port: timeout after 20s waiting for port $PORT to free" >&2
    break
  fi
done

echo "kill-port: port $PORT is free"
