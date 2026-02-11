import express from "express";
import {
  createSearch,
  foundSearch,
  getActiveSearchesByUser,
  getAllActiveSearches,
  refreshSearchTripList,
  stopErrorSearch,
  stopExpiredSearches,
  stopSearch,
} from "../services/searchService.js";
import { searchTrains } from "../services/tcddService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const searches = await getAllActiveSearches();
    return res.json(searches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/preview", async (req, res) => {
  try {
    const trips = await searchTrains(req.body);
    return res.json(trips);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const searches = await getActiveSearchesByUser(req.params.userId);
    return res.json(searches);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const search = await createSearch(req.body);
    return res.status(201).json(search);
  } catch (err) {

    if (err.statusCode == 409) {
      return res.status(409).json({ message: err.message });
    }

    return res.status(400).json({ message: err.message });
  }
});

router.post("/foundSearch", async (req, res) => {
  try {
    const { id } = req.body;
    await foundSearch(id);
    return res.json(true);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.post("/stopSearch", async (req, res) => {
  try {
    const { id } = req.body;
    await stopSearch(id);
    return res.json(true);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.post("/stopErrorSearch", async (req, res) => {
  try {
    const { id } = req.body;
    await stopErrorSearch(id);
    return res.json(true);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.post("/stopExpired", async (req, res) => {
  try {
    await stopExpiredSearches();
    return res.json(true);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post("/refreshSearchTrips", async (req, res) => {
  try {
    const { id } = req.body;
    await refreshSearchTripList(id);
    return res.json(true);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

export default router;
