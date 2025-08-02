const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");

// ✅ Login Routes
router.get("/login-secret", adminController.getLoginPage);
router.post("/login-secret", adminController.login);

// ✅ Logout
router.get("/logout", adminController.logout);

// ✅ Dashboard Tabs
router.get("/dashboard", adminController.isAuthenticated, adminController.getDashboard);
router.get("/delivering", adminController.isAuthenticated, adminController.getDeliveringOrders);
router.get("/history", adminController.isAuthenticated, adminController.getDoneOrders);

// ✅ Order Actions
router.post("/cancel/:id", adminController.isAuthenticated, adminController.cancelOrder);
router.post("/deliver/:id", adminController.isAuthenticated, adminController.markAsDelivering);
router.post("/done/:id", adminController.isAuthenticated, adminController.markAsDone);
router.post("/delete/:id", adminController.isAuthenticated, adminController.deleteFromHistory);

// ✅ Clear Entire History
router.post("/clear-history", adminController.isAuthenticated, adminController.clearHistory);

module.exports = router;
