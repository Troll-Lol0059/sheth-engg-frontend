"use client";
import { useState } from "react";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";

interface AddRawMaterialTypeDialogProps {
	onConfirmed?: () => void;
}

const AddRawMaterialTypeDialog = ({ onConfirmed }: AddRawMaterialTypeDialogProps) => {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const queryClient = useQueryClient();

	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			const response = await axios.post("/api/v1/master/raw-material-type", { name, description: description || undefined });
			return response?.data;
		},
		onSuccess: () => {
			toast.success("Raw material type created successfully");
			queryClient.invalidateQueries({ queryKey: ["raw-material-types-all"] });
			setOpen(false);
			resetState();
			onConfirmed?.();
		},
		onError: (error: AxiosError) => {
			const errorData = error?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to create raw material type");
		},
	});

	const resetState = () => {
		setName("");
		setDescription("");
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error("Name is required");
			return;
		}
		mutate();
	};

	return (
		<Dialog
			onOpenChange={val => {
				setOpen(val);
				if (!val) resetState();
			}}
			open={open}
		>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-1 h-4 w-4" />
					Add Raw Material Type
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Raw Material Type</DialogTitle>
					<DialogDescription>Create a new raw material type definition.</DialogDescription>
				</DialogHeader>
				<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
					<div className="flex flex-col gap-2">
						<label className="text-sm font-medium" htmlFor="name">
							Name <span className="text-destructive">*</span>
						</label>
						<Input id="name" onChange={e => setName(e.target.value)} placeholder="Enter raw material type name" required value={name} />
					</div>
					<div className="flex flex-col gap-2">
						<label className="text-sm font-medium" htmlFor="description">
							Description
						</label>
						<Input id="description" onChange={e => setDescription(e.target.value)} placeholder="Enter description (optional)" value={description} />
					</div>
					<DialogFooter>
						<Button disabled={isPending} type="submit">
							{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Create
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default AddRawMaterialTypeDialog;
