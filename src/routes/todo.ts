import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const router = Router();
const prisma = new PrismaClient();

// POST /todos → crear un nuevo todo
router.post("/", async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const todo = await prisma.todo.create({ data: { title } });
    return res.status(201).json(todo);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al crear el todo" });
  }
});

// GET /todos → listar todos los todos
router.get("/", async (req, res) => {
  const todos = await prisma.todo.findMany();
  res.json(todos);
});

export default router;
