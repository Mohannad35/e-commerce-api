import _ from 'lodash';
import config from 'config';
import jwt from 'jsonwebtoken';
import logger from './logger.js';

export default async (req, res, next) => {
	try {
		let token = req.header('Authorization');
		if (!token)
			return res.status(401).send({ message: 'Access denied.', reason: 'No token provided.' });
		token = token.replace('Bearer ', '');
		const decoded = jwt.verify(token, process.env.ECOMMERCE_JWT_PRIVATE_KEY);
		req.token = token;
		req.user = decoded;
		next();
	} catch (error) {
		logger.info(error.message, error);
		res.status(400).send({ message: 'Access denied.', reason: error.message });
	}
};
