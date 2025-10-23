import cors from "cors";
import express from "express";

// Importar tus rutas
import loginRouter from "./routes/login.js";
import registerRouter from "./routes/register.js";
import todosRouter from "./routes/todo.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json()); // Para leer JSON del body

// Rutas
app.use("/todo", todosRouter);
app.use("/login", loginRouter);
app.use("/register",registerRouter);
//app.use("/user:id", userRouter);

// Ruta base
app.get("/", (req, res) => {
  res.send("🚀 Servidor corriendo!");
});

// Puerto
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
