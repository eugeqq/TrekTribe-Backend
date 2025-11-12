import cors from "cors";
import express from "express";
import gastosRouter from "./routes/gastos.js";
import loginRouter from "./routes/login.js";
import registerRouter from "./routes/register.js";
import todosRouter from "./routes/todo.js";
import tribesRouter from "./routes/tribes.js";
import userRouter from "./routes/user.js";
import viajesRouter from "./routes/viajes.js";


const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json()); 
app.use("/uploads", express.static("uploads"));

app.use("/user", userRouter);
app.use("/todo", todosRouter);
app.use("/login", loginRouter);
app.use("/register",registerRouter);
app.use("/tribes", tribesRouter);
app.use("/viajes", viajesRouter);
app.use("/gastos", gastosRouter);




app.get("/", (req, res) => {
  res.send("🚀 Servidor corriendo!");
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor escuchando en http://192.168.1.70:${PORT}`);
});
