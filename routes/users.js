import express from "express";
import {
  findOrCreateUser,
  getAllUsers,
  getChatIdByUserId,
} from "../services/userService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/getChatIdByUserId/:id", async (req, res) => {
  try {
    const chatId = await getChatIdByUserId(req.params.id);
    res.json(chatId);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { telegramId } = req.body;
    const user = await findOrCreateUser(telegramId);
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
