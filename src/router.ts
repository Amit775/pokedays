import express from 'express';
import rateLimit from 'express-rate-limit';
import QRCode from 'qrcode';
import { client } from './client';
import { send } from './sender';

export const router = express.Router();

const limiter = rateLimit({
	windowMs: 24 * 60 * 60 * 1000,
	max: 3,
	keyGenerator: (req) => req.headers['client-id'] as string,
	handler: (req, res) => {
		res.status(429).json({ message: 'Request limit reached for today' });
	},
});

let isClientInitialized = false;

router.get('/logout', (req, res) => {
	client.logout();
	isClientInitialized = false;
	return res.json('logout');
});

router.get('/login', (req, res) => {
	if (!isClientInitialized) {
		client.on('qr', (qr) => {
			QRCode.toBuffer(qr, { type: 'png' }, (err, buffer) => {
				if (err) {
					return res.status(500).json({ message: 'Failed to generate QR code' });
				}
				res.setHeader('Content-Type', 'image/png');
				res.send(buffer);
			});
		});
		client.initialize();
		isClientInitialized = true;
	} else {
		return res.status(200).json({ message: 'Client is already initialized' });
	}
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
	} catch (error) {
		res.status(500).json({ message: 'Failed to send message' });
	}
});
