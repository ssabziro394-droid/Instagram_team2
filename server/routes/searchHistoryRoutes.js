const express = require("express");
const router = express.Router();
const controller = require("../controllers/searchHistoryController");
const auth = require("../middleware/auth");

// Base path is /search/history
router.get("/", auth, controller.getHistory);
router.post("/", auth, controller.saveHistory);
router.delete("/:id", auth, controller.deleteHistoryItem);
router.delete("/", auth, controller.clearHistory);

module.exports = router;
