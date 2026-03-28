"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ExternalLink, Globe, Paperclip } from "lucide-react";
import { Badge } from "@components/ui/badge";
import EmailCategoryBadge from "./email-category-badge";

const sourceIcon = (source: EmailSource) => {
	if (source === "ARIBA") return <Globe className="h-3.5 w-3.5 text-orange-600" />;
	if (source === "DIRECT") return <Paperclip className="h-3.5 w-3.5 text-blue-600" />;
	return null;
};

export const emailColumns: ColumnDef<EmailRecord>[] = [
	{
		accessorKey: "from",
		header: "From",
		cell: ({ row }) => {
			const from = row.original.from;
			return (
				<div className="max-w-[150px] truncate">
					<span className="text-sm font-medium">{from.name || from.address}</span>
				</div>
			);
		},
	},
	{
		accessorKey: "subject",
		header: "Subject",
		cell: ({ row }) => {
			const email = row.original;
			return (
				<div className="flex max-w-[400px] items-center gap-2">
					{!email.isRead && <div className="bg-primary h-2 w-2 shrink-0 rounded-full" />}
					<span className={`truncate text-sm ${!email.isRead ? "font-semibold" : ""}`}>{email.subject || "(no subject)"}</span>
					<div className="flex shrink-0 items-center gap-1">
						{sourceIcon(email.source)}
						<EmailCategoryBadge category={email.classification.category} />
					</div>
				</div>
			);
		},
	},
	{
		id: "linked",
		header: "Linked",
		cell: ({ row }) => {
			const email = row.original;
			if (email.linkedRfq) {
				return (
					<Badge className="text-[10px]" variant="outline">
						<ExternalLink className="mr-1 h-3 w-3" />
						RFQ {email.linkedRfq.prNumber}
					</Badge>
				);
			}
			return <span className="text-muted-foreground text-xs">—</span>;
		},
	},
	{
		accessorKey: "date",
		header: "Date",
		cell: ({ row }) => {
			const date = row.original.date;
			return <span className="text-muted-foreground text-xs">{date ? format(new Date(date), "dd MMM yyyy HH:mm") : "—"}</span>;
		},
	},
];
