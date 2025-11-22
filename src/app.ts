import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import gastosRouter from "./routes/gastos";
import loginRouter from "./routes/login";
import registerRouter from "./routes/register";
import tareasRouter from "./routes/tareas";
import todosRouter from "./routes/todo";
import tribesRouter from "./routes/tribes";
import userRouter from "./routes/user";
import viajesRouter from "./routes/viajes";

dotenv.config();

const app = express();
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/user", userRouter);
app.use("/todo", todosRouter);
app.use("/login", loginRouter);
app.use("/register", registerRouter);
app.use("/tribes", tribesRouter);
app.use("/viajes", viajesRouter);
app.use("/gastos", gastosRouter);
app.use("/", tareasRouter);

app.get("/", (req, res) => {
  res.send("🚀 Servidor corriendo!");
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  const status = err?.status || 500;
  const message = err?.message || 'Internal Server Error';
  if (process.env.NODE_ENV === 'production') {
    res.status(status).json({ error: message });
  } else {
    res.status(status).json({ error: message, stack: err?.stack });
  }
});

export default app;
