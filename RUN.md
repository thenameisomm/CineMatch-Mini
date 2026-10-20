# How to Run CineMatch-Mini

Need: Node 20+, Docker.

```bash
# 1. Start MongoDB
docker compose up -d

# 2. Setup backend (first time only)
cp backend/.env.example backend/.env
npm install --legacy-peer-deps
npm run db:seed --workspace=backend

# 3. Start backend (:3000) — terminal 1
npm run dev:backend

# 4. Start frontend (:5173) — terminal 2
npm run dev:frontend
```

Open http://localhost:5173 and login with `student@cinematch.mini` / `Student@1234`.
