import mongoose from "mongoose";

const seatSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

export default mongoose.model("Seat", seatSchema);
