import { cookies } from "next/headers";
export const getRefreshToken = async () => {
	const token = (await cookies()).get("REFRESH_TOKEN")?.value;
	return token;
};