import mongoose from "mongoose";

const searchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  stopReason: {
    type: String,
    enum: ["FOUND", "USER_STOP", "DATE_PASSED", "ERROR"],
    default: null,
  },
  fromStationCode: { type: String, required: true },
  toStationCode: { type: String, required: true },
  travelDate: { type: String, required: true },
  seatType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seat",
    required: true,
  },
  tripList: { type: [String], required: true },
  isActive: { type: Boolean, default: true },
  found: { type: Boolean, default: false },
  lastCheckedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Search", searchSchema);
