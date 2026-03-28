"use client";

import { useState } from "react";
import axios from "@config/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { ScrollArea } from "@components/ui/scroll-area";
import { Search, Loader2, CheckCircle } from "lucide-react";

interface LinkRfqDialogProps {
	emailId: string;
	open: boolean;
	onClose: () => void;
}

const LinkRfqDialog = ({ emailId, open, onClose }: LinkRfqDialogProps) => {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");

	const { data: rfqs, isLoading } = useQuery<Rfq[]>({
		queryKey: ["rfqs-for-link", search],
		queryFn: async () => {
			const params = new URLSearchParams({ page: "1", size: "20", sortBy: "createdAt", sortOrder: "desc" });
			if (search) params.append("search", search);
			const res = await axios.get(`/api/v1/rfq/all?${params}`);
			return res?.data?.data?.data ?? [];
		},
		enabled: open,
	});

	const { mutate: linkRfq, isPending } = useMutation({
		mutationFn: (rfqId: string) => axios.patch(`/api/v1/email/${emailId}/link-rfq`, { rfqId }),
		onSuccess: () => {
			toast.success("Linked to RFQ");
			queryClient.invalidateQueries({ queryKey: ["emails"] });
			onClose();
		},
		onError: () => toast.error("Failed to link"),
	});

	return (
		<Dialog onOpenChange={v => !v && onClose()} open={open}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Link to RFQ</DialogTitle>
				</DialogHeader>
				<div className="relative">
					<Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
					<Input className="pl-9" onChange={e => setSearch(e.target.value)} placeholder="Search by PR number or company..." value={search} />
				</div>
				<ScrollArea className="max-h-[300px]">
					{isLoading ? (
						<div className="flex justify-center py-8">
							<Loader2 className="h-5 w-5 animate-spin" />
						</div>
					) : !rfqs || rfqs.length === 0 ? (
						<p className="text-muted-foreground py-8 text-center text-sm">No RFQs found</p>
					) : (
						<div className="space-y-1">
							{rfqs.map(rfq => (
								<button
									className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/50"
									disabled={isPending}
									key={rfq._id}
									onClick={() => linkRfq(rfq._id)}
									type="button"
								>
									<div className="min-w-0 flex-1">
										<p className="text-sm font-medium">{rfq.prNumber}</p>
										<p className="text-muted-foreground truncate text-xs">{rfq.companyName} — {rfq.location}</p>
									</div>
									<CheckCircle className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100" />
								</button>
							))}
						</div>
					)}
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
};

export default LinkRfqDialog;
