"use client";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import RegretOptions from "./regret-options";

export const regretRfqColumns: ColumnDef<Rfq>[] = [
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
		id: "totalItems",
		header: "Total Items",
		cell: ({ row }) => {
			const items = row.original.items;
			return Array.isArray(items) ? items.length : 0;
		},
	},
	{
		accessorKey: "regretDate",
		header: "Regret Date",
		cell: ({ row }) => {
			const date = row.getValue("regretDate") as string;
			return date ? format(new Date(date), "dd MMM yyyy") : "—";
		},
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }) => <RegretOptions rfq={row.original} />,
	},
];
