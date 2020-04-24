const functions = require("firebase-functions");
const {uploadImage, getAttendantdetails,signupUser, loginUser, getAllUsers,getMechanics } = require("./handler/user");
const FbAuth = require("./util/CustomerAuth");
const NtAuth = require("./util/Notification")
const {
  customerData,
  vehicleData,
  getCustomer,
  getVehicle,
  getMechanicsData,
  createNotification,
  getAllCustomers,
  pendingNotifications

  
} = require("./handler/vehicle");
const app = require("express")();
const { db } = require("./util/admin");

app.get("/users", getAllUsers);
app.get("/mechanics", getMechanics);
app.get("/user/:userName",FbAuth,getAttendantdetails);
app.get("/customer/:customerId", getCustomer);
app.get("/customers", getAllCustomers);
// app.get('/vehicle/:userId/:vehicleId', vehicleNotification)
app.post(`/notification/:vehicleId`,createNotification)
app.get("/vehicle/:vehicleId",getVehicle);
app.get("/mechanics",getMechanicsData);
app.get("/notifications/:username",pendingNotifications)
app.post("/signup", signupUser);
app.post('/user/image/:userName',FbAuth, uploadImage);

app.post("/login", loginUser);
app.post("/customer/:userId", FbAuth, customerData);
app.post("/customer/vehicle/:customerId", FbAuth, vehicleData);

exports.api = functions.https.onRequest(app);
