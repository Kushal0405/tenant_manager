import mongoose from "mongoose";
import { env } from "../config/env.js";

export async function connectDb(): Promise<void> {
  mongoose.connection.on("connected", () => {
    console.log("[db] connected to MongoDB");
  });
  mongoose.connection.on("error", (err) => {
    console.error("[db] connection error:", err.message);
  });

  try {
    await mongoose.connect(env.mongodbUri);
  } catch (err) {
    console.error(
      "[db] failed to connect. The API server will keep running so you can develop, " +
        "but any request that touches the database will fail until MONGODB_URI in " +
        "apps/backend/.env points at a real MongoDB instance.",
    );
    console.error("[db]", (err as Error).message);
  }
}
