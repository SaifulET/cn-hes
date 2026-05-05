import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.accessTokenSecret, {
    expiresIn: env.accessTokenExpiresIn
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenExpiresIn
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.accessTokenSecret);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.refreshTokenSecret);
};
