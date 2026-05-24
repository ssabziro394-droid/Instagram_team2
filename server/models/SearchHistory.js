const mongoose = require("mongoose");

const SearchHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["user", "query"],
    required: true,
  },
  // Field for query type searches
  query: {
    type: String,
    default: null,
  },
  // Fields for user type searches
  user: {
    id: { type: String, default: null },
    username: { type: String, default: null },
    fullname: { type: String, default: null },
    avatar: { type: String, default: null },
    followers: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexing by userId and createdAt for fast queries sorted chronologically
SearchHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("SearchHistory", SearchHistorySchema);
