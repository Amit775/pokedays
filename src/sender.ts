import { MessageMedia } from 'whatsapp-web.js';
import { client } from './client';

const TIMEOUT = process.env.TIMEOUT_MS ? parseInt(process.env.TIMEOUT_MS) : 30000;
const MAX_RETRIES = process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES) : 3;

const url = (number: string) =>
	`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${number}.png`;

const waitForClientReady = async (): Promise<void> => {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => reject(new Error('Timeout')), TIMEOUT);

		if (client.info) {
			clearTimeout(timeout);
			resolve();
		} else {
			client.on('ready', () => {
				clearTimeout(timeout);
				resolve();
			});
			client.on('auth_failure', (error) => {
				clearTimeout(timeout);
				reject(error);
			});
		}
	});
};

const retrySendMessage = async (id: string, media: MessageMedia, message: string): Promise<void> => {
	for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
		try {
			if (!client.info) {
				await waitForClientReady();
			}
			await client.sendMessage(id, message);
			await client.sendMessage(id, media, { sendMediaAsSticker: true });
			return;
		} catch (error: any) {
			if (attempt === MAX_RETRIES) {
				throw error;
			}
			console.warn(`Attempt ${attempt} failed. Retrying...`);
			if (typeof (error as { message: string }).message === 'string' && error.message.includes('Session closed')) {
				console.warn('Client session closed. Reinitializing client...');
				client.recreate();
				await waitForClientReady();
			}
		}
	}
};

export const send = async (clientId: string, index: string, name: string, shiny: boolean): Promise<string> => {
	return waitForClientReady()
		.then(() =>
			MessageMedia.fromUrl(url(`${shiny ? 'shiny/' : ''}${index}`))
				.then((media) => retrySendMessage(clientId, media, `${index} - ${name}`))
				.then(() => `${index} sent to ${clientId}!`)
		)
		.catch((error) => {
			console.error('Failed to send message:', error);
			throw new Error('Failed to send message');
		});
};
