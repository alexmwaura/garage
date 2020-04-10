const { db } = require("../util/admin");
const config = require("../config/config");
const firebase = require("firebase");
firebase.initializeApp(config);

const {
  validateLoginData,
  validateSignupData
} = require("../validator/validator");

exports.signupUser = (request, response) => {
  const newUser = {
    email: request.body.email,
    password: request.body.password,
    confirmPassword: request.body.confirmPassword,
    username: request.body.username,
    role: request.body.role
  };
  const { valid, errors } = validateSignupData(newUser);
  if (!valid) return response.status(400).json(errors);

  // const noImg = 'download.png';
  let token, userId;
  db.doc(`/users/${newUser.username}`)
    .get()
    .then(doc => {
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
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        createdAt: new Date().toISOString(),
        userId
      };
      return db.doc(`/users/${newUser.username}`).set(userCredentials);
    })
    .then(() => {
      return response.status(201).json({ token,role:newUser.role });
    })
    .catch(err => {
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

exports.loginUser = (request, response) => {
  userData = {
    email: request.body.email,
    password: request.body.password
  };

  const { valid, errors } = validateLoginData(userData);
  // let userRef = db.collection("users");
  let token;
  if (!valid) return response.status(400).json(errors);
  firebase
    .auth()
    .signInWithEmailAndPassword(userData.email, userData.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(tokenData => {
      token = tokenData
      // let queryRef = userRef
      db.collection('users')
        .where("email", "==", request.body.email)
        .get()
        .then(snapuser => {
          snapuser.forEach(ref => {
            // console.log(queryRef)
            return response.json({ token,role: ref.data().role });
          });
        })
        .catch(error => {
          console.error(error);
          return response
            .status(403)
            .json({ general: "Wrong credentials please try again" });
        });
    })
    .catch(error => {
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
    .then(data => {
      let users = [];
      data.forEach(doc => {
        users.push({
          userId: doc.id,
          email: doc.data().email,
          role: doc.data().role,
          username: doc.data().username,
          createdAt: doc.data().createdAt
        });
      });
      return response.json(users);
    })
    .catch(err => console.log(err));
};


exports.getAuthenticatedUser = (request, response) => {
	let userData = {};
	db.doc(`/users/${request.user.username}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				userData.credentials = doc.data();
				return db
					.collection('likes')
					.where('username', '==', request.user.username)
					.get();
			}
		})
		.then((data) => {
			userData.customers = [];
			// console.log(data)
			data.forEach((doc) => {
				userData.likes.push(doc.data());
			});

			return db
				.collection('customers')
				.where('attendant', '==', request.user.username)
				.orderBy('createdAt', 'desc')
				.limit(10)
				.get();
		})
		.then((data) => {
			userData.customers = [];
			data.forEach((doc) => {
				userData.customers.push({
					: doc.data().recipient,
					sender: doc.data().sender,
					createdAt: doc.data().createdAt,
					screamId: doc.data().screamId,
					type: doc.data().type,
					read: doc.data().read,
					notificationId: doc.id,
				});
			});
			return response.json(userData);
		})
		.catch((error) => {
			console.log(error);
			return response.status(500).json({ error: error.code });
		});
};
