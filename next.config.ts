import { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
	images: {
		remotePatterns: [{ hostname: "flagcdn.com", pathname: "**", protocol: "https" }],
	},
	logging: {
		fetches: {
			fullUrl: true,
		},
	},
	reactStrictMode: true,
	async headers() {
		return [
			{
				source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
				headers: [
					{ key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
					{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "X-Frame-Options", value: "DENY" },
					{ key: "X-XSS-Protection", value: "1; mode=block" },
					{ key: "X-Permitted-Cross-Domain-Policies", value: "none" },
					{ key: "Cache-Control", value: "no-store, max-age=0, no-cache" },
					{ key: "Cross-Origin-Opener-Policy", value: "same-origin" },
				],
			},
		];
	},
	async redirects() {
		return [
			{
				source: "/",
				destination: "/dashboard",
				permanent: true,
			},
		];
	},
};

export default nextConfig;
