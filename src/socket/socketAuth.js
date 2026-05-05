import { verifyAccessToken } from "../helpers/tokenHelper.js";
import User from "../models/user.model.js";

const socketAuth = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select(
      "name email role profileImage address"
    );

    if (!user) {
      return next(new Error("Unauthorized"));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Unauthorized"));
  }
};

export default socketAuth;
