import Station from "../models/Station.js";
import Search from "../models/Search.js";

export const getAllStations = async () => {
  return Station.find()
    .collation({ locale: "tr", strength: 1 })
    .sort({ name: 1 });
};

export const createStation = async (code, name) => {
  const exists = await Station.findOne({
    $or: [{ code }, { name }],
  });

  if (exists) throw new Error("Bu kodda veya isimde istasyon zaten var");

  const station = new Station({ code, name });
  await station.save();
  return station;
};

export const updateStation = async (stationId, newCode, newName) => {
  const station = await Station.findById(stationId);
  if (!station) throw new Error("İstasyon bulunamadı");

  const exists = await Station.findOne({
    $or: [{ code: newCode }, { name: newName }],
    _id: { $ne: stationId },
  });

  if (exists) throw new Error("Bu kodda veya isimde başka bir istasyon var");

  station.code = newCode;
  station.name = newName;

  await station.save();
  return station;
};

export const deleteStation = async (stationId) => {
  const station = await Station.findById(stationId);
  if (!station) throw new Error("İstasyon bulunamadı");

  const used = await Search.exists({
    fromStationId: stationId,
    toStationId: stationId,
    isActive: true,
  });
  if (used) throw new Error("Bu istasyon aktif aramalarda kullanılıyor");

  await Station.deleteOne({ _id: stationId });
  return true;
};
