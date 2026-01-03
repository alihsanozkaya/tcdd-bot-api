import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
  mongoose
    .connect(process.env.MONGO_URI, { dbName: "tcdd" })
    .then(() => console.log("✅ MongoDB bağlı"))
    .catch((err) => console.error("❌ Mongo bağlantı hatası:", err));
};

export default connectDB;
