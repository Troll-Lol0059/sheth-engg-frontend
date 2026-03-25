import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { AxiosError } from "axios";
import PORegisterDetail from "./components/po-register-detail";

const PORegisterDetailPage = async ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = await params;
	const poData = await fetchPODetail(id);

	return <PORegisterDetail poId={id} initialData={poData} />;
};

export default PORegisterDetailPage;

const fetchPODetail = async (id: string) => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	try {
		const response = await axios.get(`/api/v1/po-register/${id}`, {
			headers: { cookie: `accessToken=${token}; refreshToken=${refreshToken}` },
		});
		return (response?.data?.data ?? null) as PORegister | null;
	} catch (error: unknown) {
		const errorData = (error as AxiosError)?.response?.data as ErrorData;
		console.error(errorData?.message);
		return null;
	}
};
