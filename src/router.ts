import express, { NextFunction, Request, RequestHandler, Response } from 'express';
import { QR } from './qr';
import { send } from './sender';
import { client } from './client';

export const router = express.Router();

export const asyncHandler = (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) => {
	Promise.resolve(fn(req, res, next)).catch(next);
};

router.get(
	'/:days',
	asyncHandler(async (req, res) => {
		const { days } = req.params;
		const { shiny, login } = req.query;

		const [index, name] = days.split('-');
		const clientId = req.headers['client-id'] as string;

		console.log(`request: ${index} ${name} ${shiny} ${clientId}`);

		if (login === 'true') {
			return client.info ? res.json(client.info) : res.setHeader('Content-Type', 'image/png').send(await QR.asImage());
		}

		if (!clientId) {
			return res.status(400).json({ message: 'Client-ID header is required' });
		}

		return send(clientId, index, name, shiny === '1')
			.then((response) => {
				console.log(`response: ${response}`);
				res.json({ message: response });
			})
			.catch((error) => {
				console.error('Failed to send message:', error);
				return res.status(500).json({ message: 'Failed to send message' });
			});
	})
);
