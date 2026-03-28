"use client";

import { useState } from "react";
import axios from "@config/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { ScrollArea } from "@components/ui/scroll-area";
import { Search, Loader2 } from "lucide-react";

interface LinkPoDialogProps {
	emailId: string;
	open: boolean;
	onClose: () => void;
}

const LinkPoDialog = ({ emailId, open, onClose }: LinkPoDialogProps) => {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");

	const { data: pos, isLoading } = useQuery<PORegister[]>({
		queryKey: ["pos-for-link", search],
		queryFn: async () => {
			const params = new URLSearchParams({ page: "1", size: "20", sortBy: "createdAt", sortOrder: "desc" });
			if (search) params.append("search", search);
			const res = await axios.get(`/api/v1/po-register/all?${params}`);
			return res?.data?.data?.data ?? [];
		},
		enabled: open,
	});

	const { mutate: linkPo, isPending } = useMutation({
		mutationFn: (poId: string) => axios.patch(`/api/v1/email/${emailId}/link-po`, { poId }),
		onSuccess: () => {
			toast.success("Linked to PO");
			queryClient.invalidateQueries({ queryKey: ["emails"] });
			onClose();
		},
		onError: () => toast.error("Failed to link"),
	});

	return (
		<Dialog onOpenChange={v => !v && onClose()} open={open}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Link to PO</DialogTitle>
				</DialogHeader>
				<div className="relative">
					<Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
					<Input className="pl-9" onChange={e => setSearch(e.target.value)} placeholder="Search by PO number or company..." value={search} />
				</div>
				<ScrollArea className="max-h-[300px]">
					{isLoading ? (
						<div className="flex justify-center py-8">
							<Loader2 className="h-5 w-5 animate-spin" />
						</div>
					) : !pos || pos.length === 0 ? (
						<p className="text-muted-foreground py-8 text-center text-sm">No POs found</p>
					) : (
						<div className="space-y-1">
							{pos.map(po => (
								<button
									className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/50"
									disabled={isPending}
									key={po._id}
									onClick={() => linkPo(po._id)}
									type="button"
								>
									<div className="min-w-0 flex-1">
										<p className="text-sm font-medium">{po.poNumber}</p>
										<p className="text-muted-foreground truncate text-xs">{po.companyName}</p>
									</div>
								</button>
							))}
						</div>
					)}
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
};

export default LinkPoDialog;
