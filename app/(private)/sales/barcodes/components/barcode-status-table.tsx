"use client";
import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useQuery, useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Checkbox } from "@components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { TablePaginationControls } from "@components/common/table-pagination-controls";
import { Loader2, Save, Search } from "lucide-react";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type PaginationState } from "@tanstack/react-table";
import BarcodeImportDialog from "./barcode-import-dialog";

const formatDate = (date?: string) => {
	if (!date) return "—";
	return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

type BarcodeCellProps = {
	row: BarcodeStatusRow;
};

const BarcodeCell = ({ row }: BarcodeCellProps) => {
	const queryClient = useQueryClient();
	const [value, setValue] = useState<string>(row.barcode ?? "");

	useEffect(() => {
		setValue(row.barcode ?? "");
	}, [row.barcode]);

	const mutation = useMutation({
		mutationFn: async (barcode: string) => {
			const response = await axios.patch(`/api/v1/sales/barcodes/${encodeURIComponent(row.invoiceNumber)}`, { barcode });
			return response?.data?.data;
		},
		onSuccess: () => {
			toast.success(`Barcode updated for invoice ${row.invoiceNumber}`);
			queryClient.invalidateQueries({ queryKey: ["barcode-status"] });
		},
		onError: (error: AxiosError<ErrorData>) => {
			toast.error(error.response?.data?.message ?? "Failed to update barcode");
		},
	});

	const isDirty = value.trim() !== (row.barcode ?? "");

	return (
		<div className="flex items-center gap-2">
			<Input className="h-8 w-44" value={value} onChange={e => setValue(e.target.value)} placeholder="Enter barcode" />
			{!row.barcode && <Badge variant="destructive">Missing</Badge>}
			<Button size="sm" variant="outline" disabled={!isDirty || value.trim().length === 0 || mutation.isPending} onClick={() => mutation.mutate(value.trim())}>
				{mutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
				Save
			</Button>
		</div>
	);
};

const columns: ColumnDef<BarcodeStatusRow>[] = [
	{
		accessorKey: "invoiceNumber",
		header: "Invoice No.",
		cell: ({ row }) => <span className="font-medium">{row.getValue("invoiceNumber")}</span>,
	},
	{
		accessorKey: "companyName",
		header: "Company Name",
		cell: ({ row }) => (
			<span className="block max-w-[220px] truncate" title={row.getValue("companyName") as string}>
				{row.getValue("companyName")}
			</span>
		),
	},
	{
		accessorKey: "dispatchDate",
		header: "Dispatch / Invoice Date",
		cell: ({ row }) => formatDate(row.original.dispatchDate || row.original.invoiceDate),
	},
	{
		id: "barcode",
		header: "Barcode",
		cell: ({ row }) => <BarcodeCell row={row.original} />,
	},
];

type BarcodeStatusTableProps = {
	initialData: BarcodeStatusRow[];
	initialTotalPages: number;
	initialTotalCount: number;
};

const BarcodeStatusTable = ({ initialData, initialTotalPages, initialTotalCount }: BarcodeStatusTableProps) => {
	const [filter, setFilter] = useState<string>("");
	const [globalFilter, setGlobalFilter] = useState<string>("");
	const [missingOnly, setMissingOnly] = useState<boolean>(false);
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
	const [pageCount, setPageCount] = useState<number>(initialTotalPages);
	const [totalElementsCount, setTotalElementsCount] = useState<number>(initialTotalCount);
	const [mounted, setMounted] = useState<boolean>(false);

	useDebounce(() => setGlobalFilter(filter), 500, [filter]);

	const fetchBarcodeStatus = async ({ queryKey }: { queryKey: QueryKey }) => {
		const [, search, missing, page, size] = queryKey as [string, string | undefined, boolean, number, number];
		try {
			const params = new URLSearchParams();
			params.append("page", String((page ?? 0) + 1));
			params.append("size", size?.toString() || "20");
			if (search) params.append("search", search);
			if (missing) params.append("missingOnly", "true");

			const response = await axios.get(`/api/v1/sales/barcodes?${params.toString()}`);
			const result = response?.data?.data;
			setPageCount(result?.totalPages ?? 0);
			setTotalElementsCount(result?.total ?? 0);
			return (result?.data ?? []) as BarcodeStatusRow[];
		} catch (error: unknown) {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			console.error(errorData?.message);
			return [];
		}
	};

	const { data, isFetching } = useQuery<BarcodeStatusRow[]>({
		queryKey: ["barcode-status", globalFilter, missingOnly, pagination.pageIndex, pagination.pageSize],
		queryFn: fetchBarcodeStatus,
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
			<div className="flex w-full flex-col items-center justify-end gap-2 py-1 sm:flex-row">
				<Input className="h-10 max-w-sm" onChange={e => setFilter(e.target.value)} placeholder="Search invoice or company..." startContent={<Search size={16} />} value={filter} />
				<label className="flex h-10 items-center gap-2 text-sm whitespace-nowrap">
					<Checkbox
						checked={missingOnly}
						onCheckedChange={checked => {
							setMissingOnly(!!checked);
							setPagination(prev => ({ ...prev, pageIndex: 0 }));
						}}
					/>
					Show missing only
				</label>
				<BarcodeImportDialog />
			</div>

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
								<TableCell className="h-24 text-center text-muted-foreground" colSpan={columns.length}>
									No invoices found
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<TablePaginationControls footerHeading="invoices" table={table} totalElementsCount={totalElementsCount} />
		</>
	);
};

export default BarcodeStatusTable;
