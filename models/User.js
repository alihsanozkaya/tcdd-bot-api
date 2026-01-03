import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    telegramId: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);