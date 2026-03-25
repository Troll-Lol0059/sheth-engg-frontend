import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { AxiosError } from "axios";
import { ProfileContent } from "./components";

const ProfilePage = async () => {
	const profileData = await fetchProfile();
	return <ProfileContent initialData={profileData} />;
};

export default ProfilePage;

const fetchProfile = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	try {
		const response = await axios.get("/api/v1/user/profile", {
			headers: { cookie: `accessToken=${token}; refreshToken=${refreshToken}` },
		});
		return response?.data?.data ?? null;
	} catch (error: unknown) {
		const errorData = (error as AxiosError)?.response?.data as ErrorData;
		console.error(errorData?.message);
		return null;
	}
};
