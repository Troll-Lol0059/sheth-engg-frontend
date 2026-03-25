import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { AxiosError } from "axios";
import { PartyTable, AddPartyDialog, ImportExcelDialog } from "./components";
import { partyColumns } from "./components/party-columns";
import ModuleHelp from "@components/common/module-help";
import { partyHelp } from "@data/helpData";

const PartyPage = async () => {
	const { data, totalPages, totalCount } = await fetchParties();

	return (
		<section className="flex h-full min-h-[calc(100vh-4rem)] w-full flex-col items-center gap-2 overflow-auto p-5">
			<div className="flex w-full items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Party Master</h1>
					<p className="text-sm text-muted-foreground">Manage your party records and contacts</p>
				</div>
				<div className="flex gap-2">
					<ModuleHelp description="Guide to managing vendors and suppliers" sections={partyHelp} title="Party Master — Help" />
					<ImportExcelDialog />
					<AddPartyDialog />
				</div>
			</div>
			<PartyTable columns={partyColumns} initialData={data} totalElements={totalCount} totalPages={totalPages} />
		</section>
	);
};

export default PartyPage;

const fetchParties = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	try {
		const response = await axios.get("/api/v1/party/all?page=1&size=10&sortBy=createdAt&sortOrder=desc", {
			headers: { cookie: `accessToken=${token}; refreshToken=${refreshToken}` },
		});
		const result = response?.data?.data;
		return {
			data: (result?.data ?? []) as Party[],
			totalPages: (result?.totalPages ?? 0) as number,
			totalCount: (result?.totalCount ?? 0) as number,
		};
	} catch (error: unknown) {
		const errorData = (error as AxiosError)?.response?.data as ErrorData;
		console.error(errorData?.message);
		return { data: [] as Party[], totalPages: 0, totalCount: 0 };
	}
};
