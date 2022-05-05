const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const { json } = require("express");
const MongoClient = require("mongodb").MongoClient;
const objectID = require("mongodb").ObjectID;

// mongodb
const client = new MongoClient(
  "mongodb+srv://krish:greenlines123@cluster1.7qmda.mongodb.net/test",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

client.connect().then(() => console.log("connected to mongodb"));

const stripe = Stripe(
  "sk_test_51KVYQaSIL2080LSuRHgmNa2n4ornRFeKnpfPJjys8jVdLmd1v8IA91179gGVyVkj7HXtXAzU96c69vokNqlUdGMN00PWlzesKG"
);

const app = express();
app.use(cors({ origin: "*" }));
app.use(cors({ origin: true }));

app.use(express.json());
//initalize firebase
admin.initializeApp(functions.config().firebase);

app.get("/", async (req, res) => {
  res.send("Hello from nice nice!");
});

//create session

app.post("/session", async (req, res) => {
  const payload = {
    success_url: `http://localhost:3000/success/{CHECKOUT_SESSION_ID}`,
    cancel_url: `http://localhost:3000/cancel/{CHECKOUT_SESSION_ID}`,
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
  admin.firestore().collection("sessions").add({
    sessiondata: session,
    email: req.body.customer_email,
  });
  // admin.firestore().doc("user/" + req.body.customer_email).update(
  //   {
  //     session: admin.firestore.FieldValue.arrayUnion(session.id),
  //   }
  // );

  res.send(session);
});

app.get("/redirect/", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  res.sendStatus(301).redirect("http://localhost:3000/test");
});

app.post("/create-portal-session", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "1800");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "PUT, POST, GET, DELETE, PATCH, OPTIONS"
  );
  // For demonstration purposes, we're using the Checkout session to retrieve the customer ID.
  // Typically this is stored alongside the authenticated user in your database.
  // const session_id = req.body.session_id;
  // const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

  // // This is the url to which the customer will be redirected when they are done
  // // managing their billing with the portal.
  const returnUrl = `http://localhost:3000/dashboard/MSFT`;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: req.body.customer,
    return_url: returnUrl,
  });
  res.send(portalSession.url);

  // res.redirect(303, portalSession.url);
});

//retire sessionid

app.post("/retire-session", async (req, res) => {
  // res.setHeader('Access-Control-Allow-Origin', '*');
  const session = await stripe.checkout.sessions.retrieve(req.body.session_id);

  res.send(session);
});

//test sucessfull payment
app.post("/test/success", (req, res) => {
  //adding to
  admin.firestore().collection("paid_users").add({
    email: "test@gmail.com",
    customer_id: "fdsaf3421fdsa23453",
  });
  //adding to succeeded payments
  admin
    .firestore()
    .collection("sucessful_sessions")
    .add({ session_id: "test111" });

  //sending
  res.send("Payment Successful");
});

app.post("/webhook", (request, response) => {
  const sig = request.headers["stripe-signature"];

  const endpointSecret =
    "whsec_91eee8ae3e9e71ed6f4640ae81e301e3245f98156f72e05f8e67cfc1c35a660a";

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      request.rawBody,
      sig,
      endpointSecret
    );
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    console.log(err);
    return;
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      console.log("Payment Succeeded!");
      admin.firestore().collection("paid_user22s").add({
        customer_id: "fdsaf3421fdsa23453",
      });
      //adding to succeeded payments
      admin
        .firestore()
        .collection("sucessful_sessions")
        .add({ session_id: event });

      console.log(event);

      try {
        admin.firestore().collection("paymentdata").add({
          // email: JSON.parse(JSON.stringify(event.data.object.owner.email)),
          // customer_id: JSON.parse(JSON.stringify(event.data.object.customer)),
          // payment_intent_id: JSON.parse(JSON.stringify(event.data.object.id)),
          // payment_method_id: JSON.parse(JSON.stringify(event.data.object.payment_method)),
          // payment_method_details: JSON.parse(JSON.stringify(event.data.object.payment_method_details)),
        });
      } catch (err) {
        console.log(err);
      }

      //sending
      response.sendStatus(200);
      // const paymentIntent = event.data.object;
      // console.log(`PaymentIntent ${paymentIntent.id} succeeded`);

      // Then define and call a function to handle the event payment_intent.succeeded
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
      break;
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send("ok");
});

app.post("/meow", (req, res) => {
  // admin.firestore().collection("meow").add(req.body);
  res.send(JSON.stringify(req.body));
});

app.get("/meow", (req, res) => {
  console.log("meow");
  res.send(JSON.stringify(req.body.data.object.owner.email));
});

// databasefunctions
app.get("/mongo", async (req, res) => {
  client.connect().then(async () => {
    console.log("connected to mongodb");
    let result = await client
      .db("data")
      .collection("tickers")
      .findOne({ symbol: "A" });

    res.send(result);
  });
});

//
app.get("/mongosearch", async (req, res) => {

  client.connect().then(async () => {

    try {
      
      let results = await client
        .db("data")
        .collection("tickers")
        .aggregate([
          {
            $search: {
              index: "default",
              compound: {
                must: [
                  {
                    text: {
                      query: req.query.query,
                      path: "company",
                      fuzzy: {
                        maxEdits: 1,
                      },
                    },
                  },
                ],
              },
            },
          },
          {
            $limit: 10,
          },
          {
            $project: {
              searchName: 1,
              _id: 1,
              ticker: 1,
              company: 1,
              symbol: 1,
              // city: 1,
              // country: 1,
              // adminCode: 1,
              // countryCode: 1,
              // fullName: 1,
              score: { $meta: "searchScore" },
            },
          },
        ])
        .toArray();
        
      return res.send(results);

      // res.send(result);
    } catch (err) {
      console.log(err);
    }






  });



});





exports.expressApi = functions.https.onRequest(app);
