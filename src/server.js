import app from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import { env } from "./config/env.js";
import { registerChatSocket } from "./socket/chat.socket.js";
import { setSocketIO } from "./socket/io.js";

const startServer = async () => {
  try {
    await connectDB();

    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: "*"
      }
    });

    setSocketIO(io);
    registerChatSocket(io);

    httpServer.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
