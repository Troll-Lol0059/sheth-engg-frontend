"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@components/ui/dialog";
import { Pencil } from "lucide-react";

type TransportDetailsForm = {
	transporterName: string;
	transporterGstin: string;
	consignmentNumber: string;
	ewayBillNumber: string;
};

type EditTransportDetailsDialogProps = {
	sale: SalesRecord;
};

const EditTransportDetailsDialog = ({ sale }: EditTransportDetailsDialogProps) => {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState<TransportDetailsForm>({
		transporterName: sale.transporterName ?? "",
		transporterGstin: sale.transporterGstin ?? "",
		consignmentNumber: sale.consignmentNumber ?? "",
		ewayBillNumber: sale.ewayBillNumber ?? "",
	});

	const mutation = useMutation({
		mutationFn: async (payload: TransportDetailsForm) => {
			const response = await axios.patch(`/api/v1/sales/${sale._id}/transport-details`, payload);
			return response?.data?.data as SalesRecord;
		},
		onSuccess: () => {
			toast.success("Transport details updated");
			setOpen(false);
			router.refresh();
		},
		onError: (error: AxiosError<ErrorData>) => {
			toast.error(error.response?.data?.message ?? "Failed to update transport details");
		},
	});

	const handleChange = (field: keyof TransportDetailsForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm(prev => ({ ...prev, [field]: e.target.value }));
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" variant="ghost">
					<Pencil size={14} />
					Edit
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Edit Transport Details</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="transporterName">Transporter Name</Label>
						<Input id="transporterName" value={form.transporterName} onChange={handleChange("transporterName")} placeholder="e.g. VRL Logistics Ltd." />
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="transporterGstin">Transporter GSTIN</Label>
						<Input id="transporterGstin" value={form.transporterGstin} onChange={handleChange("transporterGstin")} />
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="consignmentNumber">Consignment Number</Label>
						<Input id="consignmentNumber" value={form.consignmentNumber} onChange={handleChange("consignmentNumber")} />
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="ewayBillNumber">E-way Bill Number</Label>
						<Input id="ewayBillNumber" value={form.ewayBillNumber} onChange={handleChange("ewayBillNumber")} />
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
						Cancel
					</Button>
					<Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
						{mutation.isPending ? "Saving..." : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default EditTransportDetailsDialog;
