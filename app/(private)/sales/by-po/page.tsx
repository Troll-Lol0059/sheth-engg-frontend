import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { getCurrentFinancialYear, ALL_FINANCIAL_YEARS } from "@lib/financialYear";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PoDispatchTable from "./components/po-dispatch-table";

type PoDispatchPageProps = {
	searchParams: Promise<{ financialYear?: string }>;
};

const PoDispatchPage = async ({ searchParams }: PoDispatchPageProps) => {
	const params = await searchParams;
	const { financialYear, financialYears, data, totalPages, totalCount } = await fetchInitialData(params.financialYear);

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<Link href="/sales" className="text-muted-foreground mb-2 flex items-center gap-1 text-sm hover:underline">
					<ArrowLeft size={14} />
					Back to Sales
				</Link>
				<h1 className="text-2xl font-bold">Dispatch by PO</h1>
				<p className="text-muted-foreground text-sm">Ordered vs dispatched quantity per PO, with consignment and transporter history</p>
			</div>
			<PoDispatchTable initialFinancialYear={financialYear} financialYears={financialYears} initialData={data} initialTotalPages={totalPages} initialTotalCount={totalCount} />
		</div>
	);
};

export default PoDispatchPage;

const fetchInitialData = async (requestedFy?: string) => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	const headers = { cookie: `accessToken=${token}; refreshToken=${refreshToken}` };

	const financialYearsResult = await axios.get("/api/v1/sales/financial-years", { headers }).catch(() => null);
	const financialYearsFromData: string[] = financialYearsResult?.data?.data ?? [];

	const financialYear = requestedFy || getCurrentFinancialYear();
	const financialYears = [...new Set([getCurrentFinancialYear(), ...financialYearsFromData])].sort((a, b) => b.localeCompare(a));

	try {
		const fyParam = financialYear !== ALL_FINANCIAL_YEARS ? `&financialYear=${financialYear}` : "";
		const response = await axios.get(`/api/v1/sales/by-po?page=1&size=20${fyParam}`, { headers });
		const result = response?.data?.data;
		return {
			financialYear,
			financialYears,
			data: (result?.data ?? []) as PoDispatchListItem[],
			totalPages: (result?.totalPages ?? 0) as number,
			totalCount: (result?.total ?? 0) as number,
		};
	} catch {
		return { financialYear, financialYears, data: [] as PoDispatchListItem[], totalPages: 0, totalCount: 0 };
	}
};
