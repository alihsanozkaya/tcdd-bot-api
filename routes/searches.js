import express from "express";
import {
  createSearch,
  foundSearch,
  getActiveSearchesByUser,
  getAllActiveSearches,
  stopDatePassedSearch,
  stopErrorSearch,
  stopSearch,
} from "../services/searchService.js";
import { searchTrains } from "../services/tcddService.js";

const router = express.Router();

const sendError = (res, err, fallbackStatus = 400) => {
  if (err?.name === "CastError") {
    return res.status(400).json({ message: "Geçersiz id", code: "INVALID_ID" });
  }

  const status = Number(err?.statusCode) || fallbackStatus;

  return res.status(status).json({
    message: err?.message || "Beklenmeyen hata",
    ...(err?.code ? { code: err.code } : {}),
  });
};

const withId = (handler) => async (req, res) => {
  const { id } = req.body ?? {};

  if (!id) {
    return res
      .status(400)
      .json({ message: "id zorunludur", code: "INVALID_BODY" });
  }

  try {
    await handler(id);
    return res.json(true);
  } catch (err) {
    return sendError(res, err);
  }
};

router.get("/", async (req, res) => {
  try {
    const searches = await getAllActiveSearches();
    return res.json(searches);
  } catch (err) {
    return sendError(res, err, 500);
  }
});

router.post("/preview", async (req, res) => {
  const { fromStationId, toStationId, departureDate } = req.body ?? {};

  if (!fromStationId || !toStationId || !departureDate) {
    return res.status(400).json({
      message: "fromStationId, toStationId ve departureDate zorunludur",
      code: "INVALID_BODY",
    });
  }

  try {
    const trips = await searchTrains({
      fromStationId,
      toStationId,
      departureDate,
    });
    return res.json(trips);
  } catch (err) {
    if (err?.code === "INVALID_DATE" || err?.code === "INVALID_STATION") {
      return res.status(400).json({ message: err.message, code: err.code });
    }

    if (err?.code === "MISSING_CONFIG") {
      console.error("[preview] Yapılandırma eksik:", err.message);
      return res.status(500).json({ message: err.message, code: err.code });
    }

    if (err?.code === "ECONNABORTED" || err?.code === "ETIMEDOUT") {
      console.error("[preview] TCDD zaman aşımı");
      return res.status(504).json({
        message: "TCDD servisi zaman aşımına uğradı",
        code: "UPSTREAM_TIMEOUT",
      });
    }

    const upstreamStatus = err?.response?.status;

    if (upstreamStatus) {
      console.error(`[preview] TCDD ${upstreamStatus} döndürdü`);
      return res.status(502).json({
        message: `TCDD servisi ${upstreamStatus} döndürdü`,
        code: "UPSTREAM_ERROR",
        upstreamStatus,
      });
    }

    console.error("[preview] TCDD'ye ulaşılamadı:", err?.message);
    return res.status(502).json({
      message: err?.message || "TCDD servisine ulaşılamadı",
      code: "UPSTREAM_UNAVAILABLE",
    });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const searches = await getActiveSearchesByUser(req.params.userId);
    return res.json(searches);
  } catch (err) {
    return sendError(res, err);
  }
});

router.post("/", async (req, res) => {
  try {
    const search = await createSearch(req.body ?? {});
    return res.status(201).json(search);
  } catch (err) {
    return sendError(res, err);
  }
});

router.post("/foundSearch", withId(foundSearch));
router.post("/stopSearch", withId(stopSearch));
router.post("/stopErrorSearch", withId(stopErrorSearch));
router.post("/stopDatePassed", withId(stopDatePassedSearch));

export default router;
