import { NextFunction, Response, Request } from "express";
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/config");

export default function userMiddleWare(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers["token"];

    if (!token) {
      res.status(401).json({
        message: "Authentication token is required",
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || !decoded.userId) {
      res.status(401).json({
        message: "Invalid authentication token",
      });
      return;
    }

    req.userId = decoded.userId;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({
        message: "Token has expired. Please login again",
      });
      return;
    }
    if (error.name === "JsonWebTokenError") {
      res.status(401).json({
        message: "Invalid token. Please login again",
      });
      return;
    }
    console.error("Auth middleware error:", error);
    res.status(500).json({
      message: "Authentication error",
    });
    return;
  }
}
