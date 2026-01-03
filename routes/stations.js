import express from "express";
import {
  createStation,
  deleteStation,
  getAllStations,
  updateStation,
} from "../services/stationService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const stations = await getAllStations();
    return res.json(stations);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { code, name } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        message: "code ve name zorunludur",
      });
    }

    const station = await createStation(code, name);
    return res.status(201).json(station);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.put("/", async (req, res) => {
  try {
    const { id, code, name } = req.body;

    if (!id || !code || !name) {
      return res.status(400).json({
        message: "id, code ve name zorunludur",
      });
    }

    const station = await updateStation(id, code, name);
    return res.json(station);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await deleteStation(id);
    return res.json(true);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

export default router;
