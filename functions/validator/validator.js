const isEmail = email => {
  const regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if (email.match(regex)) return true;
  else return false;
};

const isEmpty = string => {
  if (string.trim() === "") return true;
  else return false;
};


exports.validateSignupData = user => {
  let errors = {};
  if (isEmpty(user.email)) {
    errors.email = "Must not be empty";
  } else if (!isEmail(user.email)) {
    errors.email = "Must be a valid email";
  }
  if (isEmpty(user.password)) {
    errors.password = "Must not be empty";
  }
  if (user.password !== user.confirmPassword) {
    errors.confirmPassword = "Password must match";
  }
  if (isEmpty(user.username)) {
    errors.username = "Must not be empty";
  }
  if (isEmpty(user.role)) {
    errors.role = "Must not be empty";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  };
};

exports.validateLoginData = data => {
  let errors = {};
  if (isEmpty(data.email)) errors.email = "Must not be Empty";
  if (isEmpty(data.password)) errors.password = "Must not be Empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  };
};

exports.validateCustomerData = data => {
  let errors = {};
  if (isEmpty(data.email)) errors.email = "Must not be Empty";
  if (isEmpty(data.name)) errors.name = "Must not be Empty";
  if (isEmpty(data.phone)) errors.phone = "Must not be Empty";
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  };
};

exports.validateRegOfVehicle = data => {
  let errors = {};
  if (isEmpty(data.model)) errors.name = "Must not be Empty";
  if (isEmpty(data.registration)) errors.registration = "Must not be Empty";
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  };
};





// exports.reduceCuserData = (data) => {
// 	let customerDetails = {}
// 	if (!isEmpty(data.bio.trim())) customerDetails.bio = data.bio
// 	if (!isEmpty(data.website.trim())){
// 	if (data.website.trim().substring(0,4)){
// 		customerDetails.website = `http://${data.website.trim()}`
// 	}else customerDetails.website = data.website
// 	}
// 	if (!isEmpty(data.location.trim())) customerDetails.location = data.location;

// 	return customerDetails

// }
