import { executablePath } from 'puppeteer';
import qrcode from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';

const createClient = (): Client => {
	const client = new Client({
		authStrategy: new LocalAuth({
			dataPath: './node_modules/.wwebjs_auth',
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

let _client = createClient();

const recreateClient = () => {
	_client.destroy();
	_client = createClient();
	return _client;
};

export type Recreateble<T> = T & { recreate: () => Recreateble<T> };

export const client = new Proxy({} as Recreateble<Client>, {
	get(target, prop: keyof Recreateble<Client>) {
		if (prop === 'recreate') {
			return recreateClient;
		}
		return _client[prop];
	},
});
