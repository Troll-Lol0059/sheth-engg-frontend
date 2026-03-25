import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { AxiosError } from "axios";
import { VendorComparisonContent } from "./components";

const VendorComparisonPage = async () => {
	const initialData = await fetchVendorComparison();

	return <VendorComparisonContent initialData={initialData} />;
};

export default VendorComparisonPage;

const fetchVendorComparison = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	try {
		const response = await axios.get("/api/v1/rate-history/vendor-comparison?type=material", {
			headers: { cookie: `accessToken=${token}; refreshToken=${refreshToken}` },
		});
		return (response?.data?.data ?? []) as Record<string, unknown>[];
	} catch (error: unknown) {
		const errorData = (error as AxiosError)?.response?.data as ErrorData;
		console.error(errorData?.message);
		return [] as Record<string, unknown>[];
	}
};
