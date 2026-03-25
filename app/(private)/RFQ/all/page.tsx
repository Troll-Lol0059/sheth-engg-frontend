import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { AxiosError } from "axios";
import { RfqTable } from "../components";
import { allRfqColumns } from "./components";

const AllRFQPage = async () => {
	const { data, totalPages, totalCount } = await fetchAllRfqs();

	return (
		<section className="flex h-full min-h-[calc(100vh-4rem)] w-full flex-col items-center gap-2 overflow-auto p-5">
			<div className="flex w-full items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">All RFQs</h1>
					<p className="text-muted-foreground text-sm">Complete list of all RFQs — pending, quoted, revised, and regret</p>
				</div>
			</div>
			<RfqTable columns={allRfqColumns} initialData={data} totalElements={totalCount} totalPages={totalPages} />
		</section>
	);
};

export default AllRFQPage;

const fetchAllRfqs = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	try {
		const response = await axios.get("/api/v1/rfq/all?page=1&size=10&sortBy=createdAt&sortOrder=desc", {
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
