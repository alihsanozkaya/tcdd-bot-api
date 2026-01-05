import mongoose from "mongoose";

const tripSchema = new mongoose.Schema({
  tripId: { type: String, required: true },
  departureTime: { type: String, required: true }
}, { _id: false });

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
  tripList: [tripSchema],
  isActive: { type: Boolean, default: true },
  found: { type: Boolean, default: false },
  lastCheckedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Search", searchSchema);
