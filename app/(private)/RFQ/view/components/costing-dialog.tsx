"use client";
import { useEffect, useState } from "react";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Separator } from "@components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@components/ui/dialog";
import { Calculator, Plus, Trash2, Loader2 } from "lucide-react";

interface CostingDialogProps {
	lineItem: RfqLineItem;
	rfqId: string;
}

interface LabourEntryForm {
	labourProcessType: string;
	party: string;
	rate: number;
	rateType: "PER_PIECE" | "PER_KG";
}

interface CostingForm {
	diameter: number;
	length: number;
	density: number;
	materialRate: number;
	rawMaterialParty: string;
	labourEntries: LabourEntryForm[];
	profitMargin: number;
	packingCost: number;
	shippingCost: number;
	otherCosts: number;
}

const defaultForm: CostingForm = {
	diameter: 0,
	length: 0,
	density: 7.85,
	materialRate: 0,
	rawMaterialParty: "",
	labourEntries: [],
	profitMargin: 0,
	packingCost: 0,
	shippingCost: 0,
	otherCosts: 0,
};

const CostingDialog = ({ lineItem, rfqId }: CostingDialogProps) => {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState<CostingForm>(defaultForm);

	const { data: costing, isLoading } = useQuery<Costing | null>({
		queryKey: ["costing", lineItem._id],
		queryFn: async () => {
			try {
				const response = await axios.get(`/api/v1/costing/${lineItem._id}`);
				return response?.data?.data as Costing;
			} catch {
				return null;
			}
		},
		enabled: open,
	});

	const { data: parties } = useQuery<Party[]>({
		queryKey: ["parties-dropdown"],
		queryFn: async () => {
			const response = await axios.get("/api/v1/party/all?page=1&size=200");
			return (response?.data?.data?.data ?? []) as Party[];
		},
		enabled: open,
	});

	const { data: labourProcessTypes } = useQuery<LabourProcessType[]>({
		queryKey: ["labour-process-types-dropdown"],
		queryFn: async () => {
			const response = await axios.get("/api/v1/master/labour-process-types?page=1&size=200");
			return (response?.data?.data?.data ?? []) as LabourProcessType[];
		},
		enabled: open,
	});

	useEffect(() => {
		if (costing) {
			setForm({
				diameter: costing.diameter ?? 0,
				length: costing.length ?? 0,
				density: costing.density ?? 7.85,
				materialRate: costing.materialRate ?? 0,
				rawMaterialParty: typeof costing.rawMaterialParty === "object" ? costing.rawMaterialParty?._id ?? "" : costing.rawMaterialParty ?? "",
				labourEntries: costing.labourEntries.map(e => ({
					labourProcessType: typeof e.labourProcessType === "object" ? e.labourProcessType._id : e.labourProcessType,
					party: typeof e.party === "object" ? e.party?._id ?? "" : e.party ?? "",
					rate: e.rate,
					rateType: e.rateType,
				})),
				profitMargin: costing.profitMargin ?? 0,
				packingCost: costing.packingCost ?? 0,
				shippingCost: costing.shippingCost ?? 0,
				otherCosts: costing.otherCosts ?? 0,
			});
		} else if (!isLoading) {
			setForm({
				...defaultForm,
				diameter: parseFloat(lineItem.itemTechSpecs?.diameter ?? "0") || 0,
				length: parseFloat(lineItem.itemTechSpecs?.length ?? "0") || 0,
			});
		}
	}, [costing, isLoading, lineItem]);

	const { mutate: saveCosting, isPending } = useMutation({
		mutationFn: async () => {
			const payload = {
				diameter: form.diameter,
				length: form.length,
				density: form.density,
				materialRate: form.materialRate,
				rawMaterialParty: form.rawMaterialParty || undefined,
				labourEntries: form.labourEntries.map(e => ({
					labourProcessType: e.labourProcessType,
					party: e.party || undefined,
					rate: e.rate,
					rateType: e.rateType,
				})),
				profitMargin: form.profitMargin,
				packingCost: form.packingCost,
				shippingCost: form.shippingCost,
				otherCosts: form.otherCosts,
			};
			const response = await axios.post(`/api/v1/costing/${lineItem._id}`, payload);
			return response?.data?.data as Costing;
		},
		onSuccess: data => {
			toast.success("Costing saved successfully");
			queryClient.invalidateQueries({ queryKey: ["costing", lineItem._id] });
			queryClient.invalidateQueries({ queryKey: ["costings-rfq", rfqId] });
			queryClient.invalidateQueries({ queryKey: ["rfq", rfqId] });
			if (data) {
				setForm(prev => ({ ...prev }));
			}
		},
		onError: (error: unknown) => {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to save costing");
		},
	});

	const update = (key: keyof CostingForm, value: number | string) => setForm(prev => ({ ...prev, [key]: value }));

	const addLabourEntry = () => {
		setForm(prev => ({
			...prev,
			labourEntries: [...prev.labourEntries, { labourProcessType: "", party: "", rate: 0, rateType: "PER_PIECE" }],
		}));
	};

	const removeLabourEntry = (index: number) => {
		setForm(prev => ({
			...prev,
			labourEntries: prev.labourEntries.filter((_, i) => i !== index),
		}));
	};

	const updateLabourEntry = (index: number, key: keyof LabourEntryForm, value: string | number) => {
		setForm(prev => ({
			...prev,
			labourEntries: prev.labourEntries.map((e, i) => (i === index ? { ...e, [key]: value } : e)),
		}));
	};

	// Client-side preview calculations
	const weight = (Math.PI * Math.pow(form.diameter / 2, 2) * form.length * form.density) / 1_000_000;
	const rawMaterialCost = weight * form.materialRate;
	const totalLabourCost = form.labourEntries.reduce((sum, e) => {
		return sum + (e.rateType === "PER_KG" ? e.rate * weight : e.rate);
	}, 0);
	const costPrice = rawMaterialCost + totalLabourCost;
	const profitAmount = (costPrice * form.profitMargin) / 100;
	const sellingPrice = costPrice + profitAmount + form.packingCost + form.shippingCost + form.otherCosts;
	const totalCost = sellingPrice * lineItem.quantity;

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				<Button size="sm" variant={costing ? "outline" : "default"}>
					<Calculator className="mr-1 h-3 w-3" />
					{costing ? "Edit Costing" : "Add Costing"}
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						Costing — {lineItem.item?.itemName || "Item"} ({lineItem.item?.itemCode || "—"})
					</DialogTitle>
					<DialogDescription>Qty: {lineItem.quantity} | Drawing: {lineItem.drawingNumber || "—"}</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-6 w-6 animate-spin text-primary" />
					</div>
				) : (
					<div className="flex flex-col gap-5">
						{/* Raw Material Section */}
						<div>
							<h4 className="mb-3 text-sm font-semibold">Raw Material</h4>
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Diameter (mm)</Label>
									<Input min={0} onChange={e => update("diameter", parseFloat(e.target.value) || 0)} step="0.01" type="number" value={form.diameter || ""} />
								</div>
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Length (mm)</Label>
									<Input min={0} onChange={e => update("length", parseFloat(e.target.value) || 0)} step="0.01" type="number" value={form.length || ""} />
								</div>
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Density (kg/mm³)</Label>
									<Input min={0} onChange={e => update("density", parseFloat(e.target.value) || 0)} step="0.001" type="number" value={form.density || ""} />
								</div>
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Weight (kg)</Label>
									<Input disabled value={weight.toFixed(4)} />
								</div>
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Material Rate (₹/kg)</Label>
									<Input min={0} onChange={e => update("materialRate", parseFloat(e.target.value) || 0)} step="0.01" type="number" value={form.materialRate || ""} />
								</div>
							</div>
							<div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Raw Material Supplier</Label>
									<Select onValueChange={val => update("rawMaterialParty", val === "none" ? "" : val)} value={form.rawMaterialParty || "none"}>
										<SelectTrigger>
											<SelectValue placeholder="Select supplier" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">None</SelectItem>
											{parties?.map(p => (
												<SelectItem key={p._id} value={p._id}>
													{p.acName}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Raw Material Cost (₹)</Label>
									<Input disabled value={rawMaterialCost.toFixed(2)} />
								</div>
							</div>
						</div>

						<Separator />

						{/* Labour Entries Section */}
						<div>
							<div className="mb-3 flex items-center justify-between">
								<h4 className="text-sm font-semibold">Labour Entries</h4>
								<Button onClick={addLabourEntry} size="sm" variant="outline">
									<Plus className="mr-1 h-3 w-3" />
									Add Labour
								</Button>
							</div>
							{form.labourEntries.length === 0 ? (
								<p className="text-sm text-muted-foreground">No labour entries added yet.</p>
							) : (
								<div className="space-y-3">
									{form.labourEntries.map((entry, idx) => (
										<div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-5" key={idx}>
											<div className="flex flex-col gap-1.5">
												<Label className="text-xs">Process Type</Label>
												<Select onValueChange={val => updateLabourEntry(idx, "labourProcessType", val)} value={entry.labourProcessType}>
													<SelectTrigger>
														<SelectValue placeholder="Select process" />
													</SelectTrigger>
													<SelectContent>
														{labourProcessTypes?.map(lpt => (
															<SelectItem key={lpt._id} value={lpt._id}>
																{lpt.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="flex flex-col gap-1.5">
												<Label className="text-xs">Vendor</Label>
												<Select onValueChange={val => updateLabourEntry(idx, "party", val === "none" ? "" : val)} value={entry.party || "none"}>
													<SelectTrigger>
														<SelectValue placeholder="Select vendor" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="none">None</SelectItem>
														{parties?.map(p => (
															<SelectItem key={p._id} value={p._id}>
																{p.acName}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="flex flex-col gap-1.5">
												<Label className="text-xs">Rate (₹)</Label>
												<Input min={0} onChange={e => updateLabourEntry(idx, "rate", parseFloat(e.target.value) || 0)} step="0.01" type="number" value={entry.rate || ""} />
											</div>
											<div className="flex flex-col gap-1.5">
												<Label className="text-xs">Rate Type</Label>
												<Select onValueChange={val => updateLabourEntry(idx, "rateType", val)} value={entry.rateType}>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="PER_PIECE">Per Piece</SelectItem>
														<SelectItem value="PER_KG">Per Kg</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="flex items-end gap-2">
												<div className="flex flex-1 flex-col gap-1.5">
													<Label className="text-xs">Cost (₹)</Label>
													<Input disabled value={(entry.rateType === "PER_KG" ? entry.rate * weight : entry.rate).toFixed(2)} />
												</div>
												<Button className="mb-0.5 h-9 w-9 shrink-0" onClick={() => removeLabourEntry(idx)} size="icon" variant="destructive">
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									))}
								</div>
							)}
							<div className="mt-2 text-right text-sm font-medium">Total Labour Cost: ₹{totalLabourCost.toFixed(2)}</div>
						</div>

						<Separator />

						{/* Pricing Section */}
						<div>
							<h4 className="mb-3 text-sm font-semibold">Pricing</h4>
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Cost Price (₹)</Label>
									<Input disabled value={costPrice.toFixed(2)} />
								</div>
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Profit Margin (%)</Label>
									<Input min={0} onChange={e => update("profitMargin", parseFloat(e.target.value) || 0)} step="0.01" type="number" value={form.profitMargin || ""} />
								</div>
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Profit Amount (₹)</Label>
									<Input disabled value={profitAmount.toFixed(2)} />
								</div>
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Packing Cost (₹)</Label>
									<Input min={0} onChange={e => update("packingCost", parseFloat(e.target.value) || 0)} step="0.01" type="number" value={form.packingCost || ""} />
								</div>
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Shipping Cost (₹)</Label>
									<Input min={0} onChange={e => update("shippingCost", parseFloat(e.target.value) || 0)} step="0.01" type="number" value={form.shippingCost || ""} />
								</div>
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Other Costs (₹)</Label>
									<Input min={0} onChange={e => update("otherCosts", parseFloat(e.target.value) || 0)} step="0.01" type="number" value={form.otherCosts || ""} />
								</div>
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs font-semibold">Selling Price (₹/pc)</Label>
									<Input className="font-semibold" disabled value={sellingPrice.toFixed(2)} />
								</div>
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs font-semibold">Total Cost (₹)</Label>
									<Input className="font-semibold" disabled value={totalCost.toFixed(2)} />
								</div>
							</div>
						</div>
					</div>
				)}

				<DialogFooter>
					<Button disabled={isPending || isLoading} onClick={() => saveCosting()}>
						{isPending ? (
							<>
								<Loader2 className="mr-1 h-4 w-4 animate-spin" />
								Saving...
							</>
						) : (
							"Save Costing"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default CostingDialog;
