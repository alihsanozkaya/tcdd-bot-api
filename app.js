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

app.use("/api/searches", searchesRoute);
app.use("/api/seats", seatsRoute);
app.use("/api/stations", stationsRoute);
app.use("/api/users", usersRoute);

const port = process.env.PORT || 5003;
app.listen(port, () => console.log(`Server başlatıldı ${port}`));
