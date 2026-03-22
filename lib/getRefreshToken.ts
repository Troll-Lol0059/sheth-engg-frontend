import { cookies } from "next/headers";
export const getRefreshToken = async () => {
	const token = (await cookies()).get("refreshToken")?.value;
	return token;
};