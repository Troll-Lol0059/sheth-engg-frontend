"use client";
import { useEffect, useState } from "react";
import {
	ColumnDef,
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	PaginationState,
	SortingState,
	useReactTable,
	VisibilityState,
} from "@tanstack/react-table";
import { useDebounce } from "react-use";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useQuery, QueryKey } from "@tanstack/react-query";
import { Input } from "@components/ui/input";
import { ArrowRightLeft, ListRestart, Loader2, Search } from "lucide-react";
import { Button } from "@components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { TablePaginationControls } from "@components/common/table-pagination-controls";

type LabourProcessTypeTableProps = {
	initialData: LabourProcessType[];
	totalPages: number;
	columns: ColumnDef<LabourProcessType>[];
	totalElements: number;
};

const LabourProcessTypeTable = ({ initialData, columns, totalPages, totalElements }: LabourProcessTypeTableProps) => {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [filter, setFilter] = useState<string>("");
	const [globalFilter, setGlobalFilter] = useState<string>(filter);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [pageCount, setPageCount] = useState<number>(totalPages);
	const [totalElementsCount, setTotalElementsCount] = useState<number>(totalElements);
	const [mounted, setMounted] = useState<boolean>(false);

	useDebounce(() => setGlobalFilter(filter), 500, [filter]);

	const fetchLabourProcessTypes = async ({ queryKey }: { queryKey: QueryKey }) => {
		const [, search, page, size, sort, sortOrder] = queryKey as [string, string | undefined, number, number, string | undefined, string | undefined];
		try {
			const params = new URLSearchParams();
			params.append("page", String((page ?? 0) + 1));
			params.append("size", size?.toString() || "10");
			if (search) params.append("search", search);
			if (sort) params.append("sortBy", sort);
			if (sortOrder) params.append("sortOrder", sortOrder);

			const response = await axios.get(`/api/v1/master/labour-process-type/all?${params.toString()}`);
			const result = response?.data?.data;
			setPageCount(result?.totalPages ?? 0);
			setTotalElementsCount(result?.totalCount ?? 0);
			return (result?.data ?? []) as LabourProcessType[];
		} catch (error: unknown) {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			console.error(errorData?.message);
			return [];
		}
	};

	const { data, isFetching } = useQuery<LabourProcessType[]>({
		queryKey: [
			"labour-process-types-all",
			globalFilter,
			pagination.pageIndex,
			pagination.pageSize,
			sorting[0]?.id,
			sorting[0]?.desc ? "desc" : "asc",
		],
		queryFn: fetchLabourProcessTypes,
		initialData: initialData,
	});

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
			<div className="flex w-full flex-col items-center justify-end gap-1 py-3 sm:flex-row">
				<Input className="h-10 max-w-sm" onChange={e => setFilter(e.target.value)} placeholder="Search labour process types..." startContent={<Search size={16} />} value={filter} />
				<div className="mt-2 flex w-full flex-col items-center gap-2 sm:mt-0 sm:w-auto sm:flex-row">
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
										<Loader2 className="animate-spin text-primary" size={32} />
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
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<TablePaginationControls footerHeading="Labour Process Types" table={table} totalElementsCount={totalElementsCount} />
		</>
	);
};

export default LabourProcessTypeTable;
