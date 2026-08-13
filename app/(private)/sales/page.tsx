import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import SalesTable from "./components/sales-table";
import SalesDashboard from "./components/sales-dashboard";

const SalesPage = async () => {
	const { data, totalPages, totalCount, stats, fulfillment } = await fetchInitialData();

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-2xl font-bold">Sales</h1>
				<p className="text-muted-foreground text-sm">Sales dispatch register — import and analyze invoiced/dispatched material</p>
			</div>
			<SalesDashboard initialStats={stats} initialFulfillment={fulfillment} />
			<SalesTable initialData={data} initialTotalPages={totalPages} initialTotalCount={totalCount} />
		</div>
	);
};

export default SalesPage;

const fetchInitialData = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	const headers = { cookie: `accessToken=${token}; refreshToken=${refreshToken}` };

	const [salesResult, statsResult, fulfillmentResult] = await Promise.allSettled([
		axios.get("/api/v1/sales?page=1&size=10&sortBy=dispatchDate&sortOrder=desc", { headers }),
		axios.get("/api/v1/sales/stats", { headers }),
		axios.get("/api/v1/sales/po-fulfillment?limit=20", { headers }),
	]);

	const salesData = salesResult.status === "fulfilled" ? salesResult.value?.data?.data : null;
	const statsData = statsResult.status === "fulfilled" ? statsResult.value?.data?.data : null;
	const fulfillmentData = fulfillmentResult.status === "fulfilled" ? fulfillmentResult.value?.data?.data : null;

	return {
		data: (salesData?.data ?? []) as SalesRecord[],
		totalPages: (salesData?.totalPages ?? 0) as number,
		totalCount: (salesData?.total ?? 0) as number,
		stats: (statsData ??
			({ overview: { totalValue: 0, totalQuantity: 0, totalInvoices: 0, totalCompanies: 0 }, trend: [], topCustomers: [], topItems: [] } as SalesStats)) as SalesStats,
		fulfillment: (fulfillmentData ?? ({ summary: { fullyDispatched: 0, partiallyDispatched: 0, notDispatched: 0 }, pos: [] } as PoFulfillmentResult)) as PoFulfillmentResult,
	};
};
