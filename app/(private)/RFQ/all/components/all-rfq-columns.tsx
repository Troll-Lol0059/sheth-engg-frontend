"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@components/ui/badge";
import { format } from "date-fns";
import Options from "../../components/options";

const getStatusInfo = (rfq: Rfq) => {
	if (rfq.isRegret) return { label: "Regret", variant: "destructive" as const };
	if (rfq.isQuoted && rfq.isRevised) return { label: "Revised", variant: "warning" as const };
	if (rfq.isQuoted) return { label: "Quoted", variant: "success" as const };
	return { label: "Pending", variant: "secondary" as const };
};

export const allRfqColumns: ColumnDef<Rfq>[] = [
	{
		accessorKey: "prNumber",
		header: "PR Number",
		cell: ({ row }) => <span className="font-medium">{row.getValue("prNumber")}</span>,
	},
	{
		accessorKey: "companyName",
		header: "Company",
	},
	{
		accessorKey: "ownerName",
		header: "Owner",
	},
	{
		accessorKey: "location",
		header: "Location",
	},
	{
		id: "rfqStatus",
		header: "Status",
		cell: ({ row }) => {
			const info = getStatusInfo(row.original);
			return <Badge variant={info.variant}>{info.label}</Badge>;
		},
	},
	{
		accessorKey: "quotationNumber",
		header: "Quotation No.",
		cell: ({ row }) => {
			const num = row.original.quotationNumber;
			return num ? <span className="font-medium">{num}</span> : <span className="text-muted-foreground">—</span>;
		},
	},
	{
		id: "quotedItems",
		header: "Items Quoted",
		cell: ({ row }) => {
			const items = row.original.items;
			const totalItems = Array.isArray(items) ? items.length : 0;
			const quotedCount = row.original.quotedItemCount ?? 0;
			const allQuoted = totalItems > 0 && quotedCount === totalItems;
			return (
				<Badge variant={allQuoted ? "success" : quotedCount > 0 ? "warning" : "outline"}>
					{quotedCount} / {totalItems}
				</Badge>
			);
		},
	},
	{
		accessorKey: "startDate",
		header: "Start Date",
		cell: ({ row }) => {
			const date = row.getValue("startDate") as string;
			return date ? format(new Date(date), "dd MMM yyyy, HH:mm") : "—";
		},
	},
	{
		accessorKey: "dueDate",
		header: "Due Date",
		cell: ({ row }) => {
			const date = row.getValue("dueDate") as string;
			if (!date) return "—";
			const d = new Date(date);
			const isOverdue = !row.original.isQuoted && !row.original.isRegret && d < new Date();
			return <span className={isOverdue ? "text-destructive font-medium" : ""}>{format(d, "dd MMM yyyy, HH:mm")}</span>;
		},
	},
	{
		accessorKey: "quotedOn",
		header: "Quoted On",
		cell: ({ row }) => {
			const date = row.getValue("quotedOn") as string;
			return date ? format(new Date(date), "dd MMM yyyy") : "—";
		},
	},
	{
		id: "regretDate",
		header: "Regret Date",
		cell: ({ row }) => {
			const date = row.original.regretDate;
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
		cell: ({ row }) => <Options rfq={row.original} />,
	},
];
