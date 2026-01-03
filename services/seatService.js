import Seat from "../models/Seat.js";
import Search from "../models/Search.js";

export const getAllSeats = async () => {
  return Seat.find().collation({ locale: "tr", strength: 1 }).sort({ name: 1 });
};

export const createSeat = async (name) => {
  const exists = await Seat.findOne({ name });
  if (exists) throw new Error("Bu kodda veya isimde koltuk zaten var");

  const seat = new Seat({ name });
  await seat.save();
  return seat;
};

export const updateSeat = async (seatId, newName) => {
  const seat = await Seat.findById(seatId);
  if (!seat) throw new Error("Koltuk bulunamadı");

  const exists = await Seat.findOne({
    name: newName,
    _id: { $ne: seatId },
  });

  if (exists) throw new Error("Bu kodda veya isimde başka bir koltuk var");

  seat.name = newName;

  await seat.save();
  return seat;
};

export const deleteSeat = async (seatId) => {
  const seat = await Seat.findById(seatId);
  if (!seat) throw new Error("Koltuk bulunamadı");

  const used = await Search.exists({ seatType: seatId, isActive: true });
  if (used) throw new Error("Bu koltuk aktif aramalarda kullanılıyor");

  await Seat.deleteOne({ _id: seatId });
  return true;
};
