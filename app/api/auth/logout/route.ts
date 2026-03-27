import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
	const apiUrl = process.env.NEXT_PUBLIC_API_URL;
	const cookieStore = await cookies();
	const accessToken = cookieStore.get("accessToken")?.value;

	try {
		await fetch(`${apiUrl}/api/v1/user/logout`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
			},
		});
	} catch {
		// backend logout is best-effort; always clear local cookies
	}

	cookieStore.delete("accessToken");
	cookieStore.delete("refreshToken");

	return NextResponse.json({ success: true, message: "Logged out successfully" });
}
