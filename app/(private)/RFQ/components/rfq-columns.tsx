"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Eye } from "lucide-react";
import { format } from "date-fns";

const statusVariantMap: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
	PREVIEW: "secondary",
	ACCEPTING_RESPONSE: "default",
	PENDING_SELECTION: "warning",
	AWARDED: "success",
	COMPLETED: "success",
};

export const createRfqColumns = (onViewDetails: (rfq: Rfq) => void): ColumnDef<Rfq>[] => [
	{
		accessorKey: "prNumber",
		header: "PR Number",
	},
	{
		accessorKey: "companyName",
		header: "Company",
	},
	{
		accessorKey: "location",
		header: "Location",
	},
	{
		accessorKey: "ownerName",
		header: "Owner",
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			return <Badge variant={statusVariantMap[status] ?? "default"}>{status.replace(/_/g, " ")}</Badge>;
		},
	},
	{
		accessorKey: "dueDate",
		header: "Due Date",
		cell: ({ row }) => {
			const date = row.getValue("dueDate") as string;
			return date ? format(new Date(date), "dd MMM yyyy") : "—";
		},
	},
	{
		accessorKey: "createdAt",
		header: "Created",
		cell: ({ row }) => {
			const date = row.getValue("createdAt") as string;
			return date ? format(new Date(date), "dd MMM yyyy") : "—";
		},
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }) => (
			<Button onClick={() => onViewDetails(row.original)} size="sm" variant="ghost">
				<Eye className="mr-1 h-4 w-4" />
				Details
			</Button>
		),
	},
];
