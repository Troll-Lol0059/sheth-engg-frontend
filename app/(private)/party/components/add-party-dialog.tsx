"use client";
import { useState, useEffect } from "react";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Plus, Loader2 } from "lucide-react";

interface AddPartyDialogProps {
	onConfirmed?: () => void;
}

const initialFormState = {
	partyType: "" as string,
	partySubType: "" as string,
	acName: "",
	cpName: "",
	mobile: "",
	phone: "",
	email: "",
	add1: "",
	add2: "",
	add3: "",
	state: "",
	statecd: "",
	pin: "",
	gstin: "",
	pan: "",
	tan: "",
	cin: "",
	vat: "",
	cst: "",
	tin: "",
	ecc: "",
	stregn: "",
	range: "",
};

const AddPartyDialog = ({ onConfirmed }: AddPartyDialogProps) => {
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState(initialFormState);
	const queryClient = useQueryClient();

	const { data: rawMaterialTypes = [] } = useQuery<{ _id: string; name: string }[]>({
		queryKey: ["raw-material-types-all"],
		queryFn: async () => {
			const response = await axios.get("/api/v1/master/raw-material-type/all");
			return response?.data?.data ?? [];
		},
		enabled: form.partyType === "RAW_MATERIAL_DEALER",
		initialData: [],
		retry: 0,
	});

	const { data: labourProcessTypes = [] } = useQuery<{ _id: string; name: string }[]>({
		queryKey: ["labour-process-types-all"],
		queryFn: async () => {
			const response = await axios.get("/api/v1/master/labour-process-type/all");
			return response?.data?.data ?? [];
		},
		enabled: form.partyType === "LABOUR_JOB_WORKER",
		initialData: [],
		retry: 0,
	});

	const subTypeOptions = form.partyType === "RAW_MATERIAL_DEALER" ? rawMaterialTypes : form.partyType === "LABOUR_JOB_WORKER" ? labourProcessTypes : [];

	useEffect(() => {
		setForm(prev => ({ ...prev, partySubType: "" }));
	}, [form.partyType]);

	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			const payload: Record<string, string> = {};
			for (const [key, value] of Object.entries(form)) {
				if (value) payload[key] = value;
			}
			const response = await axios.post("/api/v1/party", payload);
			return response?.data;
		},
		onSuccess: () => {
			toast.success("Party created successfully");
			queryClient.invalidateQueries({ queryKey: ["parties-all"] });
			setOpen(false);
			resetState();
			onConfirmed?.();
		},
		onError: (error: AxiosError) => {
			const errorData = error?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to create party");
		},
	});

	const resetState = () => {
		setForm(initialFormState);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.partyType) {
			toast.error("Party type is required");
			return;
		}
		if (!form.acName.trim()) {
			toast.error("Account name is required");
			return;
		}
		mutate();
	};

	const updateField = (field: string, value: string) => {
		setForm(prev => ({ ...prev, [field]: value }));
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
					Add Party
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Add Party</DialogTitle>
					<DialogDescription>Create a new party record.</DialogDescription>
				</DialogHeader>
				<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
					<div className="grid grid-cols-2 gap-4">
						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium">
								Party Type <span className="text-destructive">*</span>
							</label>
							<Select onValueChange={val => updateField("partyType", val)} value={form.partyType}>
								<SelectTrigger>
									<SelectValue placeholder="Select party type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="RAW_MATERIAL_DEALER">Raw Material Dealer</SelectItem>
									<SelectItem value="LABOUR_JOB_WORKER">Labour Job Worker</SelectItem>
								</SelectContent>
							</Select>
						</div>
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
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium">Account Name <span className="text-destructive">*</span></label>
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

export default AddPartyDialog;
