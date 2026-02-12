import Search from "../models/Search.js";
import { isPastDate, parseTravelDate } from "../utils/dateUtils.js";

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
  if (fromStationCode == toStationCode) {
    const err = new Error("Kalkış ve varış istasyonları aynı olamaz");
    err.code = "SAME_STATION_ERROR";
    throw err;
  }

  const parsedDate = parseTravelDate(travelDate);
  if (!parsedDate) throw new Error("Tarih formatı geçersiz (DD MM YYYY)");

  if (isPastDate(travelDate))
    throw new Error("Geçmiş tarih için arama başlatılamaz");

  const MAX_ACTIVE_SEARCH = 5;

  const activeSearchCount = await Search.countDocuments({
    userId,
    isActive: true,
    found: false,
  });

  if (activeSearchCount >= MAX_ACTIVE_SEARCH) {
    const err = new Error("Aynı anda en fazla 5 aktif arama başlatılabilir");
    err.code = "ACTIVE_SEARCH_LIMIT";
    throw err;
  }
  const trainIds = tripList.map((t) => t.trainId);

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
      "Bu rota, tarih, koltuk tipi ve seferler için zaten aktif bir arama var"
    );
    err.statusCode = 409;
    throw err;
  }

  const search = new Search({
    userId,
    fromStationCode,
    toStationCode,
    seatType,
    travelDate,
    tripList,
  });

  await search.save();
  return search;
};

export const foundSearch = async (searchId) => {
  const search = await Search.findById(searchId);
  if (!search) return null;

  if (!search.isActive) throw new Error("Bu arama zaten bulunmuş");

  search.isActive = false;
  search.found = true;
  search.stopReason = "FOUND";
  await search.save();

  return search;
};

export const stopSearch = async (searchId) => {
  const search = await Search.findById(searchId);
  if (!search) throw new Error("Arama bulunamadı");

  if (!search.isActive) throw new Error("Bu arama zaten durdurulmuş");

  search.isActive = false;
  search.stopReason = "USER_STOP";
  await search.save();

  return search;
};

export const stopErrorSearch = async (searchId) => {
  const search = await Search.findById(searchId);
  if (!search) throw new Error("Arama bulunamadı");

  if (!search.isActive) throw new Error("Bu arama zaten durdurulmuş");

  search.isActive = false;
  search.stopReason = "ERROR";
  await search.save();

  return search;
};

export const stopDatePassedSearch = async (searchId) => {
  const search = await Search.findById(searchId);
  if (!search) throw new Error("Arama bulunamadı");

  if (!search.isActive) throw new Error("Bu arama zaten durdurulmuş");

  search.isActive = false;
  search.stopReason = "DATE_PASSED";
  await search.save();

  return search;
};
