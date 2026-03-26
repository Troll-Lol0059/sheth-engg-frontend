"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@components/ui/badge";
import { format } from "date-fns";

const levelColors: Record<string, string> = {
	info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
	warn: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
	error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
	critical: "bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-200",
};

const methodColors: Record<string, string> = {
	GET: "bg-green-100 text-green-800",
	POST: "bg-blue-100 text-blue-800",
	PUT: "bg-orange-100 text-orange-800",
	PATCH: "bg-yellow-100 text-yellow-800",
	DELETE: "bg-red-100 text-red-800",
	SYSTEM: "bg-gray-100 text-gray-800",
};

export const auditLogColumns: ColumnDef<AuditLog>[] = [
	{
		accessorKey: "createdAt",
		header: "Timestamp",
		cell: ({ row }) => (
			<span className="text-xs whitespace-nowrap">
				{format(new Date(row.original.createdAt), "dd MMM yyyy, HH:mm:ss")}
			</span>
		),
	},
	{
		accessorKey: "level",
		header: "Level",
		cell: ({ row }) => (
			<Badge className={`text-xs font-medium ${levelColors[row.original.level] || ""}`} variant="outline">
				{row.original.level.toUpperCase()}
			</Badge>
		),
	},
	{
		accessorKey: "method",
		header: "Method",
		cell: ({ row }) => (
			<Badge className={`text-xs font-semibold ${methodColors[row.original.method] || ""}`} variant="outline">
				{row.original.method}
			</Badge>
		),
	},
	{
		accessorKey: "action",
		header: "Action",
		cell: ({ row }) => <span className="text-xs font-mono">{row.original.action}</span>,
	},
	{
		accessorKey: "category",
		header: "Category",
		cell: ({ row }) => (
			<Badge variant="secondary" className="text-xs">
				{row.original.category}
			</Badge>
		),
	},
	{
		accessorKey: "userName",
		header: "User",
		cell: ({ row }) => <span className="text-xs">{row.original.userName}</span>,
	},
	{
		accessorKey: "statusCode",
		header: "Status",
		cell: ({ row }) => {
			const code = row.original.statusCode;
			const color = code >= 500 ? "text-red-600" : code >= 400 ? "text-orange-600" : "text-green-600";
			return <span className={`text-xs font-mono font-bold ${color}`}>{code}</span>;
		},
	},
	{
		accessorKey: "duration",
		header: "Duration",
		cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.duration}ms</span>,
	},
	{
		accessorKey: "url",
		header: "Endpoint",
		cell: ({ row }) => (
			<span className="text-muted-foreground max-w-[200px] truncate text-xs font-mono" title={row.original.url}>
				{row.original.url}
			</span>
		),
	},
	{
		accessorKey: "responseMessage",
		header: "Message",
		cell: ({ row }) => (
			<span className="max-w-[200px] truncate text-xs" title={row.original.responseMessage}>
				{row.original.responseMessage || "—"}
			</span>
		),
	},
];
