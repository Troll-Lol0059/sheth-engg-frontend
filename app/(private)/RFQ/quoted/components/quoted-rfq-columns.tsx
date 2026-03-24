"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@components/ui/badge";
import { format } from "date-fns";
import QuotedOptions from "./quoted-options";

export const quotedRfqColumns: ColumnDef<Rfq>[] = [
	{
		accessorKey: "quotationNumber",
		header: "Q. No.",
		cell: ({ row }) => {
			const num = row.getValue("quotationNumber") as number | undefined;
			return num ?? "—";
		},
	},
	{
		accessorKey: "prNumber",
		header: "PR Number",
	},
	{
		accessorKey: "companyName",
		header: "Company",
	},
	{
		id: "quotedItems",
		header: "Quoted / Total",
		cell: ({ row }) => {
			const items = row.original.items;
			const totalItems = Array.isArray(items) ? items.length : 0;
			const quotedCount = row.original.quotedItemCount ?? 0;
			return `${quotedCount} / ${totalItems}`;
		},
	},
	{
		accessorKey: "quotedOn",
		header: "Quoted Date",
		cell: ({ row }) => {
			const date = row.getValue("quotedOn") as string;
			return date ? format(new Date(date), "dd MMM yyyy") : "—";
		},
	},
	{
		accessorKey: "isRevised",
		header: "Revised",
		cell: ({ row }) => {
			const isRevised = row.getValue("isRevised") as boolean;
			return <Badge variant={isRevised ? "warning" : "secondary"}>{isRevised ? "Yes" : "No"}</Badge>;
		},
	},
	{
		accessorKey: "revisionDate",
		header: "Revision Date",
		cell: ({ row }) => {
			const date = row.getValue("revisionDate") as string;
			return date ? format(new Date(date), "dd MMM yyyy") : "—";
		},
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }) => <QuotedOptions rfq={row.original} />,
	},
];
