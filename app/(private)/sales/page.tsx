import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { getCurrentFinancialYear } from "@lib/financialYear";
import SalesPageClient from "./components/sales-page-client";

const SalesPage = async () => {
	const { financialYear, financialYears, invoices, totalPages, totalCount, stats, fulfillment } = await fetchInitialData();

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-2xl font-bold">Sales</h1>
				<p className="text-muted-foreground text-sm">Sales dispatch register — import and analyze invoiced/dispatched material</p>
			</div>
			<SalesPageClient
				initialFinancialYear={financialYear}
				financialYears={financialYears}
				initialInvoices={invoices}
				initialTotalPages={totalPages}
				initialTotalCount={totalCount}
				initialStats={stats}
				initialFulfillment={fulfillment}
			/>
		</div>
	);
};

export default SalesPage;

const fetchInitialData = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	const headers = { cookie: `accessToken=${token}; refreshToken=${refreshToken}` };

	const financialYearsResult = await axios.get("/api/v1/sales/financial-years", { headers }).catch(() => null);
	const financialYearsFromData: string[] = financialYearsResult?.data?.data ?? [];

	// Always default to the current calendar FY, even if it has no data yet —
	// but make sure it's actually selectable in the dropdown by merging it into
	// the option list (financialYearsFromData only contains years that HAVE data).
	const financialYear = getCurrentFinancialYear();
	const financialYears = [...new Set([financialYear, ...financialYearsFromData])].sort((a, b) => b.localeCompare(a));

	const [invoicesResult, statsResult, fulfillmentResult] = await Promise.allSettled([
		axios.get(`/api/v1/sales/invoices?page=1&size=10&sortBy=dispatchDate&sortOrder=desc&financialYear=${financialYear}`, { headers }),
		axios.get(`/api/v1/sales/stats?financialYear=${financialYear}`, { headers }),
		axios.get(`/api/v1/sales/po-fulfillment?limit=20&financialYear=${financialYear}`, { headers }),
	]);

	const invoicesData = invoicesResult.status === "fulfilled" ? invoicesResult.value?.data?.data : null;
	const statsData = statsResult.status === "fulfilled" ? statsResult.value?.data?.data : null;
	const fulfillmentData = fulfillmentResult.status === "fulfilled" ? fulfillmentResult.value?.data?.data : null;

	return {
		financialYear,
		financialYears,
		invoices: (invoicesData?.data ?? []) as SalesInvoiceSummary[],
		totalPages: (invoicesData?.totalPages ?? 0) as number,
		totalCount: (invoicesData?.total ?? 0) as number,
		stats: (statsData ??
			({ overview: { totalValue: 0, totalQuantity: 0, totalInvoices: 0, totalCompanies: 0 }, trend: [], topCustomers: [], topItems: [] } as SalesStats)) as SalesStats,
		fulfillment: (fulfillmentData ?? ({ summary: { fullyDispatched: 0, partiallyDispatched: 0, notDispatched: 0 }, pos: [] } as PoFulfillmentResult)) as PoFulfillmentResult,
	};
};
