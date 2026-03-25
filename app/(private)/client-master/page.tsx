import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { AxiosError } from "axios";
import ClientMasterTable from "./components/client-master-table";

const ClientMasterPage = async () => {
	const { data, totalPages, totalCount } = await fetchClients();

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-2xl font-bold">Client Master</h1>
				<p className="text-muted-foreground text-sm">Manage client companies and their details</p>
			</div>
			<ClientMasterTable initialData={data} initialTotalPages={totalPages} initialTotalCount={totalCount} />
		</div>
	);
};

export default ClientMasterPage;

const fetchClients = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	try {
		const response = await axios.get("/api/v1/client?page=1&size=10&sortBy=createdAt&sortOrder=desc", {
			headers: { cookie: `accessToken=${token}; refreshToken=${refreshToken}` },
		});
		const result = response?.data?.data;
		return {
			data: (result?.data ?? []) as Client[],
			totalPages: (result?.totalPages ?? 0) as number,
			totalCount: (result?.totalCount ?? 0) as number,
		};
	} catch (error: unknown) {
		const errorData = (error as AxiosError)?.response?.data as ErrorData;
		console.error(errorData?.message);
		return { data: [] as Client[], totalPages: 0, totalCount: 0 };
	}
};
