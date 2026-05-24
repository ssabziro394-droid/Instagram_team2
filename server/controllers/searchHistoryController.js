const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const SearchHistory = require("../models/SearchHistory");

const JSON_DB_PATH = path.join(__dirname, "../history-db.json");

// Helper to check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// JSON database helper functions for local fallback
const readJsonDb = () => {
  try {
    if (!fs.existsSync(JSON_DB_PATH)) {
      return [];
    }
    const data = fs.readFileSync(JSON_DB_PATH, "utf8");
    return JSON.parse(data || "[]");
  } catch (e) {
    console.error("Error reading fallback JSON database:", e);
    return [];
  }
};

const writeJsonDb = (data) => {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing fallback JSON database:", e);
  }
};

// Format Mongoose document or plain JSON item to match required client response structure
const formatHistoryItem = (item) => {
  const id = item._id ? item._id.toString() : item.id;
  const formatted = {
    id: String(id),
    type: item.type,
    createdAt: Math.floor(new Date(item.createdAt).getTime() / 1000), // UNIX timestamp in seconds
  };

  if (item.type === "query") {
    formatted.query = item.query;
  } else if (item.type === "user") {
    formatted.user = {
      id: String(item.user.id),
      username: item.user.username,
      fullname: item.user.fullname,
      avatar: item.user.avatar,
      followers: item.user.followers,
      isVerified: item.user.isVerified,
    };
  }

  return formatted;
};

// GET /search/history
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    if (isMongoConnected()) {
      const history = await SearchHistory.find({ userId })
        .sort({ createdAt: -1 })
        .exec();
      return res.json(history.map(formatHistoryItem));
    } else {
      console.warn("MongoDB offline, using fallback JSON database");
      const all = readJsonDb();
      const userHistory = all
        .filter((x) => String(x.userId) === String(userId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.json(userHistory.map(formatHistoryItem));
    }
  } catch (error) {
    console.error("Error fetching search history:", error);
    res.status(500).json({ message: "Server error fetching search history" });
  }
};

// POST /search/history
exports.saveHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, query, user } = req.body;

    if (!type || (type !== "query" && type !== "user")) {
      return res.status(400).json({ message: "Invalid type. Must be 'query' or 'user'" });
    }

    if (isMongoConnected()) {
      let existingItem = null;

      if (type === "query") {
        if (!query || typeof query !== "string") {
          return res.status(400).json({ message: "Query string is required for 'query' type" });
        }
        
        const trimmedQuery = query.trim();
        existingItem = await SearchHistory.findOne({
          userId,
          type: "query",
          query: trimmedQuery,
        });

        if (existingItem) {
          existingItem.createdAt = new Date();
          await existingItem.save();
        } else {
          existingItem = await SearchHistory.create({
            userId,
            type: "query",
            query: trimmedQuery,
          });
        }
      } else if (type === "user") {
        if (!user || !user.id) {
          return res.status(400).json({ message: "User object with id is required for 'user' type" });
        }

        existingItem = await SearchHistory.findOne({
          userId,
          type: "user",
          "user.id": String(user.id),
        });

        if (existingItem) {
          existingItem.user = {
            id: String(user.id),
            username: user.username ?? "",
            fullname: user.fullname ?? "",
            avatar: user.avatar ?? null,
            followers: Number(user.followers) || 0,
            isVerified: !!user.isVerified,
          };
          existingItem.createdAt = new Date();
          await existingItem.save();
        } else {
          existingItem = await SearchHistory.create({
            userId,
            type: "user",
            user: {
              id: String(user.id),
              username: user.username ?? "",
              fullname: user.fullname ?? "",
              avatar: user.avatar ?? null,
              followers: Number(user.followers) || 0,
              isVerified: !!user.isVerified,
            },
          });
        }
      }
      return res.status(201).json(formatHistoryItem(existingItem));
    } else {
      console.warn("MongoDB offline, using fallback JSON database");
      const all = readJsonDb();
      let matchedItem = null;

      if (type === "query") {
        const trimmedQuery = query.trim();
        matchedItem = all.find(
          (x) => String(x.userId) === String(userId) && x.type === "query" && x.query === trimmedQuery
        );

        if (matchedItem) {
          matchedItem.createdAt = new Date().toISOString();
        } else {
          matchedItem = {
            id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            userId: String(userId),
            type: "query",
            query: trimmedQuery,
            createdAt: new Date().toISOString(),
          };
          all.push(matchedItem);
        }
      } else if (type === "user") {
        matchedItem = all.find(
          (x) => String(x.userId) === String(userId) && x.type === "user" && x.user && String(x.user.id) === String(user.id)
        );

        if (matchedItem) {
          matchedItem.user = {
            id: String(user.id),
            username: user.username ?? "",
            fullname: user.fullname ?? "",
            avatar: user.avatar ?? null,
            followers: Number(user.followers) || 0,
            isVerified: !!user.isVerified,
          };
          matchedItem.createdAt = new Date().toISOString();
        } else {
          matchedItem = {
            id: `u-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            userId: String(userId),
            type: "user",
            user: {
              id: String(user.id),
              username: user.username ?? "",
              fullname: user.fullname ?? "",
              avatar: user.avatar ?? null,
              followers: Number(user.followers) || 0,
              isVerified: !!user.isVerified,
            },
            createdAt: new Date().toISOString(),
          };
          all.push(matchedItem);
        }
      }

      writeJsonDb(all);
      return res.status(201).json(formatHistoryItem(matchedItem));
    }
  } catch (error) {
    console.error("Error saving search history:", error);
    res.status(500).json({ message: "Server error saving search history" });
  }
};

// DELETE /search/history/:id
exports.deleteHistoryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (isMongoConnected()) {
      const result = await SearchHistory.findOneAndDelete({
        _id: id,
        userId,
      });

      if (!result) {
        return res.status(404).json({ message: "Search history item not found" });
      }
      return res.json({ message: "Search history item deleted successfully", id });
    } else {
      console.warn("MongoDB offline, using fallback JSON database");
      let all = readJsonDb();
      const index = all.findIndex((x) => String(x.id) === String(id) && String(x.userId) === String(userId));

      if (index === -1) {
        return res.status(404).json({ message: "Search history item not found" });
      }

      all.splice(index, 1);
      writeJsonDb(all);
      return res.json({ message: "Search history item deleted successfully", id });
    }
  } catch (error) {
    console.error("Error deleting search history item:", error);
    res.status(500).json({ message: "Server error deleting search history item" });
  }
};

// DELETE /search/history
exports.clearHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    if (isMongoConnected()) {
      await SearchHistory.deleteMany({ userId });
      return res.json({ message: "Search history cleared successfully" });
    } else {
      console.warn("MongoDB offline, using fallback JSON database");
      let all = readJsonDb();
      all = all.filter((x) => String(x.userId) !== String(userId));
      writeJsonDb(all);
      return res.json({ message: "Search history cleared successfully" });
    }
  } catch (error) {
    console.error("Error clearing search history:", error);
    res.status(500).json({ message: "Server error clearing search history" });
  }
};
