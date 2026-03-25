"use client";
import { useState } from "react";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Pencil, Trash, KeyRound } from "lucide-react";

const ROLES = [
	{ value: "ROLE_ADMIN", label: "Admin" },
	{ value: "ROLE_OFFICE_STAFF", label: "Office Staff" },
	{ value: "ROLE_FIELD_STAFF", label: "Field Staff" },
];

const Options = ({ staff }: { staff: Staff }) => {
	const queryClient = useQueryClient();
	const isOwner = staff.role === "ROLE_OWNER";

	// Edit state
	const [editOpen, setEditOpen] = useState(false);
	const [editForm, setEditForm] = useState({
		firstName: staff.firstName,
		middleName: staff.middleName || "",
		lastName: staff.lastName,
		email: staff.email,
		phoneNumber: staff.phoneNumber || "",
		role: staff.role,
	});

	// Delete state
	const [deleteOpen, setDeleteOpen] = useState(false);

	// Reset password state
	const [resetPwOpen, setResetPwOpen] = useState(false);
	const [newPassword, setNewPassword] = useState("");

	const updateEditField = (field: string, value: string) => {
		setEditForm(prev => ({ ...prev, [field]: value }));
	};

	const { mutate: updateStaff, isPending: isUpdating } = useMutation({
		mutationFn: async () => {
			const response = await axios.put(`/api/v1/staff/${staff._id}`, editForm);
			return response?.data?.data as Staff;
		},
		onSuccess: () => {
			toast.success("Staff member updated successfully");
			queryClient.invalidateQueries({ queryKey: ["staff-all"] });
			setEditOpen(false);
		},
		onError: (error: unknown) => {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to update staff member");
		},
	});

	const { mutate: deleteStaff, isPending: isDeleting } = useMutation({
		mutationFn: async () => {
			await axios.delete(`/api/v1/staff/${staff._id}`);
		},
		onSuccess: () => {
			toast.success("Staff member deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["staff-all"] });
			setDeleteOpen(false);
		},
		onError: (error: unknown) => {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to delete staff member");
		},
	});

	const { mutate: resetPassword, isPending: isResetting } = useMutation({
		mutationFn: async () => {
			await axios.patch(`/api/v1/staff/${staff._id}/reset-password`, { newPassword });
		},
		onSuccess: () => {
			toast.success("Password reset successfully");
			setResetPwOpen(false);
			setNewPassword("");
		},
		onError: (error: unknown) => {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to reset password");
		},
	});

	const handleEdit = (e: React.FormEvent) => {
		e.preventDefault();
		updateStaff();
	};

	const handleResetPassword = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newPassword) {
			toast.error("Please enter a new password");
			return;
		}
		resetPassword();
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button className="h-8 w-8 p-0" variant="ghost">
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>Actions</DropdownMenuLabel>
					<DropdownMenuItem disabled={isOwner} onClick={() => setEditOpen(true)}>
						<Pencil className="mr-2 h-4 w-4" />
						Edit
					</DropdownMenuItem>
					<DropdownMenuItem disabled={isOwner} onClick={() => setResetPwOpen(true)}>
						<KeyRound className="mr-2 h-4 w-4" />
						Reset Password
					</DropdownMenuItem>
					<DropdownMenuItem className="text-destructive" disabled={isOwner} onClick={() => setDeleteOpen(true)}>
						<Trash className="mr-2 h-4 w-4" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Edit Dialog */}
			<Dialog onOpenChange={setEditOpen} open={editOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Edit Staff Member</DialogTitle>
						<DialogDescription>Update details for {staff.userName}</DialogDescription>
					</DialogHeader>
					<form className="space-y-4" onSubmit={handleEdit}>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>First Name</Label>
								<Input onChange={e => updateEditField("firstName", e.target.value)} value={editForm.firstName} />
							</div>
							<div className="space-y-2">
								<Label>Middle Name</Label>
								<Input onChange={e => updateEditField("middleName", e.target.value)} value={editForm.middleName} />
							</div>
							<div className="space-y-2">
								<Label>Last Name</Label>
								<Input onChange={e => updateEditField("lastName", e.target.value)} value={editForm.lastName} />
							</div>
							<div className="space-y-2">
								<Label>Email</Label>
								<Input onChange={e => updateEditField("email", e.target.value)} type="email" value={editForm.email} />
							</div>
							<div className="space-y-2">
								<Label>Phone Number</Label>
								<Input onChange={e => updateEditField("phoneNumber", e.target.value)} value={editForm.phoneNumber} />
							</div>
							<div className="space-y-2">
								<Label>Role</Label>
								<Select onValueChange={val => updateEditField("role", val)} value={editForm.role}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{ROLES.map(r => (
											<SelectItem key={r.value} value={r.value}>
												{r.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<DialogFooter>
							<Button disabled={isUpdating} type="submit">
								{isUpdating ? (
									<>
										<Loader2 className="mr-1 h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									"Save Changes"
								)}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Dialog */}
			<AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete <strong>{staff.firstName} {staff.lastName}</strong> ({staff.userName})? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction disabled={isDeleting} onClick={() => deleteStaff()}>
							{isDeleting ? (
								<>
									<Loader2 className="mr-1 h-4 w-4 animate-spin" />
									Deleting...
								</>
							) : (
								"Delete"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Reset Password Dialog */}
			<Dialog onOpenChange={val => { setResetPwOpen(val); if (!val) setNewPassword(""); }} open={resetPwOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Reset Password</DialogTitle>
						<DialogDescription>Set a new password for {staff.userName}</DialogDescription>
					</DialogHeader>
					<form className="space-y-4" onSubmit={handleResetPassword}>
						<div className="space-y-2">
							<Label>New Password</Label>
							<Input onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 chars, upper+lower+number" type="password" value={newPassword} />
						</div>
						<DialogFooter>
							<Button disabled={isResetting} type="submit">
								{isResetting ? (
									<>
										<Loader2 className="mr-1 h-4 w-4 animate-spin" />
										Resetting...
									</>
								) : (
									"Reset Password"
								)}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default Options;
