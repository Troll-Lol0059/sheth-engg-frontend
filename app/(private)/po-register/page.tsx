import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import PORegisterTable from "./components/po-register-table";
import ModuleHelp from "@components/common/module-help";
import { poRegisterHelp } from "@data/helpData";

const PORegisterPage = async () => {
	const { data, totalPages, totalCount, stats, clients } = await fetchInitialData();

	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">PO Register</h1>
					<p className="text-muted-foreground text-sm">Purchase Order Register — import and view all POs</p>
				</div>
				<ModuleHelp description="Guide to managing purchase orders" sections={poRegisterHelp} title="PO Register — Help" />
			</div>
			<PORegisterTable initialData={data} initialTotalPages={totalPages} initialTotalCount={totalCount} initialStats={stats} initialClients={clients} />
		</div>
	);
};

export default PORegisterPage;

const fetchInitialData = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	const headers = { cookie: `accessToken=${token}; refreshToken=${refreshToken}` };

	const [posResult, statsResult, clientsResult] = await Promise.allSettled([
		axios.get("/api/v1/po-register?page=1&size=10&sortBy=createdAt&sortOrder=desc", { headers }),
		axios.get("/api/v1/po-register/stats", { headers }),
		axios.get("/api/v1/client?all=true", { headers }),
	]);

	const posData = posResult.status === "fulfilled" ? posResult.value?.data?.data : null;
	const statsData = statsResult.status === "fulfilled" ? statsResult.value?.data?.data : null;
	const clientsData = clientsResult.status === "fulfilled" ? clientsResult.value?.data?.data : [];

	const overview = statsData?.overview?.[0];

	return {
		data: (posData?.data ?? []) as PORegister[],
		totalPages: (posData?.totalPages ?? 0) as number,
		totalCount: (posData?.total ?? 0) as number,
		stats: {
			totalPOs: overview?.totalPOs ?? 0,
			totalValue: overview?.totalValue ?? 0,
			totalCompanies: overview?.companies?.length ?? 0,
			byCompany: statsData?.byCompany ?? [],
			byYear: statsData?.byYear ?? [],
		} as POStats,
		clients: (clientsData ?? []) as Client[],
	};
};
