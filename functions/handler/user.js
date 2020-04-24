const { db, admin } = require("../util/admin");
const config = require("../config/config");
const firebase = require("firebase");
firebase.initializeApp(config);

const {
  validateLoginData,
  validateSignupData,
} = require("../validator/validator");

exports.signupUser = (request, response) => {
  const newUser = {
    email: request.body.email,
    password: request.body.password,
    confirmPassword: request.body.confirmPassword,
    username: request.body.username,
    role: request.body.role,
  };
  const { valid, errors } = validateSignupData(newUser);
  if (!valid) return response.status(400).json(errors);

  const noImg = "download.png";
  let token, userId;
  db.doc(`/users/${newUser.username}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return response
          .status(400)
          .json({ username: "this username is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      const userCredentials = {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        createdAt: new Date().toISOString(),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
        userId,
      };
      return db.doc(`/users/${newUser.username}`).set(userCredentials);
    })
    .then(() => {
      if (newUser.role === "attendant") {
        const attendantData = {
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          createdAt: new Date().toISOString(),
          imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
          userId,
        };
        return db.doc(`/attendants/${newUser.username}`).set(attendantData);
      } else if (newUser.role === "mechanic") {
        const mechanicData = {
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          createdAt: new Date().toISOString(),
          imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
          userId,
        };
        return db.doc(`/mechanics/${newUser.username}`).set(mechanicData);
      }
    })
    .then(() => {
      return response.status(201).json({ token, role: newUser.role });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return response.status(400).json({ email: "Email is already in use" });
      }
      if (err.code === "auth/weak-password")
        return response.status(400).json({ password: "Password is too short" });
      return response
        .status(500)
        .json({ general: "Something went wrong please try again" });
    });
};

exports.uploadImage = (request, response) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");
  const busboy = new BusBoy({ headers: request.headers });
  let imageFileName;
  let imageToBeUploaded = {};

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    console.log(fieldname);
    console.log(filename);
    console.log(mimetype);
    console.log(encoding);

    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    imageFileName = `${Math.round(
      Math.random() * 1000000000000
    )}.${imageExtension}`;
    const filePath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filePath, mimetype };
    file.pipe(fs.createWriteStream(filePath));
  });

  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filePath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
          },
        },
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;

        db.doc(`/users/${request.params.userName}`)
          .get()
          .then((doc) => {
            userData = doc.data();
            if (userData.role === "attendant")
              return db
                .doc(`/attendants/${request.params.userName}`)
                .update({ imageUrl });
            return db
              .doc(`/mechanics/${request.params.userName}`)
              .update({ imageUrl });
          });

        return db.doc(`/users/${request.params.userName}`).update({ imageUrl });
      })
      .then(() => {
        return response.json({ message: "Image uploaded successfully" });
      })
      .catch((error) => {
        console.error(error);
        return response.status(500).json({ error: error.code });
      });
  });

  busboy.end(request.rawBody);
};

exports.loginUser = (request, response) => {
  userData = {
    email: request.body.email,
    password: request.body.password,
  };

  const { valid, errors } = validateLoginData(userData);
  // let userRef = db.collection("users");
  let token;
  if (!valid) return response.status(400).json(errors);
  firebase
    .auth()
    .signInWithEmailAndPassword(userData.email, userData.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((tokenData) => {
      token = tokenData;
      // let queryRef = userRef
      db.collection("users")
        .where("email", "==", request.body.email)
        .get()
        .then((snapuser) => {
          snapuser.forEach((ref) => {
            // console.log(queryRef)
            return response.json({
              token,
              role: ref.data().role,
              username: ref.data().username,
            });
          });
        })
        .catch((error) => {
          console.error(error);
          return response
            .status(403)
            .json({ general: "Wrong credentials please try again" });
        });
    })
    .catch((error) => {
      console.error(error);
      return response
        .status(403)
        .json({ general: "Wrong credentials please try again" });
    });
};

exports.getAllUsers = (request, response) => {
  db.collection("users")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      let users = [];
      data.forEach((doc) => {
        users.push({
          userId: doc.id,
          email: doc.data().email,
          role: doc.data().role,
          username: doc.data().username,
          createdAt: doc.data().createdAt,
        });
      });
      return response.json(users);
    })
    .catch((err) => console.log(err));
};

exports.getMechanics = (request, response) => {
  let mechanicData = [];
  db.collection("mechanics")
    .orderBy("createdAt")
    .get()
    .then((data) => {
      data.forEach((doc) => {
        mechanicData.push({
          userId: doc.id,
          email: doc.data().email,
          username: doc.data().username,
          createdAt: doc.data().createdAt,
          imageUrl: doc.data().imageUrl
        });
      });

      return response.json(mechanicData);
    })
    .catch((err) => console.log(err));
};

exports.getAttendantdetails = (request, response) => {
  let userData = {};
  db.doc(`/users/${request.params.userName}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return response.json({ error: "User does not exist" });
      }
      userData.credentials = doc.data();
      return db
        .collection("customers")
        .where("attendant", "==", request.params.userName)
        .orderBy("createdAt", "desc")
        .get()

        .then((data) => {
          userData.credentials.customers = [];
          data.forEach((details) => {
            userData.credentials.customers.push(details.data());
          });

          return response.json(userData);
        })
        .catch((error) => {
          console.log(error);
          return response.status(500).json({ error: error.code });
        });
    })

    .catch((error) => {
      console.log(error);
      return response.status(500).json({ error: error.code });
    });
};
