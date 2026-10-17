const express = require("express");
const orderSummary = require("./mock-data/order-summary.json");
const productCatalog = require("./mock-data/product-catalog.json");
const updateOrder = require("./mock-data/update-order.json");
const notFound = require("./mock-data/errors/not-found.json");
const badRequest = require("./mock-data/errors/bad-request.json");
const serverError = require("./mock-data/errors/server-error.json");

const app = express();
const PORT = 3000;

// Special ids trigger a specific error response, so k6 can mix in negative
// scenarios on purpose instead of only ever hitting the happy path.
const ERROR_TRIGGERS = {
  "quote-404": { status: 404, body: notFound },
  "quote-400": { status: 400, body: badRequest },
  "quote-500": { status: 500, body: serverError },
};

app.get("/order-summary/:orderId", (req, res) => {
  const trigger = ERROR_TRIGGERS[req.params.orderId];
  if (trigger) {
    return res.status(trigger.status).json(trigger.body);
  }
  res.status(200).json(orderSummary);
});

app.get("/product-catalog/:productFamily", (req, res) => {
  const trigger = ERROR_TRIGGERS[req.params.productFamily];
  if (trigger) {
    return res.status(trigger.status).json(trigger.body);
  }
  res.status(200).json(productCatalog);
});

app.post("/update-order/:orderId", (req, res) => {
  const trigger = ERROR_TRIGGERS[req.params.orderId];
  if (trigger) {
    return res.status(trigger.status).json(trigger.body);
  }
  res.status(200).json(updateOrder);
});

app.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
});
