"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@components/ui/badge";
import Options from "./options";

const roleVariantMap: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
	ROLE_OWNER: "destructive",
	ROLE_ADMIN: "default",
	ROLE_OFFICE_STAFF: "secondary",
	ROLE_FIELD_STAFF: "outline",
};

const roleLabelMap: Record<string, string> = {
	ROLE_OWNER: "Owner",
	ROLE_ADMIN: "Admin",
	ROLE_OFFICE_STAFF: "Office Staff",
	ROLE_FIELD_STAFF: "Field Staff",
};

export const staffColumns: ColumnDef<Staff>[] = [
	{
		accessorKey: "userName",
		header: "Username",
	},
	{
		id: "name",
		header: "Full Name",
		cell: ({ row }) => {
			const s = row.original;
			return [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ");
		},
	},
	{
		accessorKey: "email",
		header: "Email",
	},
	{
		accessorKey: "phoneNumber",
		header: "Phone",
	},
	{
		accessorKey: "role",
		header: "Role",
		cell: ({ row }) => {
			const role = row.getValue("role") as string;
			return <Badge variant={roleVariantMap[role] ?? "default"}>{roleLabelMap[role] ?? role}</Badge>;
		},
	},
	{
		accessorKey: "createdAt",
		header: "Created",
		cell: ({ row }) => new Date(row.getValue("createdAt") as string).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }) => <Options staff={row.original} />,
	},
];
