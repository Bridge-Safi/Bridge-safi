import type { Response } from "express";

const clients = new Set<Response>();

export function addSSEClient(res: Response) {
  clients.add(res);
}

export function removeSSEClient(res: Response) {
  clients.delete(res);
}

export function broadcastOrder(data: object) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  const dead: Response[] = [];
  clients.forEach(res => {
    try {
      res.write(payload);
    } catch (_) {
      dead.push(res);
    }
  });
  dead.forEach(r => clients.delete(r));
}
