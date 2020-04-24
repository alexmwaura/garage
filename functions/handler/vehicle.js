const { db } = require("../util/admin");
const {
  validateCustomerData,
  validateRegOfVehicle,
  validateNotificationData
} = require("../validator/validator");
const functions = require("firebase-functions");

let cusId;
exports.customerData = (request, response) => {
  const customerInfo = {
    createdAt: new Date().toISOString(),
    email: request.body.email,
    name: request.body.name,
    phone: request.body.phone,
    vehicleCount: 0,
    customerId: 0,
    attendant: 0,
  };

  // const userData = db.collection('users')
  const { valid, errors } = validateCustomerData(customerInfo);
  if (!valid) return response.status(400).json(errors);
  db.collection("users")
    .where("userId", "==", request.params.userId)
    .get()
    .then((data) => {
      console.log(data.docs[0].data().username);
      if (!data.docs[0].exists) {
        return response.status(400).json({ error: "user not found" });
      }
      db.collection("customers")
        .where("email", "==", customerInfo.email)
        .get()
        .then((doc) => {
          if (doc.docs[0]) {
            return response
              .status(400)
              .json({ customer: "this customer already exists" });
          } else {
            db.collection("customers")
              .add(customerInfo)
              .then((test) => {
                newCustomer = customerInfo;
                newCustomer.customerId = test.id;
                newCustomer.attendant = data.docs[0].data().username;
                db.doc(`/customers/${test.id}`).update({
                  customerId: test.id + "",
                  attendant: data.docs[0].data().username + "",
                });

                return response.json(newCustomer);
              })
              .catch((err) => {
                console.error(err);
                return response.json({ error: err.code });
              });
          }
        });
    });
};

let vehicleId;
exports.vehicleData = (request, response) => {
  vehicleInfo = {
    customerId: request.params.customerId,
    model: request.body.model,
    registration: request.body.registration,
    engine: request.body.engine,
    createdAt: new Date().toISOString(),
  };

  const { valid, errors } = validateRegOfVehicle(vehicleInfo);
  let sender;

  if (!valid) return response.status(400).json(errors);
  db.collection("vehicles")
    .where("registration", "==", request.body.registration)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        db.doc(`/customers/${request.params.customerId}`)
          .get()
          .then((doc) => {
            if (!doc.exists) {
              return response
                .status(400)
                .json({ error: "Customer not registered" });
            }
            doc.ref.update({ vehicleCount: doc.data().vehicleCount + 1 });
            db.collection("vehicles")
              .add(vehicleInfo)
              .then((upd) => {
                vehicleInfo.vehicleId = upd.id;
                upd.update(vehicleInfo);
              })
              .then(() => {
                db.collection("vehicles")
                  .where("vehicleId", "==", `${vehicleInfo.vehicleId}`)
                  .onSnapshot((querySnapshot) => {
                    const notificationData = {};
                    notificationData.vehicleId = querySnapshot.docs[0].data().vehicleId;
                    notificationData.sender = doc.data().attendant;
                    notificationData.createdAt = new Date().toISOString();
                    return db
                      .doc(`notifications/${vehicleInfo.vehicleId}`)
                      .set(notificationData);
                  });
              })
              .catch((err) => {
                console.error(err);
                return response.json({ error: err.code });
              });
          })
          .then(() => {
            return response.json(vehicleInfo);
          })
          .catch((err) => {
            console.error(err);
            return response.json({ error: err.code });
          });
      } else {
        return response.json({ registration: "Already exists" });
      }
    })

    .catch((err) => {
      console.error(err);
      return response.json({
        general: "Something went wrong please try again",
      });
    });
};

exports.createNotification = (request, response) => {
  let notification = {
    username: request.body.username,
  };
  const { valid, errors } = validateNotificationData(notification);
  if (!valid) return response.status(400).json(errors);
  db.doc(`/mechanics/${request.body.username}`)
    .get()
    .then((res) => {
      if (!res.exists) return response.json({ username: "User not found" });
      db.doc(`notifications/${request.params.vehicleId}`)
        .get()
        .then((doc) => {
          console.log(doc.data());
          if (!doc.exists) return response.json({ vehicle: "Vehicle not found" });

          if (doc.data().recepient)
            return response.json({
              username: `${doc.data().recepient} has already been notified`,
            });
          notificationData = doc.data();
          notificationData.recepient = res.data().username;
          notificationData.read = false;
          notificationData.createdAt = new Date().toISOString();
          return doc.ref.update(notificationData);
        })
        .then(() => {
          return response.json(notificationData);
        })
        .catch((err) => {
          console.error(err);
          return response.json({ error: err.code });
        });
    })
    .catch((err) => {
      console.error(err);
      return response.json({ error: err.code });
    });
};

exports.getCustomer = (request, response) => {
  let customerData = {};
  db.doc(`/customers/${request.params.customerId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return response.status(404).json({ error: "Customer not found" });
      }

      customerData = doc.data();
      customerData.customerId = doc.id;
      return db
        .collection("vehicles")
        .orderBy("createdAt", "desc")
        .where("customerId", "==", request.params.customerId)
        .get();
    })
    .then((data) => {
      customerData.vehicles = [];
      data.forEach((doc) => {
        // console.log(doc.data());
        customerData.vehicles.push(doc.data());
      });
      return response.json(customerData);
    })
    .catch((err) => {
      return response.status(500).json({ error: err.code });
    });
};

exports.getAllVehicles = (request, response) => {
  db.collection("vehicles")
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        return response.json(doc.data());
      });
    })
    .catch((err) => {
      console.log(err);
      return response.status(500).json({ error: "Something went wrong" });
    });
};

exports.getVehicle = (request, response) => {
  db.collection("vehicles")
    .where("vehicleId", "==", request.params.vehicleId)
    .get()
    .then((snapshot) => {
      console.log(snapshot);
      vehicleData = snapshot.docs[0].data();
      return response.json(vehicleData);
    })
    .catch((err) => {
      console.log(err);
      return response.status(500).json({ error: "Something went wrong" });
    });
};

exports.getAllCustomers = (request, response) => {
  db.collection("customers")
    .orderBy("createdAt", "desc")
    .get()
    .then((snapshot) => {
      customers = [];
      snapshot.forEach((doc) => {
        customers.push(doc.data());
      });
      return response.json(customers);
    })
    .catch((err) => {
      console.log(err);
      return response.status(500).json({ error: "Something went wrong" });
    });
};

exports.getMechanicsData = (request, response) => {
  db.collection("mechanics")
    .orderBy("createdAt", "desc")
    .get()
    .then((mechanics) => {
      let mechanicsData = [];
      mechanics.forEach((mechanic) => {
        mechanicsData.push(mechanic.data());
      });
      return response.json(mechanicsData);
    })
    .catch((err) => {
      console.log(err);
      return response.status(500).json({ error: "Something went wrong" });
    });
};

exports.pendingNotifications = (request, response) => {
  db.collection("notifications")
    .where("sender", "==", request.params.username)
    .orderBy("createdAt", "desc")
    .get()
    .then((notifications) => {
      let notificationData = [];
      console.log(notifications.docs[0]);
      notifications.forEach((doc) => {
        notificationData.push(doc.data());
      });
      return response.json(notificationData);
    })
    .catch((err) => {
      console.log(err);
      return response.status(500).json({ error: "Something went wrong" });
    });
};
