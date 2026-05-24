const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const searchHistoryRoutes = require("./routes/searchHistoryRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/instagram_search";

// Middleware
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/search/history", searchHistoryRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Fallback (Local JSON DB Mode)",
  });
});

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
  });
};

// Database connection & Server start
console.log("Connecting to MongoDB at:", MONGODB_URI);
mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 2500, // Timeout after 2.5 seconds to fall back quickly if local MongoDB is offline
  })
  .then(() => {
    console.log("Connected to MongoDB successfully.");
    startServer();
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    console.warn("Express server will start in Fallback Mode using local JSON storage.");
    startServer();
  });
