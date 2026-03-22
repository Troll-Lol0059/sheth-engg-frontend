import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { AxiosError } from "axios";
import RfqViewContent from "./components/rfq-view-content";

type SearchParams = Promise<{ rfqId?: string }>;

const RfqViewPage = async ({ searchParams }: { searchParams: SearchParams }) => {
	const { rfqId } = await searchParams;

	if (!rfqId) {
		return (
			<div className="flex h-[60vh] items-center justify-center">
				<p className="text-muted-foreground">No RFQ ID provided.</p>
			</div>
		);
	}

	const rfq = await fetchRfq(rfqId);

	if (!rfq) {
		return (
			<div className="flex h-[60vh] flex-col items-center justify-center gap-4">
				<p className="text-muted-foreground">Failed to load RFQ details.</p>
			</div>
		);
	}

	return <RfqViewContent rfq={rfq} />;
};

export default RfqViewPage;

const fetchRfq = async (rfqId: string) => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	try {
		const response = await axios.get(`/api/v1/rfq/${rfqId}`, {
			headers: { cookie: `accessToken=${token}; refreshToken=${refreshToken}` },
		});
		return response?.data?.data as Rfq;
	} catch (error: unknown) {
		const errorData = (error as AxiosError)?.response?.data as ErrorData;
		console.error(errorData?.message);
		return null;
	}
};
