"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "@config/axios";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { AuditLogDetail } from "./audit-log-detail";

const LEVELS = ["all", "info", "warn", "error", "critical"] as const;
const CATEGORIES = [
	"all", "AUTH", "RFQ", "ITEM", "MASTER", "PARTY", "COSTING", "OFFER",
	"PO", "CLIENT", "STAFF", "SYSTEM", "HEALTH", "EXTRACTION", "NOTIFICATION", "COMPANY", "OTHER",
] as const;

interface AuditLogTableProps {
	columns: ColumnDef<AuditLog>[];
	initialData: AuditLog[];
	totalElements: number;
	totalPages: number;
}

const fetchAuditLogs = async ({ queryKey }: { queryKey: readonly unknown[] }) => {
	const [, search, page, size, level, category, sortBy, sortOrder] = queryKey as [
		string, string, number, number, string, string, string, string,
	];
	const params = new URLSearchParams({
		page: String(page),
		size: String(size),
		sortBy,
		sortOrder,
	});
	if (search) params.append("search", search);
	if (level && level !== "all") params.append("level", level);
	if (category && category !== "all") params.append("category", category);

	const response = await axios.get(`/api/v1/audit-logs?${params}`);
	return response?.data?.data;
};

export const AuditLogTable = ({ columns, initialData, totalElements, totalPages: initialTotalPages }: AuditLogTableProps) => {
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [page, setPage] = useState(1);
	const [size] = useState(20);
	const [level, setLevel] = useState("all");
	const [category, setCategory] = useState("all");
	const [sortBy] = useState("createdAt");
	const [sortOrder] = useState("desc");
	const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

	const handleSearch = useCallback(() => {
		setDebouncedSearch(search);
		setPage(1);
	}, [search]);

	const { data, isFetching, refetch } = useQuery({
		queryKey: ["audit-logs", debouncedSearch, page, size, level, category, sortBy, sortOrder] as const,
		queryFn: fetchAuditLogs,
		initialData: { data: initialData, total: totalElements, totalPages: initialTotalPages, page: 1, size: 20 },
		refetchInterval: 30000,
	});

	const logs = data?.data ?? [];
	const total = data?.total ?? 0;
	const totalPages = data?.totalPages ?? 1;

	const table = useReactTable({
		data: logs,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="flex w-full flex-col gap-4">
			{/* Filters */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="relative flex-1">
					<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
					<Input
						className="pl-9"
						placeholder="Search logs..."
						value={search}
						onChange={e => setSearch(e.target.value)}
						onKeyDown={e => e.key === "Enter" && handleSearch()}
					/>
				</div>
				<Select value={level} onValueChange={v => { setLevel(v); setPage(1); }}>
					<SelectTrigger className="w-[140px]">
						<SelectValue placeholder="Level" />
					</SelectTrigger>
					<SelectContent>
						{LEVELS.map(l => (
							<SelectItem key={l} value={l}>
								{l === "all" ? "All Levels" : l.toUpperCase()}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={category} onValueChange={v => { setCategory(v); setPage(1); }}>
					<SelectTrigger className="w-[160px]">
						<SelectValue placeholder="Category" />
					</SelectTrigger>
					<SelectContent>
						{CATEGORIES.map(c => (
							<SelectItem key={c} value={c}>
								{c === "all" ? "All Categories" : c}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
					<RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					Refresh
				</Button>
			</div>

			{/* Results count */}
			<div className="text-muted-foreground flex items-center justify-between text-sm">
				<span>
					Showing {logs.length} of {total} logs
				</span>
				{isFetching && <span className="text-xs">Refreshing...</span>}
			</div>

			{/* Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map(headerGroup => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map(header => (
									<TableHead key={header.id} className="text-xs">
										{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map(row => (
								<TableRow
									key={row.id}
									className="cursor-pointer hover:bg-muted/50"
									onClick={() => setSelectedLog(row.original)}
								>
									{row.getVisibleCells().map(cell => (
										<TableCell key={cell.id} className="py-2">
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									{isFetching ? "Loading..." : "No audit logs found."}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			<div className="flex items-center justify-between">
				<span className="text-muted-foreground text-sm">
					Page {page} of {totalPages}
				</span>
				<div className="flex gap-2">
					<Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
						<ChevronLeft className="h-4 w-4" />
						Previous
					</Button>
					<Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
						Next
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Detail Dialog */}
			{selectedLog && <AuditLogDetail log={selectedLog} onClose={() => setSelectedLog(null)} />}
		</div>
	);
};
