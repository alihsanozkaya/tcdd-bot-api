import Search from "../models/Search.js";
import { isPastDate, parseTravelDate } from "../utils/dateUtils.js";

const notFoundError = () => {
  const err = new Error("Arama bulunamadı");
  err.statusCode = 404;
  err.code = "SEARCH_NOT_FOUND";
  return err;
};

const badRequest = (message, code) => {
  const err = new Error(message);
  err.statusCode = 400;
  if (code) err.code = code;
  return err;
};

export const getAllActiveSearches = async () => {
  return Search.find({ isActive: true });
};

export const getActiveSearchesByUser = async (userId) => {
  return Search.find({
    userId,
    isActive: true,
  }).sort({ createdAt: -1 });
};

export const createSearch = async ({
  userId,
  fromStationCode,
  toStationCode,
  seatType,
  travelDate,
  tripList,
}) => {
  if (!userId || !fromStationCode || !toStationCode || !seatType) {
    throw badRequest(
      "userId, fromStationCode, toStationCode ve seatType zorunludur",
      "INVALID_BODY",
    );
  }

  if (fromStationCode == toStationCode) {
    throw badRequest(
      "Kalkış ve varış istasyonları aynı olamaz",
      "SAME_STATION_ERROR",
    );
  }

  const parsedDate = parseTravelDate(travelDate);
  if (!parsedDate) throw badRequest("Tarih formatı geçersiz (DD MM YYYY)");

  if (isPastDate(travelDate))
    throw badRequest("Geçmiş tarih için arama başlatılamaz");

  if (!Array.isArray(tripList) || tripList.length === 0) {
    throw badRequest("En az bir sefer seçilmelidir", "EMPTY_TRIP_LIST");
  }

  const invalidTrip = tripList.some(
    (trip) => !Number.isFinite(Number(trip?.trainId)) || !trip?.departureTime,
  );

  if (invalidTrip) {
    throw badRequest("Sefer listesi geçersiz", "INVALID_TRIP_LIST");
  }

  const MAX_ACTIVE_SEARCH = 5;

  const activeSearchCount = await Search.countDocuments({
    userId,
    isActive: true,
    found: false,
  });

  if (activeSearchCount >= MAX_ACTIVE_SEARCH) {
    throw badRequest(
      "Aynı anda en fazla 5 aktif arama başlatılabilir",
      "ACTIVE_SEARCH_LIMIT",
    );
  }

  const trainIds = tripList.map((t) => Number(t.trainId));

  const exists = await Search.findOne({
    userId,
    fromStationCode,
    toStationCode,
    seatType,
    travelDate,
    isActive: true,
    found: false,
    "tripList.trainId": { $all: trainIds },
    tripList: { $size: tripList.length },
  }).lean();

  if (exists) {
    const err = new Error(
      "Bu rota, tarih, koltuk tipi ve seferler için zaten aktif bir arama var",
    );
    err.statusCode = 409;
    err.code = "DUPLICATE_SEARCH";
    throw err;
  }

  const search = new Search({
    userId,
    fromStationCode,
    toStationCode,
    seatType,
    travelDate,
    tripList: tripList.map((t) => ({
      trainId: Number(t.trainId),
      departureTime: String(t.departureTime),
    })),
  });

  await search.save();
  return search;
};

const closeSearch = async (searchId, stopReason, { found = false } = {}) => {
  const search = await Search.findById(searchId);
  if (!search) throw notFoundError();

  if (!search.isActive) return search;

  search.isActive = false;
  if (found) search.found = true;
  search.stopReason = stopReason;
  await search.save();

  return search;
};

export const foundSearch = async (searchId) =>
  closeSearch(searchId, "FOUND", { found: true });

export const stopSearch = async (searchId) =>
  closeSearch(searchId, "USER_STOP");

export const stopErrorSearch = async (searchId) =>
  closeSearch(searchId, "ERROR");

export const stopDatePassedSearch = async (searchId) =>
  closeSearch(searchId, "DATE_PASSED");
