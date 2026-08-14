"use client";
import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useQuery, QueryKey } from "@tanstack/react-query";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { TablePaginationControls } from "@components/common/table-pagination-controls";
import { Eye, Loader2, Search } from "lucide-react";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type PaginationState } from "@tanstack/react-table";
import { ALL_FINANCIAL_YEARS } from "@lib/financialYear";
import PoDispatchDetailSheet from "./po-dispatch-detail-sheet";

const formatDate = (date?: string) => {
	if (!date) return "—";
	return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const statusBadge = (status: PoDispatchListItem["status"]) => {
	switch (status) {
		case "FULLY_DISPATCHED":
			return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Fully Dispatched</Badge>;
		case "PARTIALLY_DISPATCHED":
			return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Partially Dispatched</Badge>;
		case "PO_NOT_FOUND":
			return <Badge variant="destructive">PO not in Register</Badge>;
		default:
			return <Badge variant="secondary">Not Dispatched</Badge>;
	}
};

const columns: ColumnDef<PoDispatchListItem>[] = [
	{ accessorKey: "poNumber", header: "PO Number" },
	{
		accessorKey: "companyName",
		header: "Company",
		cell: ({ row }) => (
			<span className="block max-w-[220px] truncate" title={row.getValue("companyName") as string}>
				{row.getValue("companyName")}
			</span>
		),
	},
	{ accessorKey: "poDate", header: "PO Date", cell: ({ row }) => formatDate(row.original.poDate) },
	{
		accessorKey: "orderedQty",
		header: "Ordered Qty",
		cell: ({ row }) => (row.original.orderedQty !== undefined ? row.original.orderedQty : "—"),
	},
	{ accessorKey: "dispatchedQty", header: "Dispatched Qty" },
	{
		accessorKey: "pendingQty",
		header: "Pending Qty",
		cell: ({ row }) => (row.original.pendingQty !== undefined ? row.original.pendingQty : "—"),
	},
	{ accessorKey: "invoiceCount", header: "Invoices" },
	{
		id: "status",
		header: "Status",
		cell: ({ row }) => statusBadge(row.original.status),
	},
];

type PoDispatchTableProps = {
	initialFinancialYear: string;
	financialYears: string[];
	initialData: PoDispatchListItem[];
	initialTotalPages: number;
	initialTotalCount: number;
};

const PoDispatchTable = ({ initialFinancialYear, financialYears, initialData, initialTotalPages, initialTotalCount }: PoDispatchTableProps) => {
	const [financialYear, setFinancialYear] = useState<string>(initialFinancialYear);
	const [filter, setFilter] = useState<string>("");
	const [globalFilter, setGlobalFilter] = useState<string>("");
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
	const [pageCount, setPageCount] = useState<number>(initialTotalPages);
	const [totalElementsCount, setTotalElementsCount] = useState<number>(initialTotalCount);
	const [mounted, setMounted] = useState<boolean>(false);
	const [viewingPoNumber, setViewingPoNumber] = useState<string | null>(null);

	useDebounce(() => setGlobalFilter(filter), 500, [filter]);

	const fetchPoDispatchList = async ({ queryKey }: { queryKey: QueryKey }) => {
		const [, fy, search, page, size] = queryKey as [string, string, string | undefined, number, number];
		try {
			const params = new URLSearchParams();
			params.append("page", String((page ?? 0) + 1));
			params.append("size", size?.toString() || "20");
			if (search) params.append("search", search);
			if (fy && fy !== ALL_FINANCIAL_YEARS) params.append("financialYear", fy);

			const response = await axios.get(`/api/v1/sales/by-po?${params.toString()}`);
			const result = response?.data?.data;
			setPageCount(result?.totalPages ?? 0);
			setTotalElementsCount(result?.total ?? 0);
			return (result?.data ?? []) as PoDispatchListItem[];
		} catch (error: unknown) {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			console.error(errorData?.message);
			return [];
		}
	};

	const { data, isFetching } = useQuery<PoDispatchListItem[]>({
		queryKey: ["sales-by-po", financialYear, globalFilter, pagination.pageIndex, pagination.pageSize],
		queryFn: fetchPoDispatchList,
		initialData: initialData,
	});

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		state: { pagination },
		onPaginationChange: setPagination,
		manualPagination: true,
		manualFiltering: true,
		pageCount,
	});

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;

	return (
		<>
			<div className="flex w-full flex-col items-center justify-end gap-1 py-1 sm:flex-row">
				<Select value={financialYear} onValueChange={setFinancialYear}>
					<SelectTrigger className="h-10 w-full sm:w-[140px]">
						<SelectValue placeholder="Financial Year" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL_FINANCIAL_YEARS}>All Years</SelectItem>
						{financialYears.map(fy => (
							<SelectItem key={fy} value={fy}>
								FY {fy}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Input className="h-10 max-w-sm" onChange={e => setFilter(e.target.value)} placeholder="Search PO number or company..." startContent={<Search size={16} />} value={filter} />
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
								<TableRow key={row.id}>
									{row.getVisibleCells().map(cell => (
										<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
									))}
									<TableCell>
										<Button size="sm" variant="ghost" onClick={() => setViewingPoNumber(row.original.poNumber)}>
											<Eye size={16} />
											View
										</Button>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell className="h-24 text-center text-muted-foreground" colSpan={columns.length + 1}>
									No PO dispatch records found
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<TablePaginationControls footerHeading="POs" table={table} totalElementsCount={totalElementsCount} />

			<PoDispatchDetailSheet poNumber={viewingPoNumber} financialYear={financialYear} onClose={() => setViewingPoNumber(null)} />
		</>
	);
};

export default PoDispatchTable;
