import mongoose from "mongoose";

const stationSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
});

export default mongoose.model("Station", stationSchema);
