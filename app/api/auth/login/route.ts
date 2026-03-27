import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	const body = await request.json();
	const apiUrl = process.env.NEXT_PUBLIC_API_URL;

	const res = await fetch(`${apiUrl}/api/v1/user/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	const data = await res.json();

	if (!res.ok) {
		return NextResponse.json(data, { status: res.status });
	}

	const cookieStore = await cookies();
	const isProduction = process.env.NODE_ENV === "production";

	cookieStore.set("accessToken", data.data.accessToken, {
		httpOnly: true,
		secure: isProduction,
		sameSite: "lax",
		path: "/",
		maxAge: 3600,
	});

	cookieStore.set("refreshToken", data.data.refreshToken, {
		httpOnly: true,
		secure: isProduction,
		sameSite: "lax",
		path: "/",
		maxAge: 604800,
	});

	return NextResponse.json(data);
}
