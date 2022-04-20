const functions = require("firebase-functions");
// const axios = require("axios");
// const express = require("express");
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

const admin = require("firebase-admin");
// const { json } = require("express");
admin.initializeApp();

// exports.use(express.json());

//
exports.test = functions.https.onRequest((req, res) => {
  switch (req.method) {
    case "GET":
      console.log("df");

      break;
    case "POST":
      //   res.send("Gpost");
      data = req.body;

      admin.firestore().doc("test_data/stripe").set({
        name: req.body,
      });
      break;
    default:
      res.send("Method not supported");
      break;
  }
});

exports.createProfile = functions.auth.user().onCreate((user) => {
  var userObject = {
    displayName: user.displayName,
    email: user.email,
  };

  return admin
    .firestore()
    .doc("users/" + user.uid)
    .set(userObject);
  // or admin.firestore().doc('users').add(userObject); for auto generated ID
});
