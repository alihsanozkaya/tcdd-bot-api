import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import usersRoute from "./routes/users.js";
import seatsRoute from "./routes/seats.js";
import stationsRoute from "./routes/stations.js";
import searchesRoute from "./routes/searches.js";

dotenv.config();
const app = express();
app.use(express.json());

await connectDB();

app.get("/", (req, res) => res.json({ status: "ok" }));

app.use("/api/searches", searchesRoute);
app.use("/api/seats", seatsRoute);
app.use("/api/stations", stationsRoute);
app.use("/api/users", usersRoute);

app.use((req, res) => res.status(404).json({ message: "Bulunamadı" }));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  const status = Number(err?.status) || Number(err?.statusCode) || 500;
  if (status >= 500) console.error("[APP ERROR]", err?.message || err);

  return res.status(status).json({
    message: err?.message || "Beklenmeyen hata",
  });
});

const port = process.env.PORT || 5003;
app.listen(port, "0.0.0.0", () => console.log(`Server başlatıldı ${port}`));
