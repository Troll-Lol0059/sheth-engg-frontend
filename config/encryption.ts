import crypto from "crypto";

export function encrypt(data: string) {
	const key = process.env.NEXT_PUBLIC_AES_CRYPTO_KEY as string;
	const iv = crypto.randomBytes(16);

	const ivBuffer = Buffer.from(iv);
	const keyBuffer = Buffer.from(key, "utf-8");

	const cipher = crypto.createCipheriv("aes-256-cbc", keyBuffer, ivBuffer);

	let encrypted = cipher.update(data, "utf-8", "base64");
	encrypted += cipher.final("base64");

	return `${iv.toString("base64")}:${encrypted}`;
}
