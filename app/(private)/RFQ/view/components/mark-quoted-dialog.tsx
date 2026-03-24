"use client";
import { useState } from "react";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@components/ui/alert-dialog";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

interface MarkQuotedDialogProps {
	rfq: Rfq;
}

const MarkQuotedDialog = ({ rfq }: MarkQuotedDialogProps) => {
	const queryClient = useQueryClient();
	const [quotedOpen, setQuotedOpen] = useState(false);
	const [regretOpen, setRegretOpen] = useState(false);

	const quotedMutation = useMutation({
		mutationFn: async () => {
			const response = await axios.patch(`/api/v1/rfq/${rfq._id}/mark-quoted`);
			return response?.data?.data;
		},
		onSuccess: () => {
			toast.success(rfq.isQuoted ? "RFQ marked as revised" : "RFQ marked as quoted");
			queryClient.invalidateQueries({ queryKey: ["rfq", rfq._id] });
			queryClient.invalidateQueries({ queryKey: ["rfqs-all"] });
			setQuotedOpen(false);
		},
		onError: (error: unknown) => {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to update RFQ status");
		},
	});

	const regretMutation = useMutation({
		mutationFn: async () => {
			const response = await axios.patch(`/api/v1/rfq/${rfq._id}/mark-regret`);
			return response?.data?.data;
		},
		onSuccess: () => {
			toast.success("RFQ marked as regret");
			queryClient.invalidateQueries({ queryKey: ["rfq", rfq._id] });
			queryClient.invalidateQueries({ queryKey: ["rfqs-all"] });
			setRegretOpen(false);
		},
		onError: (error: unknown) => {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to mark RFQ as regret");
		},
	});

	if (rfq.isRegret) {
		return null;
	}

	return (
		<div className="flex items-center gap-2">
			<AlertDialog onOpenChange={setQuotedOpen} open={quotedOpen}>
				<AlertDialogTrigger asChild>
					<Button size="sm" variant={rfq.isQuoted ? "outline" : "default"}>
						<CheckCircle className="mr-2 h-4 w-4" />
						{rfq.isQuoted ? "Mark as Revised" : "Mark as Quoted"}
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{rfq.isQuoted ? "Mark RFQ as Revised?" : "Mark RFQ as Quoted?"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{rfq.isQuoted
								? `This will mark PR "${rfq.prNumber}" as revised with the current date. The RFQ will remain in the Quoted table.`
								: `This will mark PR "${rfq.prNumber}" as quoted and move it to the Quoted RFQ table. A unique quotation number will be assigned. At least one item must have costing.`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={quotedMutation.isPending}>Cancel</AlertDialogCancel>
						<AlertDialogAction disabled={quotedMutation.isPending} onClick={() => quotedMutation.mutate()}>
							{quotedMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Processing...
								</>
							) : (
								"Confirm"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{!rfq.isQuoted && (
				<AlertDialog onOpenChange={setRegretOpen} open={regretOpen}>
					<AlertDialogTrigger asChild>
						<Button size="sm" variant="destructive">
							<XCircle className="mr-2 h-4 w-4" />
							Mark as Regret
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Mark RFQ as Regret?</AlertDialogTitle>
							<AlertDialogDescription>
								This will mark PR &quot;{rfq.prNumber}&quot; as regret. The RFQ will be moved to the Regret RFQ table.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={regretMutation.isPending}>Cancel</AlertDialogCancel>
							<AlertDialogAction disabled={regretMutation.isPending} onClick={() => regretMutation.mutate()}>
								{regretMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Processing...
									</>
								) : (
									"Confirm"
								)}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</div>
	);
};

export default MarkQuotedDialog;
