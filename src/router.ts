import express from 'express';
import rateLimit from 'express-rate-limit';
import { send } from './sender';

export const router = express.Router();

const limiter = rateLimit({
	windowMs: 24 * 60 * 60 * 1000, // 24 hours
	max: 3, // limit each client to 3 requests per windowMs
	keyGenerator: (req) => req.headers['client-id'] as string, // use client-id as the key
	handler: (req, res) => {
		res.status(429).json({ message: 'Request limit reached for today' });
	},
});

router.get('/:days', limiter, async (req, res) => {
	const { days } = req.params;
	const clientId = req.headers['client-id'] as string;

	if (!clientId) {
		return res.status(400).json({ message: 'Client-ID header is required' });
	}

	try {
		const response = await send(clientId, days);
		res.json({ message: response });
	} catch {
		res.status(500).json({ message: 'Failed to send message' });
	}
});
