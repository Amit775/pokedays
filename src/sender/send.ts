import { MessageMedia } from 'whatsapp-web.js';
import { client } from '../client';

const url = (number: string) =>
	`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${number}.png`;

const waitForClientReady = async (): Promise<void> => {
	return new Promise((resolve, reject) => {
		if (client.info) {
			resolve();
		} else {
			client.on('ready', resolve);
			client.on('auth_failure', reject);
		}
	});
};

const retrySendMessage = async (id: string, media: MessageMedia, retries = 3): Promise<void> => {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			await client.sendMessage(id, media, { sendMediaAsSticker: true });
			return;
		} catch (error) {
			if (attempt === retries) {
				throw error;
			}
			console.warn(`Attempt ${attempt} failed. Retrying...`);
		}
	}
};

export const send = async (id: string, pokemon: string): Promise<string> => {
	try {
		await waitForClientReady();
		const media = await MessageMedia.fromUrl(url(pokemon));
		await retrySendMessage(id, media);
		return `${id} sent!`;
	} catch (error) {
		console.error('Failed to send message:', error);
		throw new Error('Failed to send message');
	}
};
