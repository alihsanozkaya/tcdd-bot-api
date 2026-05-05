import express from "express";
import serverless from "serverless-http";
import dotenv from "dotenv";

import connectDB from "../../config/database.js";
import usersRoute from "../../routes/users.js";
import seatsRoute from "../../routes/seats.js";
import stationsRoute from "../../routes/stations.js";
import searchesRoute from "../../routes/searches.js";

dotenv.config();

const app = express();
app.use(express.json());

let isConnected = false;

app.use(async (req, res, next) => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  next();
});

app.get("/", (req, res) => res.json({ status: "ok" }));

app.use("/api/searches", searchesRoute);
app.use("/api/seats", seatsRoute);
app.use("/api/stations", stationsRoute);
app.use("/api/users", usersRoute);

export const handler = serverless(app);