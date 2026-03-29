"use client";

import { useState } from "react";
import axios from "@config/axios";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { Button } from "@components/ui/button";
import PendingRfqSheet from "./pending-rfq-sheet";

interface PendingCounts {
	overdue: number;
	dueToday: number;
	dueThisWeek: number;
	total: number;
}

const PendingRfqBadge = () => {
	const [open, setOpen] = useState(false);

	const { data } = useQuery<PendingCounts>({
		queryKey: ["pending-rfq-count"],
		queryFn: async () => {
			const res = await axios.get("/api/v1/rfq/pending-summary?period=today");
			return res?.data?.data?.counts;
		},
		refetchInterval: 30_000,
	});

	const urgentCount = (data?.overdue ?? 0) + (data?.dueToday ?? 0);

	return (
		<>
			<Button onClick={() => setOpen(true)} size="icon" variant="ghost">
				<div className="relative flex size-8 items-center justify-center">
					<Clock size={20} />
					{urgentCount > 0 && (
						<span className="bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
							{urgentCount > 99 ? "99+" : urgentCount}
						</span>
					)}
				</div>
			</Button>
			<PendingRfqSheet open={open} onOpenChange={setOpen} />
		</>
	);
};

export default PendingRfqBadge;
