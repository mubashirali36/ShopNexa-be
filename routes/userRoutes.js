const express = require("express");
const { getUsers, getUserById, updateUser, deleteUser } = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", protect, admin, getUsers);
router.get("/:id", protect, getUserById);
router.put("/:id", protect, updateUser);
router.delete("/:id", protect, admin, deleteUser);

module.exports = router;
