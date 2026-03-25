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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@components/ui/dialog";
import { Loader2, Plus } from "lucide-react";

const ROLES = [
	{ value: "ROLE_ADMIN", label: "Admin" },
	{ value: "ROLE_OFFICE_STAFF", label: "Office Staff" },
	{ value: "ROLE_FIELD_STAFF", label: "Field Staff" },
];

const initialForm = {
	userName: "",
	email: "",
	firstName: "",
	middleName: "",
	lastName: "",
	phoneNumber: "",
	role: "ROLE_FIELD_STAFF",
	password: "",
};

const AddStaffDialog = () => {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState(initialForm);

	const updateField = (field: string, value: string) => {
		setForm(prev => ({ ...prev, [field]: value }));
	};

	const resetState = () => setForm(initialForm);

	const { mutate: createStaff, isPending } = useMutation({
		mutationFn: async () => {
			const response = await axios.post("/api/v1/staff", form);
			return response?.data?.data as Staff;
		},
		onSuccess: () => {
			toast.success("Staff member created successfully");
			queryClient.invalidateQueries({ queryKey: ["staff-all"] });
			setOpen(false);
			resetState();
		},
		onError: (error: unknown) => {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to create staff member");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.userName || !form.email || !form.firstName || !form.lastName || !form.password) {
			toast.error("Please fill in all required fields");
			return;
		}
		createStaff();
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
					Add Staff
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Add New Staff Member</DialogTitle>
					<DialogDescription>Create a new staff account with login credentials</DialogDescription>
				</DialogHeader>
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>
								Username <span className="text-destructive">*</span>
							</Label>
							<Input onChange={e => updateField("userName", e.target.value)} placeholder="john_doe" value={form.userName} />
						</div>
						<div className="space-y-2">
							<Label>
								Email <span className="text-destructive">*</span>
							</Label>
							<Input onChange={e => updateField("email", e.target.value)} placeholder="john@example.com" type="email" value={form.email} />
						</div>
						<div className="space-y-2">
							<Label>
								First Name <span className="text-destructive">*</span>
							</Label>
							<Input onChange={e => updateField("firstName", e.target.value)} placeholder="John" value={form.firstName} />
						</div>
						<div className="space-y-2">
							<Label>Middle Name</Label>
							<Input onChange={e => updateField("middleName", e.target.value)} placeholder="(optional)" value={form.middleName} />
						</div>
						<div className="space-y-2">
							<Label>
								Last Name <span className="text-destructive">*</span>
							</Label>
							<Input onChange={e => updateField("lastName", e.target.value)} placeholder="Doe" value={form.lastName} />
						</div>
						<div className="space-y-2">
							<Label>Phone Number</Label>
							<Input onChange={e => updateField("phoneNumber", e.target.value)} placeholder="+91 98765 43210" value={form.phoneNumber} />
						</div>
						<div className="space-y-2">
							<Label>Role</Label>
							<Select onValueChange={val => updateField("role", val)} value={form.role}>
								<SelectTrigger>
									<SelectValue placeholder="Select role" />
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
						<div className="space-y-2">
							<Label>
								Password <span className="text-destructive">*</span>
							</Label>
							<Input onChange={e => updateField("password", e.target.value)} placeholder="Min 8 chars, upper+lower+number" type="password" value={form.password} />
						</div>
					</div>
					<DialogFooter>
						<Button disabled={isPending} type="submit">
							{isPending ? (
								<>
									<Loader2 className="mr-1 h-4 w-4 animate-spin" />
									Creating...
								</>
							) : (
								"Create Staff"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default AddStaffDialog;
