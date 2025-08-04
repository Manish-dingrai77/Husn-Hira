const Order = require("../models/order");
const mongoose = require("mongoose");
const { createRazorpayInstance } = require("../config/razorpay.config");
const crypto = require("crypto");
const { Parser } = require("json2csv");
const ExcelJS = require("exceljs");
require("dotenv").config();

const razorpayInstance = createRazorpayInstance();

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

// Middleware: Admin auth check
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.adminLoggedIn) {
    console.log("✅ Authenticated as admin");
    return next();
  }
  console.log("❌ Not authenticated, redirecting to login");
  return res.redirect("/admin-portal-1024/login-secret");
};

// Escape input for RegExp
const escapeRegex = (str) => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

// Build search + date query
const buildSearchQuery = (status, search, date) => {
  const query = { status };

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [
      { name: regex },
      { mobile_number: regex },
      { orderId: regex },
      { payment_id: regex }
    ];
  }

  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    query.date = { $gte: start, $lt: end };
  }

  return query;
};

// Create Razorpay order
exports.createOrder = async (req, res) => {
  const { name, address, mobile_number, alternate_number, coupon } = req.body;
  try {
    if (!name || !address || !mobile_number) {
      return res.status(400).json({ success: false, msg: "Missing required fields" });
    }

    let amount = 249;
    if (coupon && coupon.toUpperCase() === "HUSN40") {
      amount = Math.floor(amount * 0.6);
    }

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpayInstance.orders.create(options);
    return res.status(200).json(order);
  } catch (err) {
    console.error("❌ Razorpay order creation failed:", err);
    return res.status(500).json({ success: false, msg: "Failed to create Razorpay order" });
  }
};

// Verify Razorpay payment and save order
exports.verifyPayment = async (req, res) => {
  const { name, address, mobile_number, alternate_number, coupon, order_id, payment_id, signature } = req.body;
  try {
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${order_id}|${payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({ success: false, msg: "Invalid Payment Signature" });
    }

    const isDiscounted = coupon?.toUpperCase() === "HUSN40";
    const price = isDiscounted ? 149 : 249;

    const newOrder = new Order({
      name,
      address,
      mobile_number,
      alternate_number,
      coupon,
      orderId: order_id,
      payment_id,
      price,
      status: "pending",
      date: new Date()
    });

    await newOrder.save();
    return res.status(200).json({ success: true, msg: "Payment verified and order saved successfully" });
  } catch (err) {
    console.error("❌ Payment verification or DB save failed:", err);
    return res.status(500).json({ success: false, msg: "Server error while verifying payment or saving order" });
  }
};

// Admin Login Pages
exports.getLoginPage = (req, res) => {
  res.render("login", { error: null });
};

exports.login = (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
   req.session.isAdmin = true;  
    return res.redirect("/admin-portal-1024/dashboard");
  }
  res.render("login", { error: "Invalid credentials" });
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin-portal-1024/login-secret");
  });
};

// Chart Aggregation
async function getChartAggregation(status) {
  const aggregation = await Order.aggregate([
    { $match: { status } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        totalOrders: { $sum: 1 },
        totalRevenue: {
          $sum: {
            $cond: [{ $eq: ["$coupon", "HUSN40"] }, 149, 249]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    labels: aggregation.map(i => i._id),
    orders: aggregation.map(i => i.totalOrders),
    revenue: aggregation.map(i => i.totalRevenue)
  };
}

// Dashboard Tabs
exports.getDashboard = async (req, res) => {
  try {
    const { search, date } = req.query;
    const query = buildSearchQuery("pending", search, date);
    const orders = await Order.find(query).sort({ date: -1 });
    const chartData = await getChartAggregation("pending");
    res.render("dashboard", { orders, currentTab: "pending", search, selectedDate: date, chartData });
  } catch (err) {
    console.error("❌ Failed to fetch pending orders:", err);
    res.status(500).send("Failed to fetch orders");
  }
};

exports.getDeliveringOrders = async (req, res) => {
  try {
    const { search, date } = req.query;
    const query = buildSearchQuery("delivering", search, date);
    const orders = await Order.find(query).sort({ date: -1 });
    const chartData = await getChartAggregation("delivering");
    res.render("dashboard", { orders, currentTab: "delivering", search, selectedDate: date, chartData });
  } catch (err) {
    console.error("❌ Failed to fetch delivering orders:", err);
    res.status(500).send("Failed to fetch delivering orders");
  }
};

exports.getDoneOrders = async (req, res) => {
  try {
    const { search, date } = req.query;
    const query = buildSearchQuery("done", search, date);
    const orders = await Order.find(query).sort({ date: -1 });
    const chartData = await getChartAggregation("done");
    res.render("dashboard", { orders, currentTab: "done", search, selectedDate: date, chartData });
  } catch (err) {
    console.error("❌ Failed to fetch done orders:", err);
    res.status(500).send("Failed to fetch completed orders");
  }
};

// Order Status Actions
exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).send("Invalid order ID");

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).send("Order not found");

    await Order.findByIdAndDelete(orderId);
    res.redirect(getRedirectPath(order.status));
  } catch (err) {
    console.error("❌ Failed to cancel order:", err);
    res.status(500).send("Failed to cancel order");
  }
};

