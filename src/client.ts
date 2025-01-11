import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { executablePath } from 'puppeteer';
import qrcode from 'qrcode-terminal';
import { Client, RemoteAuth } from 'whatsapp-web.js';
import { AwsS3Store } from 'wwebjs-aws-s3';

const createClient = (): Client => {
	const s3 = new S3Client({
		region: process.env.AWS_REGION ?? 'eu-central-1',
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_KEY ?? '',
			secretAccessKey: process.env.AWS_SECRET_KEY ?? '',
		},
	});

	const putObjectCommand = PutObjectCommand;
	const headObjectCommand = HeadObjectCommand;
	const getObjectCommand = GetObjectCommand;
	const deleteObjectCommand = DeleteObjectCommand;

	const store = new AwsS3Store({
		bucketName: process.env.AWS_BUCKET_NAME,
		remoteDataPath: process.env.AWS_REMOTE_DATA_PATH,
		s3Client: s3,
		putObjectCommand,
		headObjectCommand,
		getObjectCommand,
		deleteObjectCommand,
	});

	const client = new Client({
		authStrategy: new RemoteAuth({
			dataPath: process.env.DATA_PATH,
			store: store,
			backupSyncIntervalMs: 600000,
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

	client.on('remote_session_saved', () => {
		console.log('Client session saved');
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
