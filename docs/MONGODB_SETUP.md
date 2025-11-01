# MongoDB Setup

1) Start MongoDB (Docker)
- docker compose up -d

2) Configure env
- cp .env.example .env.local
- Edit MONGODB_URI / MONGODB_DB as needed

3) Install driver (if not installed)
- npm i mongodb

4) Verify connectivity
- MONGODB_URI=... MONGODB_DB=... node ./scripts/check-mongodb.mjs
  or ensure the vars are present in your env and just run:
- node ./scripts/check-mongodb.mjs

5) Use in app
- import { getDb } from "@/lib/mongoClient";
- const db = await getDb();
