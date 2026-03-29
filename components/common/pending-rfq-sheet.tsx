"use client";

import { useState } from "react";
import axios from "@config/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Eye, CheckCircle } from "lucide-react";
import { cn } from "@lib/utils";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { ScrollArea } from "@components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@components/ui/sheet";
import { toast } from "@components/ui/toaster";

type Period = "today" | "week" | "all";
type Urgency = "overdue" | "today" | "tomorrow" | "soon" | "normal";

interface PendingRfq {
	_id: string;
	prNumber: string;
	companyName: string;
	ownerName: string;
	location: string;
	dueDate: string;
	status: string;
	itemCount: number;
	daysRemaining: number;
	urgency: Urgency;
	isReviewed: boolean;
}

interface PendingSummary {
	rfqs: PendingRfq[];
	counts: {
		overdue: number;
		dueToday: number;
		dueThisWeek: number;
		total: number;
	};
}

const urgencyColors: Record<Urgency, string> = {
	overdue: "border-l-red-500",
	today: "border-l-red-500",
	tomorrow: "border-l-orange-500",
	soon: "border-l-yellow-500",
	normal: "border-l-border",
};

const urgencyBadgeVariant: Record<Urgency, "destructive" | "warning" | "default"> = {
	overdue: "destructive",
	today: "destructive",
	tomorrow: "warning",
	soon: "warning",
	normal: "default",
};

const periodLabels: { value: Period; label: string }[] = [
	{ value: "today", label: "Due Today" },
	{ value: "week", label: "This Week" },
	{ value: "all", label: "All Pending" },
];

interface PendingRfqSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const PendingRfqSheet = ({ open, onOpenChange }: PendingRfqSheetProps) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [period, setPeriod] = useState<Period>("today");

	const { data, isLoading } = useQuery<PendingSummary>({
		queryKey: ["pending-rfqs", period],
		queryFn: async () => {
			const res = await axios.get(`/api/v1/rfq/pending-summary?period=${period}`);
			return res?.data?.data;
		},
		enabled: open,
	});

	const { mutate: markReviewed } = useMutation({
		mutationFn: async (rfqId: string) => {
			await axios.patch(`/api/v1/rfq/${rfqId}/mark-reviewed`);
		},
		onSuccess: () => {
			toast.success("RFQ marked as reviewed");
			queryClient.invalidateQueries({ queryKey: ["pending-rfqs"] });
			queryClient.invalidateQueries({ queryKey: ["pending-rfq-count"] });
		},
		onError: () => {
			toast.error("Failed to mark RFQ as reviewed");
		},
	});

	const rfqs = data?.rfqs ?? [];
	const counts = data?.counts;

	const handleView = (rfqId: string) => {
		onOpenChange(false);
		router.push(`/rfq/${rfqId}`);
	};

	const getDaysLabel = (days: number): string => {
		if (days < 0) return `${Math.abs(days)}d overdue`;
		if (days === 0) return "Due today";
		if (days === 1) return "1d left";
		return `${days}d left`;
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="sm:max-w-2xl">
				<SheetHeader>
					<SheetTitle>Pending RFQs</SheetTitle>
					<SheetDescription>RFQs requiring attention based on due dates</SheetDescription>
				</SheetHeader>

				<div className="mt-4 flex gap-2">
					{periodLabels.map(p => (
						<Button key={p.value} size="sm" variant={period === p.value ? "default" : "outline"} onClick={() => setPeriod(p.value)}>
							{p.label}
						</Button>
					))}
				</div>

				{counts && (
					<div className="mt-3 flex gap-3 text-sm">
						{counts.overdue > 0 && <span className="font-medium text-red-500">{counts.overdue} overdue</span>}
						{counts.dueToday > 0 && <span className="font-medium text-orange-500">{counts.dueToday} due today</span>}
						<span className="text-muted-foreground">{counts.total} total</span>
					</div>
				)}

				<ScrollArea className="mt-4 h-[calc(100vh-220px)]">
					{isLoading ? (
						<div className="text-muted-foreground flex items-center justify-center py-12 text-sm">Loading...</div>
					) : rfqs.length === 0 ? (
						<div className="text-muted-foreground flex items-center justify-center py-12 text-sm">No pending RFQs for this period</div>
					) : (
						<div className="flex flex-col gap-2 pr-4">
							{rfqs.map(rfq => (
								<div key={rfq._id} className={cn("rounded-md border border-l-4 p-3", urgencyColors[rfq.urgency])}>
									<div className="flex items-start justify-between gap-2">
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<span className="truncate font-semibold">{rfq.prNumber}</span>
												<Badge variant={urgencyBadgeVariant[rfq.urgency]} className="shrink-0 text-[10px]">
													{getDaysLabel(rfq.daysRemaining)}
												</Badge>
											</div>
											<p className="text-muted-foreground mt-0.5 truncate text-sm">{rfq.companyName}</p>
											<div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
												<span>Due: {format(new Date(rfq.dueDate), "dd MMM yyyy")}</span>
												<span>{rfq.itemCount} item{rfq.itemCount !== 1 ? "s" : ""}</span>
												<Badge variant="outline" className="text-[10px]">
													{rfq.status.replace("_", " ")}
												</Badge>
											</div>
										</div>
										<div className="flex shrink-0 gap-1">
											<Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => handleView(rfq._id)}>
												<Eye size={14} />
												<span className="ml-1 hidden sm:inline">View</span>
											</Button>
											{!rfq.isReviewed && (
												<Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => markReviewed(rfq._id)}>
													<CheckCircle size={14} />
													<span className="ml-1 hidden sm:inline">Reviewed</span>
												</Button>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
};

export default PendingRfqSheet;
