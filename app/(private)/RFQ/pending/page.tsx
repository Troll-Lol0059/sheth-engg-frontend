import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { AxiosError } from "axios";
import { RfqTable, AddRfqDialog } from "../components";
import { rfqColumns } from "../components/rfq-columns";

const PendingRFQPage = async () => {
	const { data, totalPages, totalCount } = await fetchPendingRfqs();

	return (
		<section className="flex h-full min-h-[calc(100vh-4rem)] w-full flex-col items-center gap-2 overflow-auto p-5">
			<div className="flex w-full items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Pending RFQ</h1>
					<p className="text-sm text-muted-foreground">RFQs that are yet to be quoted</p>
				</div>
				<AddRfqDialog />
			</div>
			<RfqTable columns={rfqColumns} initialData={data} isQuotedFilter={false} totalElements={totalCount} totalPages={totalPages} />
		</section>
	);
};

export default PendingRFQPage;

const fetchPendingRfqs = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	try {
		const response = await axios.get("/api/v1/rfq/all?page=1&size=10&sortBy=createdAt&sortOrder=desc&isQuoted=false", {
			headers: { cookie: `accessToken=${token}; refreshToken=${refreshToken}` },
		});
		const result = response?.data?.data;
		return {
			data: (result?.data ?? []) as Rfq[],
			totalPages: (result?.totalPages ?? 0) as number,
			totalCount: (result?.totalCount ?? 0) as number,
		};
	} catch (error: unknown) {
		const errorData = (error as AxiosError)?.response?.data as ErrorData;
		console.error(errorData?.message);
		return { data: [] as Rfq[], totalPages: 0, totalCount: 0 };
	}
};
