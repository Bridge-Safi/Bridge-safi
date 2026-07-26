---
name: Chauffeur trip API contract
description: The live Bridge chauffeur site contract for separating Taxi Confort, Moto Taxi, and Eats delivery traffic.
---

Taxi Confort and Moto Taxi are submitted to the live chauffeur site with `POST /api/trips`: Taxi Confort uses `vehicleType: "car"` and Moto Taxi uses `vehicleType: "moto"`. Bridge Eats and other delivery services use the separate `/api/deliveries` endpoint.

**Why:** The live chauffeur frontend maps non-moto chauffeur accounts to the car pool and moto chauffeur accounts to the moto pool. The trips API also requires a numeric `fare`; omitting it causes a 400 response.

**How to apply:** Keep the two transport pools on `/api/trips`, keep Eats on `/api/deliveries`, and always send a numeric fare. Do not infer the live contract from stale project notes or invent `taxi`/`moto_taxi` vehicle types.