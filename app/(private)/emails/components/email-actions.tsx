"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@config/axios";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Archive, Link2, Unlink, FileText, RefreshCw } from "lucide-react";

interface EmailActionsProps {
	email: EmailRecord;
	onLinkRfq: () => void;
	onCreateRfq: () => void;
	onViewDetail: () => void;
}

const EmailActions = ({ email, onLinkRfq, onCreateRfq, onViewDetail }: EmailActionsProps) => {
	const queryClient = useQueryClient();

	const { mutate: markRead } = useMutation({
		mutationFn: () => axios.patch(`/api/v1/email/${email._id}/read`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["emails"] });
			queryClient.invalidateQueries({ queryKey: ["email-unread-count"] });
		},
	});

	const { mutate: archive } = useMutation({
		mutationFn: () => axios.patch(`/api/v1/email/${email._id}/archive`),
		onSuccess: () => {
			toast.success("Email archived");
			queryClient.invalidateQueries({ queryKey: ["emails"] });
		},
	});

	const { mutate: unlink } = useMutation({
		mutationFn: () => axios.patch(`/api/v1/email/${email._id}/unlink`),
		onSuccess: () => {
			toast.success("Unlinked");
			queryClient.invalidateQueries({ queryKey: ["emails"] });
		},
	});

	const { mutate: reclassify } = useMutation({
		mutationFn: () => axios.post(`/api/v1/email/${email._id}/classify`),
		onSuccess: () => {
			toast.success("Re-classified");
			queryClient.invalidateQueries({ queryKey: ["emails"] });
		},
	});

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button className="h-8 w-8 p-0" variant="ghost">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={onViewDetail}>
					<Eye className="mr-2 h-4 w-4" />
					View Details
				</DropdownMenuItem>
				{!email.isRead && (
					<DropdownMenuItem onClick={() => markRead()}>
						<Eye className="mr-2 h-4 w-4" />
						Mark as Read
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				{(email.classification.category === "NEW_RFQ" || email.source !== "UNKNOWN") && (
					<DropdownMenuItem onClick={onCreateRfq}>
						<FileText className="mr-2 h-4 w-4" />
						Create RFQ
					</DropdownMenuItem>
				)}
				<DropdownMenuItem onClick={onLinkRfq}>
					<Link2 className="mr-2 h-4 w-4" />
					Link to RFQ
				</DropdownMenuItem>
				{email.linkedRfq && (
					<DropdownMenuItem onClick={() => unlink()}>
						<Unlink className="mr-2 h-4 w-4" />
						Unlink
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => reclassify()}>
					<RefreshCw className="mr-2 h-4 w-4" />
					Re-classify
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => archive()}>
					<Archive className="mr-2 h-4 w-4" />
					Archive
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default EmailActions;
