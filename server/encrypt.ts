
const password = 'my-secret-password-123';

// 从密码派生出 256-bit AES-CBC 密钥
async function deriveKeyFromPassword(password: string)
{
	const encoder = new TextEncoder();
	const hash = await crypto.subtle.digest('SHA-256', encoder.encode(password));
	return crypto.subtle.importKey(
		'raw',
		hash,
		{ name: 'AES-CBC' },
		false,
		['encrypt', 'decrypt']
	);
}
let key: CryptoKey | undefined;
export async function encrypt(text: string)
{
	const encoder = new TextEncoder();
	const iv = crypto.getRandomValues(new Uint8Array(16));
	//const key = await deriveKeyFromPassword(password);
	if (!key) key = await deriveKeyFromPassword(password);
	const encryptedBuffer = await crypto.subtle.encrypt(
		{ name: 'AES-CBC', iv },
		key,
		encoder.encode(text)
	);

	// 拼接 iv + 密文
	const resultBytes = new Uint8Array(iv.byteLength + encryptedBuffer.byteLength);
	resultBytes.set(iv, 0);
	resultBytes.set(new Uint8Array(encryptedBuffer), iv.byteLength);

	return toHex(resultBytes);
}

export async function decrypt(str: string)
{
	const bytes = fromHex(str);

	const iv = bytes.slice(0, 16);
	const encrypted = bytes.slice(16);

	if (!key) key = await deriveKeyFromPassword(password);
	const decryptedBuffer = await crypto.subtle.decrypt(
		{ name: 'AES-CBC', iv },
		key,
		encrypted
	);

	const decoder = new TextDecoder();
	return decoder.decode(decryptedBuffer);
}

function toHex(buf: ArrayLike<number>): string
{
	const buf2 = new Uint8Array(buf);
	return Array.from(buf2).map(x => x.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): ArrayBuffer
{
	if (hex.length % 2 !== 0) throw new Error("Invalid hex string");
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2)
	{
		let t = parseInt(hex.substring(i, i + 2), 16);
		if (!(t >= 0 && t <= 0xff)) throw new Error("Invalid hex string");
		bytes[i / 2] = t;
	}
	return bytes.buffer;
}