import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";

export async function getServerSession() {
	const token = (await cookies()).get("accessToken")?.value;
	const decodedToken: Token | null = token ? jwtDecode(token) : null;
	const session: AuthSession = {
		uuid: decodedToken?._id || null,
		avatarUrl: null,
		name: decodedToken?.userName || null,
		email: decodedToken?.email || null,
		contactNo: null,
		roles: decodedToken?.role ? [decodedToken.role] : [],
	};
	return session;
}
