import QRCode from 'qrcode';

export class QR {
	public static qr: string | null = null;

	public static async asImage(): Promise<Buffer> {
		if (QR.qr == null) {
			throw new Error('QR code not generated');
		}

		return QRCode.toBuffer(QR.qr, { type: 'png' });
	}
}
