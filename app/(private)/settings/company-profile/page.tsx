import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { AxiosError } from "axios";
import { CompanyProfileForm } from "./components";

const CompanyProfilePage = async () => {
	const profileData = await fetchCompanyProfile();

	return <CompanyProfileForm initialData={profileData} />;
};

export default CompanyProfilePage;

const fetchCompanyProfile = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	try {
		const response = await axios.get("/api/v1/company-profile", {
			headers: { cookie: `accessToken=${token}; refreshToken=${refreshToken}` },
		});
		return response?.data?.data ?? null;
	} catch (error: unknown) {
		const errorData = (error as AxiosError)?.response?.data as ErrorData;
		console.error(errorData?.message);
		return null;
	}
};
