import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
	const apiUrl = process.env.NEXT_PUBLIC_API_URL;
	const cookieStore = await cookies();
	const refreshToken = cookieStore.get("refreshToken")?.value;

	if (!refreshToken) {
		return NextResponse.json({ success: false, message: "No refresh token" }, { status: 401 });
	}

	const res = await fetch(`${apiUrl}/api/v1/user/refresh-token`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ refreshToken }),
	});

	const data = await res.json();

	if (!res.ok) {
		cookieStore.delete("accessToken");
		cookieStore.delete("refreshToken");
		return NextResponse.json(data, { status: res.status });
	}

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
