"use client";
import { useState } from "react";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@components/ui/alert-dialog";
import { MoreHorizontal, Pencil, Trash, Loader2 } from "lucide-react";

interface OptionsProps {
	hardnessMeasurement: HardnessMeasurement;
}

const Options = ({ hardnessMeasurement }: OptionsProps) => {
	const queryClient = useQueryClient();
	const [openEditDialog, setOpenEditDialog] = useState(false);
	const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
	const [editName, setEditName] = useState(hardnessMeasurement.name);
	const [editDescription, setEditDescription] = useState(hardnessMeasurement.description ?? "");

	const { mutate: updateMutate, isPending: isUpdating } = useMutation({
		mutationFn: async () => {
			const response = await axios.put(`/api/v1/master/hardness-measurement/${hardnessMeasurement._id}`, { name: editName, description: editDescription || undefined });
			return response?.data;
		},
		onSuccess: () => {
			toast.success("Hardness measurement updated successfully");
			queryClient.invalidateQueries({ queryKey: ["hardness-measurements-all"] });
			setOpenEditDialog(false);
		},
		onError: (error: AxiosError) => {
			const errorData = error?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to update hardness measurement");
		},
	});

	const { mutate: deleteMutate, isPending: isDeleting } = useMutation({
		mutationFn: async () => {
			const response = await axios.delete(`/api/v1/master/hardness-measurement/${hardnessMeasurement._id}`);
			return response?.data;
		},
		onSuccess: () => {
			toast.success("Hardness measurement deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["hardness-measurements-all"] });
			setOpenDeleteDialog(false);
		},
		onError: (error: AxiosError) => {
			const errorData = error?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to delete hardness measurement");
		},
	});

	const handleEditSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!editName.trim()) {
			toast.error("Name is required");
			return;
		}
		updateMutate();
	};

	return (
		<>
			<Dialog
				onOpenChange={val => {
					setOpenEditDialog(val);
					if (val) {
						setEditName(hardnessMeasurement.name);
						setEditDescription(hardnessMeasurement.description ?? "");
					}
				}}
				open={openEditDialog}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Hardness Measurement</DialogTitle>
						<DialogDescription>Update the hardness measurement details.</DialogDescription>
					</DialogHeader>
					<form className="flex flex-col gap-4" onSubmit={handleEditSubmit}>
						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium" htmlFor="edit-name">
								Name <span className="text-destructive">*</span>
							</label>
							<Input id="edit-name" onChange={e => setEditName(e.target.value)} placeholder="Enter hardness measurement name" required value={editName} />
						</div>
						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium" htmlFor="edit-description">
								Description
							</label>
							<Input id="edit-description" onChange={e => setEditDescription(e.target.value)} placeholder="Enter description (optional)" value={editDescription} />
						</div>
						<DialogFooter>
							<Button disabled={isUpdating} type="submit">
								{isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Save Changes
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<AlertDialog onOpenChange={setOpenDeleteDialog} open={openDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Hardness Measurement</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete <span className="font-semibold">{hardnessMeasurement.name}</span>? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting} onClick={() => deleteMutate()}>
							{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button className="h-8 w-8 p-0" variant="ghost">
						<span className="sr-only">Open menu</span>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>Actions</DropdownMenuLabel>
					<DropdownMenuItem className="gap-2" onClick={() => setOpenEditDialog(true)}>
						<Pencil className="h-4 w-4" />
						Edit
					</DropdownMenuItem>
					<DropdownMenuItem className="gap-2 text-destructive" onClick={() => setOpenDeleteDialog(true)}>
						<Trash className="h-4 w-4" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
};

export default Options;
