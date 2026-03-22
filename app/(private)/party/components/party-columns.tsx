"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@components/ui/badge";
import Options from "./options";

const partyTypeVariantMap: Record<string, "default" | "secondary"> = {
	RAW_MATERIAL_DEALER: "default",
	LABOUR_JOB_WORKER: "secondary",
};

export const partyColumns: ColumnDef<Party>[] = [
	{
		accessorKey: "acName",
		header: "Account Name",
	},
	{
		accessorKey: "cpName",
		header: "Contact Person",
	},
	{
		accessorKey: "mobile",
		header: "Mobile",
	},
	{
		accessorKey: "email",
		header: "Email",
	},
	{
		accessorKey: "partyType",
		header: "Party Type",
		cell: ({ row }) => {
			const partyType = row.getValue("partyType") as string;
			return <Badge variant={partyTypeVariantMap[partyType] ?? "default"}>{partyType.replace(/_/g, " ")}</Badge>;
		},
	},
	{
		accessorKey: "partySubType",
		header: "Sub Type",
		cell: ({ row }) => {
			const val = row.getValue("partySubType") as Party["partySubType"];
			return typeof val === "object" ? val.name : "\u2014";
		},
	},
	{
		accessorKey: "state",
		header: "State",
	},
	{
		accessorKey: "gstin",
		header: "GSTIN",
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }) => <Options party={row.original} />,
	},
];
