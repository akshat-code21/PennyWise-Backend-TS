import dotenv from "dotenv";
dotenv.config();

import express from "express"
import cors from "cors"
import "./models/index";
import authRouter from "./routes/auth";
import expenseRouter from "./routes/expense"
import insightsRouter from "./routes/insights"

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/expenses", expenseRouter);
app.use("/api/v1/insights", insightsRouter);
app.listen(3000, () => {
  console.log("server is up on port 3000");
});