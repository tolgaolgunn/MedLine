const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/forgot-password", userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
router.get("/profile", auth, userController.getProfile);
router.put("/profile", auth, userController.updateProfile);
router.put("/change-password", auth, userController.changePassword);

module.exports = router;
