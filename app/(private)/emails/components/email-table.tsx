"use client";

import { useState, useMemo } from "react";
import axios from "@config/axios";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useReactTable, getCoreRowModel, flexRender, PaginationState, SortingState, ColumnDef } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Badge } from "@components/ui/badge";
import { RefreshCw, Search, Loader2, CheckCheck, RotateCcw } from "lucide-react";
import { TablePaginationControls } from "@components/common/table-pagination-controls";
import { emailColumns } from "./email-columns";
import EmailActions from "./email-actions";
import EmailDetailSheet from "./email-detail-sheet";
import EmailStatsBar from "./email-stats-bar";
import LinkRfqDialog from "./link-rfq-dialog";
import CreateRfqFromEmailDialog from "./create-rfq-from-email-dialog";

interface EmailTableProps {
	initialData: EmailRecord[];
	initialTotalPages: number;
	initialTotalCount: number;
}

const EmailTable = ({ initialData, initialTotalPages, initialTotalCount }: EmailTableProps) => {
	const queryClient = useQueryClient();

	// State
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
	const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [sourceFilter, setSourceFilter] = useState<string>("all");
	const [linkedFilter, setLinkedFilter] = useState<string>("all");
	const [categoryFilter, setCategoryFilter] = useState<EmailCategory | null>(null);
	const [pageCount, setPageCount] = useState(initialTotalPages);
	const [totalCount, setTotalCount] = useState(initialTotalCount);

	// Dialogs
	const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);
	const [linkRfqEmail, setLinkRfqEmail] = useState<string | null>(null);
	const [createRfqEmail, setCreateRfqEmail] = useState<EmailRecord | null>(null);

	// Fetch emails
	const fetchEmails = async ({ queryKey }: { queryKey: readonly unknown[] }) => {
		const [, srch, page, size, sortId, sortDesc, src, linked, category] = queryKey as [string, string, number, number, string, boolean, string, string, string | null];
		const params = new URLSearchParams({
			page: String(page + 1),
			size: String(size),
			sortBy: sortId || "date",
			sortOrder: sortDesc ? "desc" : "asc",
		});
		if (srch) params.append("search", srch);
		if (src && src !== "all") params.append("source", src);
		if (linked && linked !== "all") params.append("linked", linked);
		if (category) params.append("category", category);

		const res = await axios.get(`/api/v1/email/all?${params}`);
		const d = res?.data?.data;
		if (d) {
			setPageCount(d.totalPages);
			setTotalCount(d.totalCount);
		}
		return d?.data ?? [];
	};

	const sortCol = sorting[0];
	const { data: emails, isFetching } = useQuery<EmailRecord[]>({
		queryKey: ["emails", search, pagination.pageIndex, pagination.pageSize, sortCol?.id ?? "date", sortCol?.desc ?? true, sourceFilter, linkedFilter, categoryFilter],
		queryFn: fetchEmails,
		initialData: search === "" && pagination.pageIndex === 0 ? initialData : undefined,
	});

	// Auto-sync: polls every 2 minutes
	const { isFetching: syncing } = useQuery({
		queryKey: ["email-auto-sync"],
		queryFn: async () => {
			const res = await axios.post("/api/v1/email/sync");
			const count = res?.data?.data?.newEmails ?? 0;
			if (count > 0) {
				toast.success(`Synced ${count} new emails`);
				queryClient.invalidateQueries({ queryKey: ["emails"] });
				queryClient.invalidateQueries({ queryKey: ["email-stats"] });
				queryClient.invalidateQueries({ queryKey: ["email-unread-count"] });
			}
			return count;
		},
		refetchInterval: 2 * 60 * 1000,
	});

	// Mark all read
	const { mutate: markAllRead } = useMutation({
		mutationFn: () => axios.patch("/api/v1/email/read-all"),
		onSuccess: () => {
			toast.success("All marked as read");
			queryClient.invalidateQueries({ queryKey: ["emails"] });
			queryClient.invalidateQueries({ queryKey: ["email-unread-count"] });
		},
	});

	// Columns with actions
	const columnsWithActions: ColumnDef<EmailRecord>[] = useMemo(
		() => [
			...emailColumns,
			{
				id: "actions",
				header: "",
				cell: ({ row }) => (
					<EmailActions
						email={row.original}
						onCreateRfq={() => setCreateRfqEmail(row.original)}
						onLinkRfq={() => setLinkRfqEmail(row.original._id)}
						onViewDetail={() => {
							setSelectedEmail(row.original);
							setDetailOpen(true);
						}}
					/>
				),
			},
		],
		[]
	);

	const table = useReactTable({
		data: emails ?? [],
		columns: columnsWithActions,
		pageCount,
		state: { pagination, sorting },
		onPaginationChange: setPagination,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		manualSorting: true,
	});

	const handleSearch = () => {
		setSearch(searchInput);
		setPagination(p => ({ ...p, pageIndex: 0 }));
	};

	const resetFilters = () => {
		setSearchInput("");
		setSearch("");
		setSourceFilter("all");
		setLinkedFilter("all");
		setCategoryFilter(null);
		setPagination({ pageIndex: 0, pageSize: 20 });
		setSorting([{ id: "date", desc: true }]);
	};

	return (
		<div className="space-y-4">
			{/* Stats */}
			<EmailStatsBar activeCategory={categoryFilter} onCategoryClick={cat => { setCategoryFilter(cat); setPagination(p => ({ ...p, pageIndex: 0 })); }} />

			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-2">
				<div className="min-w-[200px] flex-1">
					<Input
						className="h-10"
						startContent={<Search className="text-muted-foreground h-4 w-4 shrink-0" />}
						onChange={e => setSearchInput(e.target.value)}
						onKeyDown={e => e.key === "Enter" && handleSearch()}
						placeholder="Search emails..."
						value={searchInput}
					/>
				</div>

				<Select onValueChange={v => { setSourceFilter(v); setPagination(p => ({ ...p, pageIndex: 0 })); }} value={sourceFilter}>
					<SelectTrigger className="h-10 w-[130px]">
						<SelectValue placeholder="Source" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Sources</SelectItem>
						<SelectItem value="ARIBA">Ariba</SelectItem>
						<SelectItem value="DIRECT">Direct</SelectItem>
						<SelectItem value="UNKNOWN">Unknown</SelectItem>
					</SelectContent>
				</Select>

				<Select onValueChange={v => { setLinkedFilter(v); setPagination(p => ({ ...p, pageIndex: 0 })); }} value={linkedFilter}>
					<SelectTrigger className="h-10 w-[130px]">
						<SelectValue placeholder="Linked" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All</SelectItem>
						<SelectItem value="rfq">Linked RFQ</SelectItem>
						<SelectItem value="none">Unlinked</SelectItem>
					</SelectContent>
				</Select>

				<Button className="h-10" disabled={syncing} onClick={() => queryClient.invalidateQueries({ queryKey: ["email-auto-sync"] })} size="sm" variant="outline">
					{syncing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
					Sync
				</Button>

				<Button className="h-10" onClick={() => markAllRead()} size="sm" variant="outline">
					<CheckCheck className="mr-1.5 h-4 w-4" />
					Read All
				</Button>

				<Button className="h-10" onClick={resetFilters} size="sm" variant="outline">
					<RotateCcw className="mr-1.5 h-4 w-4" />
					Reset
				</Button>
			</div>

			{/* Count */}
			<div className="text-muted-foreground flex items-center gap-2 text-xs">
				{isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
				{totalCount} email{totalCount !== 1 ? "s" : ""}
				{categoryFilter && <Badge className="text-[10px]" variant="secondary">{categoryFilter.replace(/_/g, " ")}</Badge>}
			</div>

			{/* Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map(headerGroup => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map(header => (
									<TableHead key={header.id}>
										{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length === 0 ? (
							<TableRow>
								<TableCell className="text-center" colSpan={columnsWithActions.length}>
									<p className="text-muted-foreground py-8 text-sm">No emails found.</p>
								</TableCell>
							</TableRow>
						) : (
							table.getRowModel().rows.map(row => (
								<TableRow
									className="cursor-pointer"
									key={row.id}
									onClick={() => {
										setSelectedEmail(row.original);
										setDetailOpen(true);
									}}
								>
									{row.getVisibleCells().map(cell => (
										<TableCell key={cell.id} onClick={cell.column.id === "actions" ? e => e.stopPropagation() : undefined}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			{pageCount > 1 && <TablePaginationControls footerHeading="Emails" table={table} totalElementsCount={totalCount} />}

			{/* Dialogs */}
			<EmailDetailSheet
				email={selectedEmail}
				onClose={() => { setDetailOpen(false); setSelectedEmail(null); }}
				onCreateRfq={() => { setDetailOpen(false); setCreateRfqEmail(selectedEmail); }}
				onLinkRfq={() => { setDetailOpen(false); if (selectedEmail) setLinkRfqEmail(selectedEmail._id); }}
				open={detailOpen}
			/>

			{linkRfqEmail && <LinkRfqDialog emailId={linkRfqEmail} onClose={() => setLinkRfqEmail(null)} open />}
			{createRfqEmail && <CreateRfqFromEmailDialog email={createRfqEmail} onClose={() => setCreateRfqEmail(null)} open />}
		</div>
	);
};

export default EmailTable;
