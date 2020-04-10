const {admin,db} = require('./admin')

module.exports = (request,response,next) => {
	let idToken;
	if (request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
		idToken = request.headers.authorization.split('Bearer ')[1];
	} else {
		console.error('No token found');
		return response.status(403).json({ error: 'Unauthorized' });
	}

	admin
		.auth()
		.verifyIdToken(idToken)
		.then((decodedToken) => {
			request.user = decodedToken;
			return db
				.collection('users')
				.where('userId', '==', request.user.uid)
				.limit(1)
				.get()
				.then((data) => {
					const user = data.docs[0].data()
					console.log(user)
					if (user.role !== 'attendant'.trim()){
						return response.status(403).json({error: 'Unauthorized'})
					}
					else{
						return next();
					}
					
					
				})
				.catch((error) => {
					console.error('Verification error on token', error);
					return response.status(403).json(error);
				});
		})

}