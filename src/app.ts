import dotenv from 'dotenv';

dotenv.config();

import { ErrorRequestHandler, default as express, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { router } from './router';

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
	windowMs: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : 24 * 60 * 60 * 1000,
	max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 5,
	keyGenerator: (req) => req.headers['client-id'] as string,
	handler: (req, res) => {
		res.status(429).json({ message: 'Request limit reached for today' });
	},
});

const apiKey: RequestHandler = (req, res, next) => {
	if (process.env.API_KEY == null || req.headers['x-api-key'] !== process.env.API_KEY) {
		return res.status(401).json({ message: 'Unauthorized' });
	}
	next();
};

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
	console.error(err);
	res.status(500).json({ message: 'Internal server error' });
};

app.use(express.json());
app.use('/pokedays', apiKey, limiter, router);

app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
