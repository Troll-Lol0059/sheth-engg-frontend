import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { AxiosError } from "axios";
import { RfqTable } from "../components";
import { revisedRfqColumns } from "./components";
import ModuleHelp from "@components/common/module-help";
import { rfqRevisedHelp } from "@data/helpData";

const RevisedRFQPage = async () => {
	const { data, totalPages, totalCount } = await fetchRevisedRfqs();

	return (
		<section className="flex h-full min-h-[calc(100vh-4rem)] w-full flex-col items-center gap-2 overflow-auto p-5">
			<div className="flex w-full items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Revised RFQ</h1>
					<p className="text-sm text-muted-foreground">RFQs that have been revised after quoting</p>
				</div>
				<ModuleHelp description="Guide to revised quotations" sections={rfqRevisedHelp} title="Revised RFQ — Help" />
			</div>
			<RfqTable columns={revisedRfqColumns} initialData={data} isQuotedFilter={true} isRevisedFilter={true} totalElements={totalCount} totalPages={totalPages} />
		</section>
	);
};

export default RevisedRFQPage;

const fetchRevisedRfqs = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	try {
		const response = await axios.get("/api/v1/rfq/all?page=1&size=10&sortBy=revisionDate&sortOrder=desc&isQuoted=true&isRevised=true", {
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
