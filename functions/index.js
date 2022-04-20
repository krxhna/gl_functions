const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const Stripe = require('stripe')
const stripe = Stripe('sk_test_51KVYQaSIL2080LSuRHgmNa2n4ornRFeKnpfPJjys8jVdLmd1v8IA91179gGVyVkj7HXtXAzU96c69vokNqlUdGMN00PWlzesKG');



const app = express();
app.use(cors({ origin: true }));

app.get("/", (req, res) => {
  res.send("Hello from nice nice!");
});

app.post("/session", async(req, res) => {
  const payload = {
    success_url: req.body.success_url,
    cancel_url: req.body.cancel_url,
    payment_method_types: req.body.payment_method_types,
    line_items: req.body.line_items,
    mode: req.body.mode,
    client_reference_id: req.body.client_reference_id,
    customer: req.body.customer,
    customer_email: req.body.customer_email,
    metadata: req.body.metadata,
  };
  const session = await stripe.checkout.sessions.create(payload);
  res.send(session);
});

app.get("/meow", (req, res) => {
  res.send("Hello from meow!");
});


exports.expressApi = functions.https.onRequest(app);
