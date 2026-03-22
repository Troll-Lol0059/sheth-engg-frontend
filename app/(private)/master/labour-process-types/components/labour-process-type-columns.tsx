"use client";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import Options from "./options";

export const labourProcessTypeColumns: ColumnDef<LabourProcessType>[] = [
	{
		accessorKey: "name",
		header: "Name",
	},
	{
		accessorKey: "description",
		header: "Description",
		cell: ({ row }) => {
			const description = row.getValue("description") as string;
			return description || "—";
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
		cell: ({ row }) => <Options labourProcessType={row.original} />,
	},
];
