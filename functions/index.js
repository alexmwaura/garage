const functions = require("firebase-functions");
const { getAttendantdetails,signupUser, loginUser, getAllUsers } = require("./handler/user");
const FbAuth = require("./util/CustomerAuth");
const NtAuth = require("./util/Notification")
const {
  customerData,
  vehicleData,
  getCustomer,
  getVehicle,
  getNotification,
  createNotification,
  getAllCustomers
  
} = require("./handler/vehicle");
const app = require("express")();
const { db } = require("./util/admin");

app.get("/users", getAllUsers);
app.get("/user/:userName",FbAuth,getAttendantdetails);
app.get("/customer/:customerId", getCustomer);
app.get("/customers", getAllCustomers);
// app.get('/vehicle/:userId/:vehicleId', vehicleNotification)
app.post(`/notification/:vehicleId`,createNotification)
app.post("/vehicle", NtAuth,getVehicle);
app.post("/notification/:userId",getNotification);

app.post("/signup", signupUser);
app.post("/login", loginUser);
app.post("/customer/:userId", FbAuth, customerData);
app.post("/customer/vehicle/:customerId", FbAuth, vehicleData);

exports.api = functions.https.onRequest(app);
