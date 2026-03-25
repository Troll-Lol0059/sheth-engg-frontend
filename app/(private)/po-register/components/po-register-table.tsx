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
import { Card, CardContent } from "@components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@components/ui/dropdown-menu";
import { TablePaginationControls } from "@components/common/table-pagination-controls";
import { ArrowRightLeft, Building2, FileSpreadsheet, Filter, IndianRupee, ListRestart, Loader2, Package, Search, Upload } from "lucide-react";
import Link from "next/link";

const formatCurrency = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

const formatDate = (date: string) => {
	if (!date) return "—";
	return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const columns: ColumnDef<PORegister>[] = [
	{
		accessorKey: "poNumber",
		header: "PO Number",
		cell: ({ row }) => {
			const po = row.getValue("poNumber") as string;
			return (
				<span className="block max-w-[200px] truncate font-medium" title={po}>
					{po || "—"}
				</span>
			);
		},
	},
	{
		accessorKey: "jobNumber",
		header: "Job Number",
		cell: ({ row }) => <span className="font-medium">{row.getValue("jobNumber")}</span>,
	},
	{
		accessorKey: "poDate",
		header: "PO Date",
		cell: ({ row }) => formatDate(row.getValue("poDate") as string),
	},
	{
		accessorKey: "deliveryDate",
		header: "Delivery Date",
		cell: ({ row }) => formatDate(row.getValue("deliveryDate") as string),
	},
	{
		accessorKey: "companyName",
		header: "Company",
	},
	{
		id: "itemsCount",
		header: "Items",
		enableSorting: false,
		cell: ({ row }) => <Badge variant="secondary">{row.original.items?.length ?? 0}</Badge>,
	},
	{
		accessorKey: "totalBasicValue",
		header: "Basic Value",
		cell: ({ row }) => formatCurrency(row.getValue("totalBasicValue") as number),
	},
	{
		accessorKey: "totalNetAmount",
		header: "Net Amount",
		cell: ({ row }) => <span className="font-medium">{formatCurrency(row.getValue("totalNetAmount") as number)}</span>,
	},
	{
		id: "actions",
		header: "Actions",
		enableSorting: false,
		cell: ({ row }) => (
			<Link href={`/po-register/${row.original._id}`}>
				<Button variant="outline" size="sm">
					View
				</Button>
			</Link>
		),
	},
];

type PORegisterTableProps = {
	initialData: PORegister[];
	initialTotalPages: number;
	initialTotalCount: number;
	initialStats: POStats | null;
	initialClients: Client[];
};

const PORegisterTable = ({ initialData, initialTotalPages, initialTotalCount, initialStats, initialClients }: PORegisterTableProps) => {
	const queryClient = useQueryClient();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [sorting, setSorting] = useState<SortingState>([]);
	const [filter, setFilter] = useState<string>("");
	const [globalFilter, setGlobalFilter] = useState<string>(filter);
	const [companyFilter, setCompanyFilter] = useState<string>("");
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [pageCount, setPageCount] = useState<number>(initialTotalPages);
	const [totalElementsCount, setTotalElementsCount] = useState<number>(initialTotalCount);
	const [mounted, setMounted] = useState<boolean>(false);

	useDebounce(() => setGlobalFilter(filter), 500, [filter]);

	const { data: stats, isLoading: statsLoading } = useQuery<POStats>({
		queryKey: ["po-register-stats"],
		queryFn: async () => {
			const response = await axios.get("/api/v1/po-register/stats");
			const result = response?.data?.data;
			const overview = result?.overview?.[0];
			return {
				totalPOs: overview?.totalPOs ?? 0,
				totalValue: overview?.totalValue ?? 0,
				totalCompanies: overview?.companies?.length ?? 0,
				byCompany: result?.byCompany ?? [],
				byYear: result?.byYear ?? [],
			} as POStats;
		},
		initialData: initialStats ?? undefined,
	});

	const { data: clients } = useQuery<Client[]>({
		queryKey: ["clients-dropdown"],
		queryFn: async () => {
			const response = await axios.get("/api/v1/client?all=true");
			return (response?.data?.data ?? []) as Client[];
		},
		initialData: initialClients,
	});

	const fetchPOs = async ({ queryKey }: { queryKey: QueryKey }) => {
		const [, search, page, size, sortId, sortDesc, company] = queryKey as [string, string | undefined, number, number, string | undefined, string | undefined, string | undefined];
		try {
			const params = new URLSearchParams();
			params.append("page", String((page ?? 0) + 1));
			params.append("size", size?.toString() || "10");
			if (search) params.append("search", search);
			if (sortId) params.append("sortBy", sortId);
			if (sortDesc !== undefined) params.append("sortOrder", sortDesc === "true" ? "desc" : "asc");
			if (company) params.append("companyName", company);

			const response = await axios.get(`/api/v1/po-register?${params.toString()}`);
			const result = response?.data?.data;
			setPageCount(result?.totalPages ?? 0);
			setTotalElementsCount(result?.total ?? 0);
			return (result?.data ?? []) as PORegister[];
		} catch (error: unknown) {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			console.error(errorData?.message);
			return [];
		}
	};

	const { data, isFetching } = useQuery<PORegister[]>({
		queryKey: ["po-register", globalFilter, pagination.pageIndex, pagination.pageSize, sorting[0]?.id, sorting[0]?.desc ? "true" : "false", companyFilter],
		queryFn: fetchPOs,
		initialData: initialData,
	});

	const importMutation = useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("file", file);
			const response = await axios.post("/api/v1/po-register/import", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			return response?.data?.data;
		},
		onSuccess: (result: Record<string, unknown>) => {
			toast.success(`Imported ${result?.imported ?? 0} POs successfully`);
			queryClient.invalidateQueries({ queryKey: ["po-register"] });
			queryClient.invalidateQueries({ queryKey: ["po-register-stats"] });
			queryClient.invalidateQueries({ queryKey: ["clients-dropdown"] });
		},
		onError: (error: AxiosError<ErrorData>) => {
			toast.error(error.response?.data?.message ?? "Failed to import Excel");
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
		setCompanyFilter("");
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
			{/* Stats Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card>
					<CardContent className="flex items-center gap-4 p-6">
						<div className="bg-primary/10 rounded-lg p-3">
							<Package className="text-primary h-6 w-6" />
						</div>
						<div>
							<p className="text-muted-foreground text-sm">Total POs</p>
							<p className="text-2xl font-bold">{statsLoading ? "..." : (stats?.totalPOs ?? 0)}</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="flex items-center gap-4 p-6">
						<div className="bg-primary/10 rounded-lg p-3">
							<IndianRupee className="text-primary h-6 w-6" />
						</div>
						<div>
							<p className="text-muted-foreground text-sm">Total Value</p>
							<p className="text-2xl font-bold">{statsLoading ? "..." : formatCurrency(stats?.totalValue ?? 0)}</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="flex items-center gap-4 p-6">
						<div className="bg-primary/10 rounded-lg p-3">
							<Building2 className="text-primary h-6 w-6" />
						</div>
						<div>
							<p className="text-muted-foreground text-sm">Unique Companies</p>
							<p className="text-2xl font-bold">{statsLoading ? "..." : (stats?.totalCompanies ?? 0)}</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Search, Filter, Import, Reset, Columns */}
			<div className="flex w-full flex-col items-center justify-end gap-1 py-3 sm:flex-row">
				<Input className="h-10 max-w-sm" onChange={e => setFilter(e.target.value)} placeholder="Search PO number, company, item code..." startContent={<Search size={16} />} value={filter} />
				<div className="mt-2 flex w-full flex-col items-center gap-2 sm:mt-0 sm:w-auto sm:flex-row">
					<Select
						value={companyFilter || "all"}
						onValueChange={val => {
							setCompanyFilter(val === "all" ? "" : val);
							setPagination(prev => ({ ...prev, pageIndex: 0 }));
						}}
					>
						<SelectTrigger className="h-10 w-full min-w-[180px] text-xs lg:w-auto">
							<Filter size={14} className="mr-1" />
							<SelectValue placeholder="Filter by client" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Companies</SelectItem>
							{clients?.map(c => (
								<SelectItem key={c._id} value={c.companyName}>
									{c.companyName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<input type="file" ref={fileInputRef} accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
					<Button className="w-full text-xs lg:w-auto" onClick={() => fileInputRef.current?.click()} disabled={importMutation.isPending} variant="outline">
						{importMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
						Import Excel
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
										<p className="text-muted-foreground">No purchase orders found</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			<TablePaginationControls footerHeading="POs" table={table} totalElementsCount={totalElementsCount} />
		</>
	);
};

export default PORegisterTable;
