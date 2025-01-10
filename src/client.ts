import { executablePath } from 'puppeteer';
import * as qrcode from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';

const createClient = (): Client => {
	const client = new Client({
		authStrategy: new LocalAuth({
			dataPath: '/tmp/.wwebjs_auth',
		}),
		puppeteer: {
			headless: true,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--disable-accelerated-2d-canvas',
				'--no-first-run',
				'--no-zygote',
				'--disable-gpu',
			],
			executablePath: executablePath(),
		},
	});

	client.on('message', async (message) => {
		if (message.body === 'debug') {
			console.log(message);
		}
	});

	client.on('qr', (qr) => {
		qrcode.generate(qr, { small: true });
	});

	client.on('ready', () => {
		console.log('Client is ready!');
	});

	client.on('disconnected', (reason) => {
		console.log('Client was logged out', reason);
		client.initialize();
	});

	client.initialize();

	return client;
};

export const client = createClient();
