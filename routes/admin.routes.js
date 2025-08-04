const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");

// ✅ Middleware to check session login
function isAdminLoggedIn(req, res, next) {
  if (req.session.isAdmin) return next();
  return res.redirect("/admin-portal-1024/login-secret");
}

// ✅ Login Routes
router.get("/login-secret", adminController.getLoginPage);
router.post("/login-secret", adminController.login);

// ✅ Logout
router.get("/logout", adminController.logout);

// ✅ Dashboard Tabs
router.get("/dashboard", isAdminLoggedIn, adminController.getDashboard);
router.get("/delivering", isAdminLoggedIn, adminController.getDeliveringOrders);
router.get("/history", isAdminLoggedIn, adminController.getDoneOrders);

// ✅ Order Actions
router.post("/cancel/:id", isAdminLoggedIn, adminController.cancelOrder);
router.post("/deliver/:id", isAdminLoggedIn, adminController.markAsDelivering);
router.post("/done/:id", isAdminLoggedIn, adminController.markAsDone);
router.post("/delete/:id", isAdminLoggedIn, adminController.deleteFromHistory);

// ✅ Clear Entire History
router.post("/clear-history", isAdminLoggedIn, adminController.clearHistory);

// ✅ Chart Data API
router.get("/chart-data", isAdminLoggedIn, adminController.getChartData);

// ✅ CSV Export (Old)
router.get("/export/csv", isAdminLoggedIn, adminController.exportCSV);

// ✅ Excel Export (NEW & CLEAN)
router.get("/export/excel/all", isAdminLoggedIn, (req, res) =>
  adminController.exportExcel(req, res, "all")
);
router.get("/export/excel/delivering", isAdminLoggedIn, (req, res) =>
  adminController.exportExcel(req, res, "delivering")
);
router.get("/export/excel/history", isAdminLoggedIn, (req, res) =>
  adminController.exportExcel(req, res, "done")
);

module.exports = router;