exports.markAsDelivering = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).send("Invalid order ID");

    await Order.findByIdAndUpdate(orderId, { status: "delivering" });
    res.redirect("/admin-portal-1024/dashboard");
  } catch (err) {
    console.error("❌ Failed to mark as delivering:", err);
    res.status(500).send("Failed to update order status");
  }
};

exports.markAsDone = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).send("Invalid order ID");

    await Order.findByIdAndUpdate(orderId, { status: "done" });
    res.redirect("/admin-portal-1024/delivering");
  } catch (err) {
    console.error("❌ Failed to mark as done:", err);
    res.status(500).send("Failed to mark order as done");
  }
};

exports.deleteFromHistory = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).send("Invalid order ID");

    await Order.findByIdAndDelete(orderId);
    res.redirect("/admin-portal-1024/history");
  } catch (err) {
    console.error("❌ Failed to delete from history:", err);
    res.status(500).send("Failed to delete order from history");
  }
};

exports.clearHistory = async (req, res) => {
  try {
    await Order.deleteMany({ status: "done" });
    res.redirect("/admin-portal-1024/history");
  } catch (err) {
    console.error("❌ Failed to clear history:", err);
    res.status(500).send("Failed to clear history");
  }
};

// Helper: Redirect path by order status
function getRedirectPath(status) {
  switch (status) {
    case "delivering": return "/admin-portal-1024/delivering";
    case "done": return "/admin-portal-1024/history";
    default: return "/admin-portal-1024/dashboard";
  }
}

// API: External chart data
exports.getChartData = async (req, res) => {
  try {
    const allOrders = await Order.find().sort({ date: 1 });
    const chartDataMap = {};

    allOrders.forEach(order => {
      const dateKey = order.date.toISOString().slice(0, 10);
      if (!chartDataMap[dateKey]) chartDataMap[dateKey] = { orders: 0, revenue: 0 };
      chartDataMap[dateKey].orders += 1;
      chartDataMap[dateKey].revenue += order.coupon?.toUpperCase() === "HUSN40" ? 149 : 249;
    });

    const labels = Object.keys(chartDataMap);
    const orders = labels.map(d => chartDataMap[d].orders);
    const revenue = labels.map(d => chartDataMap[d].revenue);

    res.json({ labels, orders, revenue });
  } catch (err) {
    console.error("❌ Failed to generate chart data:", err);
    res.status(500).json({ success: false, msg: "Failed to generate chart data" });
  }
};

// CSV Export
exports.exportCSV = async (req, res) => {
  try {
    const { type } = req.query;
    let filter = {};

    if (type === "delivered") {
      filter.status = "delivering";
    } else if (type === "done") {
      filter.status = "done";
    }

    const orders = await Order.find(filter).lean();
    if (!orders.length) return res.status(404).send("No orders found to export");

    const fields = [
      "name", "address", "mobile_number", "alternate_number",
      "coupon", "orderId", "payment_id", "status", "date"
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(orders);

    res.header("Content-Type", "text/csv");
    res.attachment(`orders-${type || "all"}-${Date.now()}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error("❌ CSV Export Failed:", err);
    res.status(500).send("Error exporting CSV");
  }
};

// Excel Export
exports.exportExcel = async (req, res, statusType) => {
  try {
    let filter = {};
    if (statusType === "delivering") {
      filter.status = "delivering";
    } else if (statusType === "done") {
      filter.status = "done";
    }

    const orders = await Order.find(filter).lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Orders");

    worksheet.columns = [
      { header: "Name", key: "name", width: 20 },
      { header: "Address", key: "address", width: 40 },
      { header: "Mobile Number", key: "mobile_number", width: 15 },
      { header: "Alternate Number", key: "alternate_number", width: 15 },
      { header: "Payment Mode", key: "paymentMethod", width: 15 },
      { header: "Price (₹)", key: "price", width: 12 },
      { header: "Order ID", key: "orderId", width: 25 },
      { header: "Transaction ID", key: "payment_id", width: 30 },
      { header: "Coupon", key: "coupon", width: 15 },
      { header: "Status", key: "status", width: 12 },
      { header: "Date", key: "date", width: 25 }
    ];

    orders.forEach((order) => {
      worksheet.addRow({
        name: order.name,
        address: order.address,
        mobile_number: order.mobile_number,
        alternate_number: order.alternate_number || "N/A",
        paymentMethod: order.paymentMethod || "N/A",
        price: order.price || (order.coupon?.toUpperCase() === "HUSN40" ? 149 : 249),
        orderId: order.orderId || order._id.toString(),
        payment_id: order.payment_id || "N/A",
        coupon: order.coupon || "Not Applied",
        status: order.status,
        date: new Date(order.date).toLocaleString("en-IN")
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
        cell.alignment = { wrapText: true, vertical: "top" };
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=orders-${statusType || "all"}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("❌ Excel Export Failed:", err);
    res.status(500).send("Error exporting Excel file");
  }
};
