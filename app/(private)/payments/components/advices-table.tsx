"use client";
import { useEffect, useState } from "react";
import { ColumnDef, flexRender, getCoreRowModel, PaginationState, useReactTable } from "@tanstack/react-table";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useQuery, QueryKey } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { TablePaginationControls } from "@components/common/table-pagination-controls";
import { Eye, Loader2, Receipt } from "lucide-react";
import AdviceDetailSheet from "./advice-detail-sheet";

const ALL_MATCH_STATUSES = "ALL";

const formatCurrency = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

const formatDate = (date?: string) => {
	if (!date) return "—";
	return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const getOverallStatus = (advice: PaymentAdvice): { label: string; variant: "success" | "warning" | "destructive" } => {
	if (advice.invoiceRows.some(row => row.matchStatus === "SHORT_PAYMENT")) return { label: "Short Payment", variant: "destructive" };
	if (advice.invoiceRows.some(row => row.matchStatus === "UNMATCHED")) return { label: "Unmatched", variant: "warning" };
	return { label: "Matched", variant: "success" };
};

const columns: ColumnDef<PaymentAdvice>[] = [
	{
		accessorKey: "paymentDate",
		header: "Payment Date",
		cell: ({ row }) => formatDate(row.getValue("paymentDate")),
	},
	{
		accessorKey: "payerCompanyName",
		header: "Payer Company",
		cell: ({ row }) => (
			<span className="block max-w-[200px] truncate" title={row.getValue("payerCompanyName") as string}>
				{row.getValue("payerCompanyName")}
			</span>
		),
	},
	{
		accessorKey: "utrNo",
		header: "UTR No.",
	},
	{
		accessorKey: "amount",
		header: "Amount",
		cell: ({ row }) => <span className="font-medium">{formatCurrency(row.getValue("amount"))}</span>,
	},
	{
		id: "invoiceNumbers",
		header: "Invoices",
		cell: ({ row }) => {
			const numbers = row.original.invoiceRows.map(r => r.invoiceNumber);
			return (
				<div className="flex max-w-[220px] flex-wrap gap-1">
					{numbers.slice(0, 3).map(n => (
						<Badge key={n} variant="outline">
							{n}
						</Badge>
					))}
					{numbers.length > 3 && <span className="text-muted-foreground text-xs">+{numbers.length - 3} more</span>}
				</div>
			);
		},
	},
	{
		id: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = getOverallStatus(row.original);
			return <Badge variant={status.variant}>{status.label}</Badge>;
		},
	},
];

type AdvicesTableProps = {
	initialData: PaymentAdvice[];
	initialTotalPages: number;
	initialTotalCount: number;
};

const AdvicesTable = ({ initialData, initialTotalPages, initialTotalCount }: AdvicesTableProps) => {
	const [matchStatus, setMatchStatus] = useState<string>(ALL_MATCH_STATUSES);
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [pageCount, setPageCount] = useState<number>(initialTotalPages);
	const [totalElementsCount, setTotalElementsCount] = useState<number>(initialTotalCount);
	const [selectedAdviceId, setSelectedAdviceId] = useState<string | null>(null);
	const [mounted, setMounted] = useState<boolean>(false);

	const fetchAdvices = async ({ queryKey }: { queryKey: QueryKey }) => {
		const [, status, page, size] = queryKey as [string, string, number, number];
		try {
			const params = new URLSearchParams();
			params.append("page", String((page ?? 0) + 1));
			params.append("size", size?.toString() || "10");
			if (status && status !== ALL_MATCH_STATUSES) params.append("matchStatus", status);

			const response = await axios.get(`/api/v1/payment/advices?${params.toString()}`);
			const result = response?.data?.data as PaymentAdviceListResult;
			setPageCount(result?.totalPages ?? 0);
			setTotalElementsCount(result?.total ?? 0);
			return result?.advices ?? [];
		} catch (error: unknown) {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			console.error(errorData?.message);
			return [];
		}
	};

	const { data, isFetching } = useQuery<PaymentAdvice[]>({
		queryKey: ["payment-advices", matchStatus, pagination.pageIndex, pagination.pageSize],
		queryFn: fetchAdvices,
		initialData: initialData,
	});

	const table = useReactTable({
		state: { pagination },
		data: data,
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
		onPaginationChange: setPagination,
		manualPagination: true,
		pageCount,
	});

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;

	return (
		<div className="flex flex-col gap-3 pt-3">
			<div className="flex w-full flex-col items-center justify-end gap-2 sm:flex-row">
				<Select value={matchStatus} onValueChange={setMatchStatus}>
					<SelectTrigger className="h-10 w-full sm:w-[200px]">
						<SelectValue placeholder="Match Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL_MATCH_STATUSES}>All Statuses</SelectItem>
						<SelectItem value="MATCHED">Matched</SelectItem>
						<SelectItem value="SHORT_PAYMENT">Short Payment</SelectItem>
						<SelectItem value="UNMATCHED">Unmatched</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="w-full flex-1 rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map(headerGroup => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map(header => (
									<TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
								))}
								<TableHead>Actions</TableHead>
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{isFetching ? (
							<TableRow>
								<TableCell className="h-32 text-center" colSpan={columns.length + 1}>
									<div className="flex items-center justify-center">
										<Loader2 className="text-primary animate-spin" size={32} />
									</div>
								</TableCell>
							</TableRow>
						) : table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map(row => (
								<TableRow className="cursor-pointer" key={row.id} onClick={() => setSelectedAdviceId(row.original._id)}>
									{row.getVisibleCells().map(cell => (
										<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
									))}
									<TableCell>
										<Button
											onClick={e => {
												e.stopPropagation();
												setSelectedAdviceId(row.original._id);
											}}
											size="sm"
											variant="ghost"
										>
											<Eye size={16} />
											View
										</Button>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell className="h-24 text-center" colSpan={columns.length + 1}>
									<div className="flex flex-col items-center gap-2">
										<Receipt className="text-muted-foreground h-10 w-10" />
										<p className="text-muted-foreground">No payment advices found</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<TablePaginationControls footerHeading="advices" table={table} totalElementsCount={totalElementsCount} />

			<AdviceDetailSheet adviceId={selectedAdviceId} onClose={() => setSelectedAdviceId(null)} />
		</div>
	);
};

export default AdvicesTable;
