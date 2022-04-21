const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const stripe = Stripe(
  "sk_test_51KVYQaSIL2080LSuRHgmNa2n4ornRFeKnpfPJjys8jVdLmd1v8IA91179gGVyVkj7HXtXAzU96c69vokNqlUdGMN00PWlzesKG"
);

const app = express();
app.use(cors({ origin: "*"}));
app.use(cors({ origin: true}));

//initalize firebase
admin.initializeApp(functions.config().firebase);

app.get("/", (req, res) => {
  res.send("Hello from nice nice!");
});

app.post("/session", async (req, res) => {
  const payload = {
    success_url: "http://localhost:3000/test/success",
    cancel_url: "http://localhost:3000/test/cancel",
    // payment_method_types: req.body.payment_method_types,
    line_items: [
      {
        price: "price_1KqnucSIL2080LSu4CmXY9tU", // The id of the one-time price you created in your Stripe dashboard
        quantity: 1,
      },
    ],
    mode: "subscription",
    // client_reference_id: req.body.client_reference_id,
    // customer: req.body.customer,
    customer_email: req.body.customer_email,
    // metadata: req.body.metadata,
  };
  const session = await stripe.checkout.sessions.create(payload);
  admin.firestore().collection("sessions").add(session);
  res.send(session);
  
});


app.get("/checkout-session", (req, res) => {
  const sessionId = req.body.sessionId;
  stripe.checkout.sessions.retrieve(sessionId).then((session) => {
    res.send(session);
  });
});

app.post('/create-portal-session', async (req, res) => {
  // For demonstration purposes, we're using the Checkout session to retrieve the customer ID.
  // Typically this is stored alongside the authenticated user in your database.
  const { session_id } = req.body;
  const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

  // This is the url to which the customer will be redirected when they are done
  // managing their billing with the portal.
  const returnUrl = `https://localhost:3000/test/success`;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: checkoutSession.customer,
    return_url: returnUrl,
  });
  res.send(portalSession.url);

  // res.redirect(303, portalSession.url);
});






//stripe webhooks
app.post(
  "/webhook",
  async (request, response) => {
    // admin.firestore().collection("success").add({
    //   body: "fasdf",
    // });
    // admin.firestore().collection("new").add(request.body);
    const sig = request.headers["stripe-signature"];

    const endpointSecret ="whsec_91eee8ae3e9e71ed6f4640ae81e301e3245f98156f72e05f8e67cfc1c35a660a";


    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    const intent = event.data.object;



    switch (event.type) {
      case "payment_intent.succeeded":
        // const paymentIntent = event.data.object;
        console.log("Payment received");
        admin.firestore().collection("fail").add({
          body: "fasdf",
        });
        res.send("ok");
        // Then define and call a function to handle the event payment_intent.succeeded
        break;
      // ... handle other event types
      case "payment_intent.payment_failed":
        console.log("Payment failed");
        res.send("ok");
        // Then define and call a function to handle the event payment_intent.payment_failed
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
        admin.firestore().collection("fail").add({
          body: "fasdf",
        });
        break;
    }

    // Return a 200 response to acknowledge receipt of the event
    // response.send();
  }
);

app.post("/meow", (req, res) => {
  res.send(JSON.stringify(req.body));
  admin.firestore().doc("meow/hj").set({
    meow: "meow",
  });
});

app.get("/meow", (req, res) => {
  console.log("meow");
  res.send("meow");
});

exports.expressApi = functions.https.onRequest(app);
