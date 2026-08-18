"use client";
import { useEffect, useState } from "react";
import { ColumnDef, flexRender, getCoreRowModel, PaginationState, useReactTable } from "@tanstack/react-table";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useQuery, QueryKey } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Badge } from "@components/ui/badge";
import { TablePaginationControls } from "@components/common/table-pagination-controls";
import { Clock, Loader2 } from "lucide-react";

const formatDate = (date?: string) => {
	if (!date) return "—";
	return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const columns: ColumnDef<PaymentAgingInvoice>[] = [
	{
		accessorKey: "invoiceNumber",
		header: "Invoice No.",
		cell: ({ row }) => <span className="font-medium">{row.getValue("invoiceNumber")}</span>,
	},
	{
		accessorKey: "invoiceDate",
		header: "Invoice Date",
		cell: ({ row }) => formatDate(row.getValue("invoiceDate")),
	},
	{
		accessorKey: "daysOverdue",
		header: "Days Overdue",
		cell: ({ row }) => <Badge variant="destructive">{row.getValue("daysOverdue")} days</Badge>,
	},
	{
		accessorKey: "poNumber",
		header: "PO Number",
		cell: ({ row }) => row.original.poNumber || "—",
	},
	{
		accessorKey: "companyName",
		header: "Company",
		cell: ({ row }) => row.original.companyName || "—",
	},
];

type AgingTableProps = {
	initialData: PaymentAgingInvoice[];
	initialTotalPages: number;
	initialTotalCount: number;
};

const AgingTable = ({ initialData, initialTotalPages, initialTotalCount }: AgingTableProps) => {
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [pageCount, setPageCount] = useState<number>(initialTotalPages);
	const [totalElementsCount, setTotalElementsCount] = useState<number>(initialTotalCount);
	const [mounted, setMounted] = useState<boolean>(false);

	const fetchAging = async ({ queryKey }: { queryKey: QueryKey }) => {
		const [, page, size] = queryKey as [string, number, number];
		try {
			const params = new URLSearchParams();
			params.append("page", String((page ?? 0) + 1));
			params.append("size", size?.toString() || "10");

			const response = await axios.get(`/api/v1/payment/aging?${params.toString()}`);
			const result = response?.data?.data as PaymentAgingResult;
			setPageCount(result?.totalPages ?? 0);
			setTotalElementsCount(result?.total ?? 0);
			return result?.invoices ?? [];
		} catch (error: unknown) {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			console.error(errorData?.message);
			return [];
		}
	};

	const { data, isFetching } = useQuery<PaymentAgingInvoice[]>({
		queryKey: ["payment-aging", pagination.pageIndex, pagination.pageSize],
		queryFn: fetchAging,
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
			<p className="text-muted-foreground text-sm">Invoices with no payment recorded against them at all, older than 45 days.</p>
			<div className="w-full flex-1 rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map(headerGroup => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map(header => (
									<TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{isFetching ? (
							<TableRow>
								<TableCell className="h-32 text-center" colSpan={columns.length}>
									<div className="flex items-center justify-center">
										<Loader2 className="text-primary animate-spin" size={32} />
									</div>
								</TableCell>
							</TableRow>
						) : table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map(row => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map(cell => (
										<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell className="h-24 text-center" colSpan={columns.length}>
									<div className="flex flex-col items-center gap-2">
										<Clock className="text-muted-foreground h-10 w-10" />
										<p className="text-muted-foreground">No overdue invoices found</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<TablePaginationControls footerHeading="overdue invoices" table={table} totalElementsCount={totalElementsCount} />
		</div>
	);
};

export default AgingTable;
