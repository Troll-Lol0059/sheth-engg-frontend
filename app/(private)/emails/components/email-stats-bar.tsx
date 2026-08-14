"use client";

import axios from "@config/axios";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@components/ui/button";
import { cn } from "@lib/utils";

const statCards: { key: EmailCategory; label: string; color: string }[] = [
	{ key: "NEW_RFQ", label: "New RFQ", color: "border-blue-500 bg-blue-50 text-blue-700" },
	{ key: "RFQ_REMINDER", label: "Reminder", color: "border-orange-500 bg-orange-50 text-orange-700" },
	{ key: "RFQ_REOPENED", label: "Reopened", color: "border-amber-500 bg-amber-50 text-amber-700" },
	{ key: "REVISION_NEGOTIATION", label: "Revision", color: "border-yellow-500 bg-yellow-50 text-yellow-700" },
	{ key: "PO_RELATED", label: "PO", color: "border-green-500 bg-green-50 text-green-700" },
	{ key: "DELIVERY_SCHEDULE", label: "Delivery", color: "border-purple-500 bg-purple-50 text-purple-700" },
	{ key: "MATERIAL_NOT_RECEIVED", label: "Material Missing", color: "border-red-500 bg-red-50 text-red-700" },
	{ key: "DISPATCH_STATUS_REQUEST", label: "Dispatch Status", color: "border-blue-500 bg-blue-50 text-blue-700" },
];

export type Period = "today" | "yesterday" | "week" | "all";

interface EmailStatsBarProps {
	activeCategory: EmailCategory | null;
	onCategoryClick: (category: EmailCategory | null) => void;
	period: Period;
	onPeriodChange: (period: Period) => void;
}

const EmailStatsBar = ({ activeCategory, onCategoryClick, period, onPeriodChange }: EmailStatsBarProps) => {
	const { data: stats } = useQuery<EmailStats>({
		queryKey: ["email-stats", period],
		queryFn: async () => {
			const params = new URLSearchParams();
			if (period !== "all") params.append("period", period);
			const res = await axios.get(`/api/v1/email/stats?${params}`);
			return res?.data?.data;
		},
		refetchInterval: 60_000,
	});

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				{(["today", "yesterday", "week", "all"] as Period[]).map(p => (
					<Button className="h-7 text-xs" key={p} onClick={() => onPeriodChange(p)} size="sm" variant={period === p ? "default" : "outline"}>
						{p === "today" ? "Today" : p === "yesterday" ? "Yesterday" : p === "week" ? "This Week" : "All Time"}
					</Button>
				))}
				{stats && <span className="text-muted-foreground ml-auto text-xs">{stats.total ?? 0} total emails</span>}
			</div>
			<div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-8">
				{statCards.map(card => {
					const count = stats?.[card.key] ?? 0;
					const isActive = activeCategory === card.key;
					return (
						<button
							className={cn(
								"flex flex-col items-center rounded-lg border-2 px-2 py-2 text-center transition-all hover:shadow-sm",
								isActive ? card.color + " border-2 shadow-sm" : "border-transparent bg-muted/40",
							)}
							key={card.key}
							onClick={() => onCategoryClick(isActive ? null : card.key)}
							type="button"
						>
							<span className="text-lg font-bold">{count}</span>
							<span className="text-[10px] leading-tight">{card.label}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
};

export default EmailStatsBar;
