import express from "express";
import {
  createSeat,
  deleteSeat,
  getAllSeats,
  updateSeat,
} from "../services/seatService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const seats = await getAllSeats();
    return res.json(seats);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "name zorunludur",
      });
    }

    const seat = await createSeat(name);
    return res.status(201).json(seat);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.put("/", async (req, res) => {
  try {
    const { id, name } = req.body;

    if (!id || !name) {
      return res.status(400).json({
        message: "id ve name zorunludur",
      });
    }

    const seat = await updateSeat(id, name);
    return res.json(seat);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await deleteSeat(id);
    return res.json(true);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

export default router;
