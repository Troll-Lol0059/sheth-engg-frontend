import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";

export async function getServerSession() {
	const token = (await cookies()).get("accessToken")?.value;
	const decodedToken: Token | null = token ? jwtDecode(token) : null;
	const session: AuthSession = {
		uuid: decodedToken?.sub || null,
		avatarUrl: decodedToken?.avatarUrl || null,
		name: decodedToken?.name || null,
		email: decodedToken?.email || null,
		contactNo: decodedToken?.contactNo || null,
		roles: decodedToken?.roles || [],
	};
	return session;
}