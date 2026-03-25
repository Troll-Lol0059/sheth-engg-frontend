"use client";
import { useEffect, useState } from "react";
import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, PaginationState, SortingState, useReactTable, VisibilityState } from "@tanstack/react-table";
import { useDebounce } from "react-use";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useQuery, useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClientSchema, ClientFormValues } from "@schemas/client";
import { Input } from "@components/ui/input";
import { ArrowRightLeft, ListRestart, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { TablePaginationControls } from "@components/common/table-pagination-controls";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { toast } from "sonner";

type ClientMasterTableProps = {
	initialData: Client[];
	initialTotalPages: number;
	initialTotalCount: number;
};

const ClientMasterTable = ({ initialData, initialTotalPages, initialTotalCount }: ClientMasterTableProps) => {
	const queryClient = useQueryClient();
	const [sorting, setSorting] = useState<SortingState>([]);
	const [filter, setFilter] = useState<string>("");
	const [globalFilter, setGlobalFilter] = useState<string>(filter);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
	const [pageCount, setPageCount] = useState<number>(initialTotalPages);
	const [totalElementsCount, setTotalElementsCount] = useState<number>(initialTotalCount);
	const [mounted, setMounted] = useState<boolean>(false);
	const [dialogOpen, setDialogOpen] = useState<boolean>(false);
	const [editingClient, setEditingClient] = useState<Client | null>(null);

	useDebounce(() => setGlobalFilter(filter), 500, [filter]);

	const form = useForm<ClientFormValues>({
		resolver: zodResolver(ClientSchema),
		defaultValues: {
			companyName: "",
			gstn: "",
			location: "",
			addressLine1: "",
			addressLine2: "",
			addressLine3: "",
			state: "",
			city: "",
			pincode: "",
			country: "",
			buyerName: "",
			buyerContact: "",
		},
	});

	const openCreateDialog = () => {
		setEditingClient(null);
		form.reset({
			companyName: "",
			gstn: "",
			location: "",
			addressLine1: "",
			addressLine2: "",
			addressLine3: "",
			state: "",
			city: "",
			pincode: "",
			country: "",
			buyerName: "",
			buyerContact: "",
		});
		setDialogOpen(true);
	};

	const openEditDialog = (client: Client) => {
		setEditingClient(client);
		form.reset({
			companyName: client.companyName ?? "",
			gstn: client.gstn ?? "",
			location: client.location ?? "",
			addressLine1: client.addressLine1 ?? "",
			addressLine2: client.addressLine2 ?? "",
			addressLine3: client.addressLine3 ?? "",
			state: client.state ?? "",
			city: client.city ?? "",
			pincode: client.pincode ?? "",
			country: client.country ?? "",
			buyerName: client.buyerName ?? "",
			buyerContact: client.buyerContact ?? "",
		});
		setDialogOpen(true);
	};

	const createMutation = useMutation({
		mutationFn: async (values: ClientFormValues) => {
			const response = await axios.post("/api/v1/client", values);
			return response.data;
		},
		onSuccess: () => {
			toast.success("Client created successfully");
			queryClient.invalidateQueries({ queryKey: ["clients-all"] });
			setDialogOpen(false);
			form.reset();
		},
		onError: (error: AxiosError) => {
			const errorData = error?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to create client");
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (values: ClientFormValues) => {
			const response = await axios.put(`/api/v1/client/${editingClient?._id}`, values);
			return response.data;
		},
		onSuccess: () => {
			toast.success("Client updated successfully");
			queryClient.invalidateQueries({ queryKey: ["clients-all"] });
			setDialogOpen(false);
			setEditingClient(null);
			form.reset();
		},
		onError: (error: AxiosError) => {
			const errorData = error?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to update client");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			const response = await axios.delete(`/api/v1/client/${id}`);
			return response.data;
		},
		onSuccess: () => {
			toast.success("Client deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["clients-all"] });
		},
		onError: (error: AxiosError) => {
			const errorData = error?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to delete client");
		},
	});

	const handleDelete = (client: Client) => {
		if (window.confirm(`Are you sure you want to delete "${client.companyName}"?`)) {
			deleteMutation.mutate(client._id);
		}
	};

	const onSubmit = (values: ClientFormValues) => {
		if (editingClient) {
			updateMutation.mutate(values);
		} else {
			createMutation.mutate(values);
		}
	};

	const columns: ColumnDef<Client>[] = [
		{
			accessorKey: "companyName",
			header: "Company Name",
		},
		{
			accessorKey: "gstn",
			header: "GSTN",
		},
		{
			accessorKey: "location",
			header: "Location",
		},
		{
			accessorKey: "city",
			header: "City",
		},
		{
			accessorKey: "state",
			header: "State",
		},
		{
			accessorKey: "buyerName",
			header: "Buyer Name",
		},
		{
			accessorKey: "buyerContact",
			header: "Buyer Contact",
		},
		{
			id: "actions",
			header: "Actions",
			enableHiding: false,
			cell: ({ row }) => {
				const client = row.original;
				return (
					<div className="flex items-center gap-2">
						<Button onClick={() => openEditDialog(client)} size="icon" variant="ghost">
							<Pencil className="h-4 w-4" />
						</Button>
						<Button onClick={() => handleDelete(client)} size="icon" variant="ghost">
							<Trash2 className="text-destructive h-4 w-4" />
						</Button>
					</div>
				);
			},
		},
	];

	const fetchClients = async ({ queryKey }: { queryKey: QueryKey }) => {
		const [, search, page, size, sortId, sortDesc] = queryKey as [string, string | undefined, number, number, string | undefined, string | undefined];
		try {
			const params = new URLSearchParams();
			params.append("page", String((page ?? 0) + 1));
			params.append("size", size?.toString() || "10");
			if (search) params.append("search", search);
			if (sortId) params.append("sortBy", sortId);
			if (sortDesc !== undefined) params.append("sortOrder", sortDesc === "true" ? "desc" : "asc");

			const response = await axios.get(`/api/v1/client?${params.toString()}`);
			const result = response?.data?.data;
			setPageCount(result?.totalPages ?? 0);
			setTotalElementsCount(result?.totalCount ?? 0);
			return (result?.data ?? []) as Client[];
		} catch (error: unknown) {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			console.error(errorData?.message);
			return [];
		}
	};

	const { data, isFetching } = useQuery<Client[]>({
		queryKey: ["clients-all", globalFilter, pagination.pageIndex, pagination.pageSize, sorting[0]?.id, sorting[0]?.desc ? "true" : "false"],
		queryFn: fetchClients,
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
				<Input className="h-10 max-w-sm" onChange={e => setFilter(e.target.value)} placeholder="Search clients..." startContent={<Search size={16} />} value={filter} />
				<div className="mt-2 flex w-full flex-col items-center gap-2 sm:mt-0 sm:w-auto sm:flex-row">
					<Button className="w-full text-xs lg:w-auto" onClick={openCreateDialog} variant="default">
						<Plus size={16} />
						Add Client
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
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<TablePaginationControls footerHeading="Clients" table={table} totalElementsCount={totalElementsCount} />

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>{editingClient ? "Edit Client" : "Add Client"}</DialogTitle>
						<DialogDescription>{editingClient ? "Update the client details below." : "Fill in the details to create a new client."}</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<div className="grid grid-cols-1 gap-4">
								<FormField
									control={form.control}
									name="companyName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Company Name <span className="text-destructive">*</span>
											</FormLabel>
											<FormControl>
												<Input placeholder="Enter company name" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<FormField
									control={form.control}
									name="gstn"
									render={({ field }) => (
										<FormItem>
											<FormLabel>GSTN</FormLabel>
											<FormControl>
												<Input placeholder="Enter GSTN" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="location"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Location</FormLabel>
											<FormControl>
												<Input placeholder="Enter location" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
								<FormField
									control={form.control}
									name="addressLine1"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Address Line 1</FormLabel>
											<FormControl>
												<Input placeholder="Address line 1" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="addressLine2"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Address Line 2</FormLabel>
											<FormControl>
												<Input placeholder="Address line 2" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="addressLine3"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Address Line 3</FormLabel>
											<FormControl>
												<Input placeholder="Address line 3" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
								<FormField
									control={form.control}
									name="city"
									render={({ field }) => (
										<FormItem>
											<FormLabel>City</FormLabel>
											<FormControl>
												<Input placeholder="Enter city" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="state"
									render={({ field }) => (
										<FormItem>
											<FormLabel>State</FormLabel>
											<FormControl>
												<Input placeholder="Enter state" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="pincode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Pincode</FormLabel>
											<FormControl>
												<Input placeholder="Enter pincode" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="country"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Country</FormLabel>
											<FormControl>
												<Input placeholder="Enter country" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<FormField
									control={form.control}
									name="buyerName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Buyer Name</FormLabel>
											<FormControl>
												<Input placeholder="Enter buyer name" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="buyerContact"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Buyer Contact</FormLabel>
											<FormControl>
												<Input placeholder="Enter buyer contact" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<DialogFooter>
								<Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
									Cancel
								</Button>
								<Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
									{(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
									{editingClient ? "Update" : "Create"}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default ClientMasterTable;
