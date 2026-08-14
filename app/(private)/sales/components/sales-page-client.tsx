"use client";
import { useState } from "react";
import SalesDashboard from "./sales-dashboard";
import SalesTable from "./sales-table";

type SalesPageClientProps = {
	initialFinancialYear: string;
	financialYears: string[];
	initialInvoices: SalesInvoiceSummary[];
	initialTotalPages: number;
	initialTotalCount: number;
	initialStats: SalesStats;
	initialFulfillment: PoFulfillmentResult;
};

const SalesPageClient = ({ initialFinancialYear, financialYears, initialInvoices, initialTotalPages, initialTotalCount, initialStats, initialFulfillment }: SalesPageClientProps) => {
	const [financialYear, setFinancialYear] = useState<string>(initialFinancialYear);

	return (
		<div className="flex flex-col gap-6">
			<SalesDashboard
				financialYear={financialYear}
				onFinancialYearChange={setFinancialYear}
				financialYears={financialYears}
				initialStats={initialStats}
				initialFulfillment={initialFulfillment}
			/>
			<SalesTable
				financialYear={financialYear}
				onFinancialYearChange={setFinancialYear}
				financialYears={financialYears}
				initialData={initialInvoices}
				initialTotalPages={initialTotalPages}
				initialTotalCount={initialTotalCount}
			/>
		</div>
	);
};

export default SalesPageClient;
