// middlewares/sanitize.js

function sanitizeObject(obj) {
  if (typeof obj !== "object" || obj === null) return obj;
  for (const key in obj) {
    if (typeof obj[key] === "object") {
      sanitizeObject(obj[key]);
    }
    if (key.includes("$") || key.includes(".")) {
      const newKey = key.replace(/\$/g, "_").replace(/\./g, "_");
      obj[newKey] = obj[key];
      delete obj[key];
    }
  }
  return obj;
}

module.exports = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};
