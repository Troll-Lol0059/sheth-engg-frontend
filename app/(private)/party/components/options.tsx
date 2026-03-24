"use client";
import { useState } from "react";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { MoreHorizontal, Pencil, Trash, Loader2 } from "lucide-react";

interface OptionsProps {
	party: Party;
}

const Options = ({ party }: OptionsProps) => {
	const queryClient = useQueryClient();
	const [openEditDialog, setOpenEditDialog] = useState(false);
	const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

	const [form, setForm] = useState({
		partyType: party.partyType,
		partySubType: typeof party.partySubType === "object" ? party.partySubType._id : (party.partySubType ?? ""),
		acName: party.acName ?? "",
		cpName: party.cpName ?? "",
		mobile: party.mobile ?? "",
		phone: party.phone ?? "",
		email: party.email ?? "",
		add1: party.add1 ?? "",
		add2: party.add2 ?? "",
		add3: party.add3 ?? "",
		state: party.state ?? "",
		statecd: party.statecd ?? "",
		pin: party.pin ?? "",
		gstin: party.gstin ?? "",
		pan: party.pan ?? "",
		tan: party.tan ?? "",
		cin: party.cin ?? "",
		vat: party.vat ?? "",
		cst: party.cst ?? "",
		tin: party.tin ?? "",
		ecc: party.ecc ?? "",
		stregn: party.stregn ?? "",
		range: party.range ?? "",
	});

	const { data: rawMaterialTypes = [] } = useQuery<{ _id: string; name: string }[]>({
		queryKey: ["raw-material-types-all"],
		queryFn: async () => {
			const response = await axios.get("/api/v1/master/raw-material-type/all?page=1&size=200");
			return response?.data?.data?.data ?? [];
		},
		enabled: form.partyType === "RAW_MATERIAL_DEALER" && openEditDialog,
		initialData: [],
		retry: 0,
	});

	const { data: labourProcessTypes = [] } = useQuery<{ _id: string; name: string }[]>({
		queryKey: ["labour-process-types-all"],
		queryFn: async () => {
			const response = await axios.get("/api/v1/master/labour-process-type/all?page=1&size=200");
			return response?.data?.data?.data ?? [];
		},
		enabled: form.partyType === "LABOUR_JOB_WORKER" && openEditDialog,
		initialData: [],
		retry: 0,
	});

	const subTypeOptions = form.partyType === "RAW_MATERIAL_DEALER" ? rawMaterialTypes : form.partyType === "LABOUR_JOB_WORKER" ? labourProcessTypes : [];

	const resetForm = () => {
		setForm({
			partyType: party.partyType,
			partySubType: typeof party.partySubType === "object" ? party.partySubType._id : (party.partySubType ?? ""),
			acName: party.acName ?? "",
			cpName: party.cpName ?? "",
			mobile: party.mobile ?? "",
			phone: party.phone ?? "",
			email: party.email ?? "",
			add1: party.add1 ?? "",
			add2: party.add2 ?? "",
			add3: party.add3 ?? "",
			state: party.state ?? "",
			statecd: party.statecd ?? "",
			pin: party.pin ?? "",
			gstin: party.gstin ?? "",
			pan: party.pan ?? "",
			tan: party.tan ?? "",
			cin: party.cin ?? "",
			vat: party.vat ?? "",
			cst: party.cst ?? "",
			tin: party.tin ?? "",
			ecc: party.ecc ?? "",
			stregn: party.stregn ?? "",
			range: party.range ?? "",
		});
	};

	const updateField = (field: string, value: string) => {
		setForm(prev => ({ ...prev, [field]: value }));
	};

	const { mutate: updateMutate, isPending: isUpdating } = useMutation({
		mutationFn: async () => {
			const payload: Record<string, string> = {};
			for (const [key, value] of Object.entries(form)) {
				if (value) payload[key] = value;
			}
			const response = await axios.put(`/api/v1/party/${party._id}`, payload);
			return response?.data;
		},
		onSuccess: () => {
			toast.success("Party updated successfully");
			queryClient.invalidateQueries({ queryKey: ["parties-all"] });
			setOpenEditDialog(false);
		},
		onError: (error: AxiosError) => {
			const errorData = error?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to update party");
		},
	});

	const { mutate: deleteMutate, isPending: isDeleting } = useMutation({
		mutationFn: async () => {
			const response = await axios.delete(`/api/v1/party/${party._id}`);
			return response?.data;
		},
		onSuccess: () => {
			toast.success("Party deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["parties-all"] });
			setOpenDeleteDialog(false);
		},
		onError: (error: AxiosError) => {
			const errorData = error?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to delete party");
		},
	});

	const handleEditSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.partyType) {
			toast.error("Party type is required");
			return;
		}
		updateMutate();
	};

	return (
		<>
			<Dialog
				onOpenChange={val => {
					setOpenEditDialog(val);
					if (val) resetForm();
				}}
				open={openEditDialog}
			>
				<DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Edit Party</DialogTitle>
						<DialogDescription>Update the party details.</DialogDescription>
					</DialogHeader>
					<form className="flex flex-col gap-4" onSubmit={handleEditSubmit}>
						<div className="grid grid-cols-2 gap-4">
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">
									Party Type <span className="text-destructive">*</span>
								</label>
								<Select onValueChange={val => { updateField("partyType", val); updateField("partySubType", ""); }} value={form.partyType}>
									<SelectTrigger>
										<SelectValue placeholder="Select party type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="RAW_MATERIAL_DEALER">Raw Material Dealer</SelectItem>
										<SelectItem value="LABOUR_JOB_WORKER">Labour Job Worker</SelectItem>
										<SelectItem value="COMPLETE_SUPPLY">Complete Supply</SelectItem>
									</SelectContent>
								</Select>
							</div>
							{form.partyType !== "COMPLETE_SUPPLY" && (
								<div className="flex flex-col gap-2">
									<label className="text-sm font-medium">Sub Type</label>
									<Select disabled={!form.partyType} onValueChange={val => updateField("partySubType", val)} value={form.partySubType}>
										<SelectTrigger>
											<SelectValue placeholder="Select sub type" />
										</SelectTrigger>
										<SelectContent>
											{subTypeOptions.map(opt => (
												<SelectItem key={opt._id} value={opt._id}>
													{opt.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">Account Name</label>
								<Input onChange={e => updateField("acName", e.target.value)} placeholder="Enter account name" value={form.acName} />
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">Contact Person</label>
								<Input onChange={e => updateField("cpName", e.target.value)} placeholder="Enter contact person" value={form.cpName} />
							</div>
						</div>

						<div className="grid grid-cols-3 gap-4">
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">Mobile</label>
								<Input onChange={e => updateField("mobile", e.target.value)} placeholder="Enter mobile number" value={form.mobile} />
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">Phone</label>
								<Input onChange={e => updateField("phone", e.target.value)} placeholder="Enter phone number" value={form.phone} />
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">Email</label>
								<Input onChange={e => updateField("email", e.target.value)} placeholder="Enter email address" type="email" value={form.email} />
							</div>
						</div>

						<div className="grid grid-cols-3 gap-4">
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">Address Line 1</label>
								<Input onChange={e => updateField("add1", e.target.value)} placeholder="Enter address line 1" value={form.add1} />
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">Address Line 2</label>
								<Input onChange={e => updateField("add2", e.target.value)} placeholder="Enter address line 2" value={form.add2} />
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">Address Line 3</label>
								<Input onChange={e => updateField("add3", e.target.value)} placeholder="Enter address line 3" value={form.add3} />
							</div>
						</div>

						<div className="grid grid-cols-3 gap-4">
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">State</label>
								<Input onChange={e => updateField("state", e.target.value)} placeholder="Enter state" value={form.state} />
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">State Code</label>
								<Input onChange={e => updateField("statecd", e.target.value)} placeholder="Enter state code" value={form.statecd} />
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">PIN Code</label>
								<Input onChange={e => updateField("pin", e.target.value)} placeholder="Enter PIN code" value={form.pin} />
							</div>
						</div>

						<div className="grid grid-cols-3 gap-4">
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">GSTIN</label>
								<Input onChange={e => updateField("gstin", e.target.value)} placeholder="Enter GSTIN" value={form.gstin} />
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">PAN</label>
								<Input onChange={e => updateField("pan", e.target.value)} placeholder="Enter PAN" value={form.pan} />
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">TAN</label>
								<Input onChange={e => updateField("tan", e.target.value)} placeholder="Enter TAN" value={form.tan} />
							</div>
						</div>

						<div className="grid grid-cols-3 gap-4">
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">CIN</label>
								<Input onChange={e => updateField("cin", e.target.value)} placeholder="Enter CIN" value={form.cin} />
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">VAT</label>
								<Input onChange={e => updateField("vat", e.target.value)} placeholder="Enter VAT" value={form.vat} />
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">CST</label>
								<Input onChange={e => updateField("cst", e.target.value)} placeholder="Enter CST" value={form.cst} />
							</div>
						</div>

						<div className="grid grid-cols-4 gap-4">
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">TIN</label>
								<Input onChange={e => updateField("tin", e.target.value)} placeholder="Enter TIN" value={form.tin} />
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">ECC</label>
								<Input onChange={e => updateField("ecc", e.target.value)} placeholder="Enter ECC" value={form.ecc} />
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">ST Registration</label>
								<Input onChange={e => updateField("stregn", e.target.value)} placeholder="Enter ST registration" value={form.stregn} />
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium">Range</label>
								<Input onChange={e => updateField("range", e.target.value)} placeholder="Enter range" value={form.range} />
							</div>
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
						<AlertDialogTitle>Delete Party</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete <span className="font-semibold">{party.acName ?? "this party"}</span>? This action cannot be undone.
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
