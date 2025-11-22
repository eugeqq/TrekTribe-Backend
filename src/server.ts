import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import os from "os";
import gastosRouter from "./routes/gastos.js";
import loginRouter from "./routes/login.js";
import registerRouter from "./routes/register.js";
import tareasRouter from "./routes/tareas.js";
import todosRouter from "./routes/todo.js";
import tribesRouter from "./routes/tribes.js";
import userRouter from "./routes/user.js";
import viajesRouter from "./routes/viajes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json()); 
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/user", userRouter);
app.use("/todo", todosRouter);
app.use("/login", loginRouter);
app.use("/register",registerRouter);
app.use("/tribes", tribesRouter);
app.use("/viajes", viajesRouter);
app.use("/gastos", gastosRouter);
app.use("/",tareasRouter)




app.get("/", (req, res) => {
  res.send("🚀 Servidor corriendo!");
});



const interfaces = os.networkInterfaces();
const wifi = interfaces.en0?.find(i => i.family === 'IPv4')?.address;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor escuchando en http://${wifi || "localhost"}:${PORT}`);
});
