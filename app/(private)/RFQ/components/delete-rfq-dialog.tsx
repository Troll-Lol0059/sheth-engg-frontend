"use client";
import axios from "@config/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface DeleteRfqDialogProps {
	openDialog: boolean;
	setOpenDialog: (open: boolean) => void;
	rfq: Rfq;
}

const deleteRfqApi = async (rfqId: string) => {
	const response = await axios.delete(`/api/v1/rfq/${rfqId}`);
	return response?.data;
};

const DeleteRfqDialog = ({ openDialog, setOpenDialog, rfq }: DeleteRfqDialogProps) => {
	const queryClient = useQueryClient();

	const { mutate, isPending } = useMutation({
		mutationFn: () => deleteRfqApi(rfq._id),
		onSuccess: () => {
			toast.success("RFQ deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["rfqs-all"] });
			setOpenDialog(false);
		},
		onError: () => {
			toast.error("Failed to delete RFQ");
		},
	});

	return (
		<AlertDialog onOpenChange={setOpenDialog} open={openDialog}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete RFQ</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete RFQ <span className="font-semibold">{rfq.prNumber}</span>? This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
					<AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isPending} onClick={() => mutate()}>
						{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default DeleteRfqDialog;
