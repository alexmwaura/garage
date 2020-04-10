const admin = require("firebase-admin");
const serviceAccount = require("../config/config.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "auto-garage-ea474.appspot.com"
});
const db = admin.firestore();

module.exports = {admin , db}