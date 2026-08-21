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
import { Truck } from "lucide-react";

type InvoiceTransportDetailsForm = {
	transporterName: string;
	transporterGstin: string;
	consignmentNumber: string;
};

type EditInvoiceTransportDetailsDialogProps = {
	id: string;
	invoiceNumber: string;
	defaultValues: InvoiceTransportDetailsForm;
};

/**
 * Invoice-level counterpart to EditTransportDetailsDialog (which edits a
 * single Sales line-item by _id) — updates transporter/consignment info
 * across every line item on the invoice in one go, since a single invoice
 * always ships as one consignment in this workflow. E-way bill number is
 * deliberately not exposed here: it comes in with the invoice import
 * itself, not backfilled by hand.
 */
const EditInvoiceTransportDetailsDialog = ({ id, invoiceNumber, defaultValues }: EditInvoiceTransportDetailsDialogProps) => {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState<InvoiceTransportDetailsForm>(defaultValues);

	const mutation = useMutation({
		mutationFn: async (payload: InvoiceTransportDetailsForm) => {
			const response = await axios.patch(`/api/v1/sales/invoices/${id}/transport-details`, payload);
			return response?.data?.data;
		},
		onSuccess: () => {
			toast.success("Transport details updated for this invoice");
			setOpen(false);
			router.refresh();
		},
		onError: (error: AxiosError<ErrorData>) => {
			toast.error(error.response?.data?.message ?? "Failed to update transport details");
		},
	});

	const handleChange = (field: keyof InvoiceTransportDetailsForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm(prev => ({ ...prev, [field]: e.target.value }));
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline">
					<Truck size={14} />
					Add Transporter Details
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Transporter Details for Invoice {invoiceNumber}</DialogTitle>
				</DialogHeader>
				<p className="text-muted-foreground text-sm">Applies to every line item on this invoice.</p>
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="invoiceTransporterName">Transporter Name</Label>
						<Input
							id="invoiceTransporterName"
							value={form.transporterName}
							onChange={handleChange("transporterName")}
							placeholder="e.g. VRL Logistics Ltd."
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="invoiceTransporterGstin">Transporter GSTIN</Label>
						<Input id="invoiceTransporterGstin" value={form.transporterGstin} onChange={handleChange("transporterGstin")} />
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="invoiceConsignmentNumber">Consignment Number</Label>
						<Input id="invoiceConsignmentNumber" value={form.consignmentNumber} onChange={handleChange("consignmentNumber")} />
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

export default EditInvoiceTransportDetailsDialog;
