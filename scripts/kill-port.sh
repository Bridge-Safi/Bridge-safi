#!/bin/sh
# Kill whatever is on PORT, retrying until it's actually free.
# Usage: kill-port.sh [port]  — defaults to 8080
PORT=${1:-8080}
PORT_HEX=$(printf '%04X' "$PORT")

is_port_used() {
  grep -qE ":${PORT_HEX} " /proc/net/tcp6 2>/dev/null \
  || grep -qE ":${PORT_HEX} " /proc/net/tcp  2>/dev/null
}

# If port is already free, nothing to do
if ! is_port_used; then
  echo "kill-port: port $PORT is already free"
  exit 0
fi

ATTEMPT=0
while is_port_used; do
  ATTEMPT=$((ATTEMPT + 1))
  echo "kill-port: attempt $ATTEMPT — sending SIGKILL to processes on port $PORT..."
  fuser -k -KILL "${PORT}/tcp" 2>/dev/null || true
  sleep 2

  if [ "$ATTEMPT" -ge 30 ]; then
    echo "kill-port: ERROR — port $PORT still in use after $ATTEMPT attempts, giving up" >&2
    exit 1
  fi
done

echo "kill-port: port $PORT is free (after $ATTEMPT attempt(s))"
