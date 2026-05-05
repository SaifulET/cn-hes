import mongoose from "mongoose";
import { env } from "./env.js";

const connectDB = async () => {
  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is missing in the environment variables.");
  }

  await mongoose.connect(env.mongodbUri);
  console.log("MongoDB connected successfully");
};

export default connectDB;
