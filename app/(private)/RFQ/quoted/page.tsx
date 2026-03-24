import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { AxiosError } from "axios";
import { RfqTable } from "../components";
import { quotedRfqColumns } from "./components";

const QuotedRFQPage = async () => {
	const { data, totalPages, totalCount } = await fetchQuotedRfqs();

	return (
		<section className="flex h-full min-h-[calc(100vh-4rem)] w-full flex-col items-center gap-2 overflow-auto p-5">
			<div className="flex w-full items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Quoted RFQ</h1>
					<p className="text-sm text-muted-foreground">RFQs that have been quoted</p>
				</div>
			</div>
			<RfqTable columns={quotedRfqColumns} initialData={data} isQuotedFilter={true} totalElements={totalCount} totalPages={totalPages} />
		</section>
	);
};

export default QuotedRFQPage;

const fetchQuotedRfqs = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	try {
		const response = await axios.get("/api/v1/rfq/all?page=1&size=10&sortBy=quotedOn&sortOrder=desc&isQuoted=true", {
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
