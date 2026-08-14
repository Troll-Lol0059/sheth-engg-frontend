"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import axios from "@config/axios";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@components/ui/chart";
import { AlertTriangle, ArrowUpRight, Building2, CheckCircle2, Clock, IndianRupee, Package, Receipt } from "lucide-react";
import { ALL_FINANCIAL_YEARS } from "@lib/financialYear";
import FinancialYearSelect from "./financial-year-select";

const formatCurrency = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 }).format(value);
const formatCurrencyFull = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const trendChartConfig: ChartConfig = {
	totalValue: { label: "Sales Value", color: "var(--chart-1)" },
};

const rankChartConfig: ChartConfig = {
	totalValue: { label: "Sales Value", color: "var(--chart-1)" },
};

type SalesDashboardProps = {
	financialYear: string;
	onFinancialYearChange: (fy: string) => void;
	financialYears: string[];
	initialStats: SalesStats;
	initialFulfillment: PoFulfillmentResult;
};

const SalesDashboard = ({ financialYear, onFinancialYearChange, financialYears, initialStats, initialFulfillment }: SalesDashboardProps) => {
	const { data: stats } = useQuery<SalesStats>({
		queryKey: ["sales-stats", financialYear],
		queryFn: async () => {
			const params = financialYear && financialYear !== ALL_FINANCIAL_YEARS ? `?financialYear=${financialYear}` : "";
			const response = await axios.get(`/api/v1/sales/stats${params}`);
			return response?.data?.data as SalesStats;
		},
		initialData: initialStats,
	});

	const { data: fulfillment } = useQuery<PoFulfillmentResult>({
		queryKey: ["sales-fulfillment", financialYear],
		queryFn: async () => {
			const fyParam = financialYear && financialYear !== ALL_FINANCIAL_YEARS ? `&financialYear=${financialYear}` : "";
			const response = await axios.get(`/api/v1/sales/po-fulfillment?limit=20${fyParam}`);
			return response?.data?.data as PoFulfillmentResult;
		},
		initialData: initialFulfillment,
	});

	const overview = stats?.overview ?? { totalValue: 0, totalQuantity: 0, totalInvoices: 0, totalCompanies: 0 };
	const summary = fulfillment?.summary ?? { fullyDispatched: 0, partiallyDispatched: 0, notDispatched: 0 };

	const trendData = (stats?.trend ?? []).map(t => ({
		label: `${MONTH_LABELS[t.month - 1]} ${t.year}`,
		totalValue: t.totalValue,
		totalQuantity: t.totalQuantity,
	}));

	const topCustomersData = (stats?.topCustomers ?? []).map(c => ({ name: c.companyName, totalValue: c.totalValue }));
	const topItemsData = (stats?.topItems ?? []).map(i => ({ name: `${i.itemName} (${i.itemCode})`, totalValue: i.totalValue }));

	const pendingPos = (fulfillment?.pos ?? []).filter(po => po.status !== "FULLY_DISPATCHED").slice(0, 8);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">Overview</h2>
				<FinancialYearSelect value={financialYear} onValueChange={onFinancialYearChange} financialYears={financialYears} />
			</div>

			{/* KPI stat tiles */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardContent className="flex items-center gap-4 p-6">
						<div className="bg-primary/10 rounded-lg p-3">
							<IndianRupee className="text-primary h-6 w-6" />
						</div>
						<div>
							<p className="text-muted-foreground text-sm">Total Sales Value</p>
							<p className="text-2xl font-bold">{formatCurrencyFull(overview.totalValue)}</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="flex items-center gap-4 p-6">
						<div className="bg-primary/10 rounded-lg p-3">
							<Package className="text-primary h-6 w-6" />
						</div>
						<div>
							<p className="text-muted-foreground text-sm">Quantity Dispatched</p>
							<p className="text-2xl font-bold">{overview.totalQuantity.toLocaleString("en-IN")}</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="flex items-center gap-4 p-6">
						<div className="bg-primary/10 rounded-lg p-3">
							<Receipt className="text-primary h-6 w-6" />
						</div>
						<div>
							<p className="text-muted-foreground text-sm">Total Invoices</p>
							<p className="text-2xl font-bold">{overview.totalInvoices}</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="flex items-center gap-4 p-6">
						<div className="bg-primary/10 rounded-lg p-3">
							<Building2 className="text-primary h-6 w-6" />
						</div>
						<div>
							<p className="text-muted-foreground text-sm">Unique Customers</p>
							<p className="text-2xl font-bold">{overview.totalCompanies}</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Sales trend over time */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Sales Trend</CardTitle>
				</CardHeader>
				<CardContent>
					<ChartContainer config={trendChartConfig} className="aspect-auto h-[260px] w-full">
						<AreaChart data={trendData} margin={{ left: 8, right: 8 }}>
							<CartesianGrid vertical={false} />
							<XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
							<YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={formatCurrency} width={56} />
							<ChartTooltip content={<ChartTooltipContent formatter={value => formatCurrencyFull(Number(value))} />} />
							<Area dataKey="totalValue" type="monotone" fill="var(--color-totalValue)" fillOpacity={0.15} stroke="var(--color-totalValue)" strokeWidth={2} />
						</AreaChart>
					</ChartContainer>
				</CardContent>
			</Card>

			{/* Top customers & items */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Top Customers by Value</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer config={rankChartConfig} className="aspect-auto h-[280px] w-full">
							<BarChart data={topCustomersData} layout="vertical" margin={{ left: 8, right: 24 }}>
								<CartesianGrid horizontal={false} />
								<XAxis type="number" tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
								<YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={140} tick={{ fontSize: 11 }} />
								<ChartTooltip content={<ChartTooltipContent formatter={value => formatCurrencyFull(Number(value))} />} />
								<Bar dataKey="totalValue" fill="var(--color-totalValue)" radius={4} />
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Top Items by Value</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer config={rankChartConfig} className="aspect-auto h-[280px] w-full">
							<BarChart data={topItemsData} layout="vertical" margin={{ left: 8, right: 24 }}>
								<CartesianGrid horizontal={false} />
								<XAxis type="number" tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
								<YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={140} tick={{ fontSize: 11 }} />
								<ChartTooltip content={<ChartTooltipContent formatter={value => formatCurrencyFull(Number(value))} />} />
								<Bar dataKey="totalValue" fill="var(--color-totalValue)" radius={4} />
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>
			</div>

			{/* PO fulfillment */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-base">PO Fulfillment</CardTitle>
					<Link href={financialYear && financialYear !== ALL_FINANCIAL_YEARS ? `/sales/by-po?financialYear=${financialYear}` : "/sales/by-po"} className="text-primary flex items-center gap-1 text-sm hover:underline">
						View by PO
						<ArrowUpRight size={14} />
					</Link>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
						<div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
							<CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
							<div>
								<p className="text-sm text-emerald-700 dark:text-emerald-400">Fully Dispatched</p>
								<p className="text-xl font-bold text-emerald-800 dark:text-emerald-300">{summary.fullyDispatched}</p>
							</div>
						</div>
						<div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
							<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
							<div>
								<p className="text-sm text-amber-700 dark:text-amber-400">Partially Dispatched</p>
								<p className="text-xl font-bold text-amber-800 dark:text-amber-300">{summary.partiallyDispatched}</p>
							</div>
						</div>
						<div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
							<AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
							<div>
								<p className="text-sm text-red-700 dark:text-red-400">Not Dispatched</p>
								<p className="text-xl font-bold text-red-800 dark:text-red-300">{summary.notDispatched}</p>
							</div>
						</div>
					</div>

					{pendingPos.length > 0 && (
						<div className="overflow-x-auto rounded-md border">
							<table className="w-full text-sm">
								<thead className="bg-muted/50">
									<tr>
										<th className="p-2 text-left font-medium">PO Number</th>
										<th className="p-2 text-left font-medium">Company</th>
										<th className="p-2 text-left font-medium">Status</th>
										<th className="p-2 text-right font-medium">Pending Qty</th>
									</tr>
								</thead>
								<tbody>
									{pendingPos.map(po => (
										<tr key={po.poNumber} className="border-t">
											<td className="max-w-[160px] truncate p-2" title={po.poNumber}>
												{po.poNumber}
											</td>
											<td className="max-w-[200px] truncate p-2" title={po.companyName}>
												{po.companyName}
											</td>
											<td className="p-2">
												{po.status === "PARTIALLY_DISPATCHED" ? (
													<span className="text-amber-600 dark:text-amber-400">Partial</span>
												) : (
													<span className="text-red-600 dark:text-red-400">Not dispatched</span>
												)}
											</td>
											<td className="p-2 text-right">{po.pendingQty.toLocaleString("en-IN")}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default SalesDashboard;
