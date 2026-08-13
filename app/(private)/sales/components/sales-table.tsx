"use client";
import { useEffect, useRef, useState } from "react";
import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, PaginationState, SortingState, useReactTable, VisibilityState } from "@tanstack/react-table";
import { useDebounce } from "react-use";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useQuery, useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { TablePaginationControls } from "@components/common/table-pagination-controls";
import { ArrowRightLeft, FileSpreadsheet, ListRestart, Loader2, Search, Upload } from "lucide-react";

const formatCurrency = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

const formatDate = (date: string) => {
	if (!date) return "—";
	return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

type ImportResult = {
	totalRows: number;
	imported: number;
	updated: number;
	skipped: number;
	rowErrors: string[];
	rowWarnings: string[];
	unmatchedPoNumbers: string[];
};

const columns: ColumnDef<SalesRecord>[] = [
	{
		accessorKey: "invoiceNumber",
		header: "Invoice No.",
		cell: ({ row }) => <span className="font-medium">{row.getValue("invoiceNumber")}</span>,
	},
	{
		accessorKey: "dispatchDate",
		header: "Dispatch Date",
		cell: ({ row }) => formatDate(row.getValue("dispatchDate") as string),
	},
	{
		accessorKey: "poNumber",
		header: "PO Number",
		cell: ({ row }) => {
			const po = row.original.poNumber;
			return (
				<span className="block max-w-[160px] truncate" title={po}>
					{po || "—"}
				</span>
			);
		},
	},
	{
		accessorKey: "companyName",
		header: "Company",
		cell: ({ row }) => (
			<span className="block max-w-[200px] truncate" title={row.getValue("companyName") as string}>
				{row.getValue("companyName")}
			</span>
		),
	},
	{
		accessorKey: "itemCode",
		header: "Item Code",
	},
	{
		accessorKey: "itemName",
		header: "Item Name",
		cell: ({ row }) => (
			<span className="block max-w-[200px] truncate" title={row.getValue("itemName") as string}>
				{row.getValue("itemName")}
			</span>
		),
	},
	{
		accessorKey: "quantity",
		header: "Qty",
		cell: ({ row }) => (
			<span>
				{row.getValue("quantity")} {row.original.uom}
			</span>
		),
	},
	{
		accessorKey: "netAmount",
		header: "Net Amount",
		cell: ({ row }) => <span className="font-medium">{formatCurrency(row.getValue("netAmount") as number)}</span>,
	},
	{
		accessorKey: "transporterName",
		header: "Transporter",
		cell: ({ row }) => row.original.transporterName || "—",
	},
	{
		id: "status",
		header: "Status",
		enableSorting: false,
		cell: () => <Badge variant="secondary">Dispatched</Badge>,
	},
];

type SalesTableProps = {
	initialData: SalesRecord[];
	initialTotalPages: number;
	initialTotalCount: number;
};

const SalesTable = ({ initialData, initialTotalPages, initialTotalCount }: SalesTableProps) => {
	const queryClient = useQueryClient();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [sorting, setSorting] = useState<SortingState>([{ id: "dispatchDate", desc: true }]);
	const [filter, setFilter] = useState<string>("");
	const [globalFilter, setGlobalFilter] = useState<string>(filter);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [pageCount, setPageCount] = useState<number>(initialTotalPages);
	const [totalElementsCount, setTotalElementsCount] = useState<number>(initialTotalCount);
	const [mounted, setMounted] = useState<boolean>(false);
	const [importResult, setImportResult] = useState<ImportResult | null>(null);

	useDebounce(() => setGlobalFilter(filter), 500, [filter]);

	const fetchSales = async ({ queryKey }: { queryKey: QueryKey }) => {
		const [, search, page, size, sortId, sortDesc] = queryKey as [string, string | undefined, number, number, string | undefined, string | undefined];
		try {
			const params = new URLSearchParams();
			params.append("page", String((page ?? 0) + 1));
			params.append("size", size?.toString() || "10");
			if (search) params.append("search", search);
			if (sortId) params.append("sortBy", sortId);
			if (sortDesc !== undefined) params.append("sortOrder", sortDesc === "true" ? "desc" : "asc");

			const response = await axios.get(`/api/v1/sales?${params.toString()}`);
			const result = response?.data?.data;
			setPageCount(result?.totalPages ?? 0);
			setTotalElementsCount(result?.total ?? 0);
			return (result?.data ?? []) as SalesRecord[];
		} catch (error: unknown) {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			console.error(errorData?.message);
			return [];
		}
	};

	const { data, isFetching } = useQuery<SalesRecord[]>({
		queryKey: ["sales", globalFilter, pagination.pageIndex, pagination.pageSize, sorting[0]?.id, sorting[0]?.desc ? "true" : "false"],
		queryFn: fetchSales,
		initialData: initialData,
	});

	const importMutation = useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("file", file);
			const response = await axios.post("/api/v1/sales/import", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			return response?.data?.data as ImportResult;
		},
		onSuccess: (result: ImportResult) => {
			toast.success(`Imported ${result.imported} rows, updated ${result.updated}, skipped ${result.skipped}`);
			if (result.rowErrors?.length || result.rowWarnings?.length || result.unmatchedPoNumbers?.length) {
				setImportResult(result);
			}
			queryClient.invalidateQueries({ queryKey: ["sales"] });
			queryClient.invalidateQueries({ queryKey: ["sales-stats"] });
			queryClient.invalidateQueries({ queryKey: ["sales-fulfillment"] });
		},
		onError: (error: AxiosError<ErrorData>) => {
			toast.error(error.response?.data?.message ?? "Failed to import sales CSV");
		},
	});

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			importMutation.mutate(file);
			e.target.value = "";
		}
	};

	const table = useReactTable({
		state: {
			sorting,
			globalFilter,
			columnFilters,
			columnVisibility,
			pagination,
		},
		data: data,
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		manualPagination: true,
		manualFiltering: true,
		manualSorting: true,
		pageCount,
	});

	const resetTableState = () => {
		setSorting([]);
		setColumnFilters([]);
		setColumnVisibility({});
		table.resetColumnVisibility();
		table.resetColumnFilters();
		table.resetSorting();
		setPagination({ pageIndex: 0, pageSize: 10 });
		setGlobalFilter("");
		setFilter("");
		table.resetGlobalFilter();
	};

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;

	return (
		<>
			{/* Search, Import, Reset, Columns */}
			<div className="flex w-full flex-col items-center justify-end gap-1 py-3 sm:flex-row">
				<Input className="h-10 max-w-sm" onChange={e => setFilter(e.target.value)} placeholder="Search invoice, PO, company, item code..." startContent={<Search size={16} />} value={filter} />
				<div className="mt-2 flex w-full flex-col items-center gap-2 sm:mt-0 sm:w-auto sm:flex-row">
					<input type="file" ref={fileInputRef} accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
					<Button className="w-full text-xs lg:w-auto" onClick={() => fileInputRef.current?.click()} disabled={importMutation.isPending} variant="outline">
						{importMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
						Import Sales Data
					</Button>
					<Button className="w-full text-xs lg:w-auto" onClick={resetTableState} variant="outline">
						<ListRestart size={16} />
						Reset
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button className="w-full text-xs lg:w-auto" variant="outline">
								<ArrowRightLeft size={16} />
								Columns
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{table
								.getAllColumns()
								.filter(column => column.getCanHide())
								.map(column => (
									<DropdownMenuCheckboxItem checked={column.getIsVisible()} className="capitalize" key={column.id} onCheckedChange={value => column.toggleVisibility(!!value)}>
										{column.id}
									</DropdownMenuCheckboxItem>
								))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Table */}
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
								<TableRow data-state={row.getIsSelected() && "selected"} key={row.id}>
									{row.getVisibleCells().map(cell => (
										<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell className="h-24 text-center" colSpan={columns.length}>
									<div className="flex flex-col items-center gap-2">
										<FileSpreadsheet className="text-muted-foreground h-10 w-10" />
										<p className="text-muted-foreground">No sales records found</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			<TablePaginationControls footerHeading="rows" table={table} totalElementsCount={totalElementsCount} />

			{/* Import result dialog — surfaces skipped rows / warnings / unmatched POs instead of collapsing into one toast */}
			<Dialog open={!!importResult} onOpenChange={open => !open && setImportResult(null)}>
				<DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Import details</DialogTitle>
					</DialogHeader>
					{importResult && (
						<div className="flex flex-col gap-4 text-sm">
							<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
								<div>
									<p className="text-muted-foreground">Total rows</p>
									<p className="font-medium">{importResult.totalRows}</p>
								</div>
								<div>
									<p className="text-muted-foreground">Imported</p>
									<p className="font-medium">{importResult.imported}</p>
								</div>
								<div>
									<p className="text-muted-foreground">Updated</p>
									<p className="font-medium">{importResult.updated}</p>
								</div>
								<div>
									<p className="text-muted-foreground">Skipped</p>
									<p className="font-medium">{importResult.skipped}</p>
								</div>
							</div>
							{importResult.unmatchedPoNumbers?.length > 0 && (
								<div>
									<p className="mb-1 font-medium">PO numbers not found in PO Register ({importResult.unmatchedPoNumbers.length})</p>
									<p className="text-muted-foreground break-words">{importResult.unmatchedPoNumbers.join(", ")}</p>
								</div>
							)}
							{importResult.rowWarnings?.length > 0 && (
								<div>
									<p className="mb-1 font-medium text-amber-600">Warnings ({importResult.rowWarnings.length})</p>
									<ul className="list-inside list-disc space-y-1 text-muted-foreground">
										{importResult.rowWarnings.map((w, i) => (
											<li key={i}>{w}</li>
										))}
									</ul>
								</div>
							)}
							{importResult.rowErrors?.length > 0 && (
								<div>
									<p className="mb-1 font-medium text-destructive">Skipped rows ({importResult.rowErrors.length})</p>
									<ul className="list-inside list-disc space-y-1 text-muted-foreground">
										{importResult.rowErrors.map((e, i) => (
											<li key={i}>{e}</li>
										))}
									</ul>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
};

export default SalesTable;
