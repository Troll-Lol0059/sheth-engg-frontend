"use client";
import { useEffect, useState } from "react";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Separator } from "@components/ui/separator";
import { Badge } from "@components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@components/ui/dialog";
import { DatePicker } from "@components/ui/date-picker";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@components/ui/form";
import { Calculator, Plus, Trash2, Loader2, ChevronDown, ChevronUp, Truck } from "lucide-react";
import { CostingSchema, type CostingFormValues } from "@schemas/rfq";

interface CostingDialogProps {
	lineItem: RfqLineItem;
	rfqId: string;
}

const defaultManualPart = (name = "Part", qty = 1): CostingFormValues["parts"][number] => ({
	partName: name,
	quantity: qty,
	supplyType: "MANUAL",
	diameter: 0,
	length: 0,
	density: 7.85,
	materialRate: 0,
	rawMaterialParty: "",
	labourEntries: [],
	completeSupplyRate: 0,
	completeSupplyParty: "",
	completeSupplyDate: "",
	profitMargin: 0,
});

const defaultSupplyPart = (name = "Part", qty = 1): CostingFormValues["parts"][number] => ({
	partName: name,
	quantity: qty,
	supplyType: "COMPLETE_SUPPLY",
	diameter: 0,
	length: 0,
	density: 7.85,
	materialRate: 0,
	rawMaterialParty: "",
	labourEntries: [],
	completeSupplyRate: 0,
	completeSupplyParty: "",
	completeSupplyDate: "",
	profitMargin: 0,
});

const CostingDialog = ({ lineItem, rfqId }: CostingDialogProps) => {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [expandedPart, setExpandedPart] = useState<number>(0);

	const isUnit = lineItem.item?.itemType === "UNIT";
	const bom = lineItem.item?.bom ?? [];

	const buildDefaultForm = (): CostingFormValues => {
		if (isUnit) {
			return {
				parts: [
					{
						...defaultManualPart(lineItem.item?.itemName || "Main"),
						diameter: parseFloat(lineItem.itemTechSpecs?.diameter ?? "0") || 0,
						length: parseFloat(lineItem.itemTechSpecs?.length ?? "0") || 0,
					},
				],
				packingCost: 0,
				shippingCost: 0,
				otherCosts: 0,
			};
		}
		return {
			parts: bom.length > 0 ? bom.map(b => ({ ...defaultManualPart(b.partName, b.quantity) })) : [defaultManualPart(lineItem.item?.itemName || "Part 1")],
			packingCost: 0,
			shippingCost: 0,
			otherCosts: 0,
		};
	};

	const form = useForm<CostingFormValues>({
		resolver: zodResolver(CostingSchema),
		defaultValues: buildDefaultForm(),
	});

	const { fields: partFields, append: appendPart, remove: removePart } = useFieldArray({ control: form.control, name: "parts" });

	const watchedParts = form.watch("parts");
	const watchedPackingCost = form.watch("packingCost");
	const watchedShippingCost = form.watch("shippingCost");
	const watchedOtherCosts = form.watch("otherCosts");

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

	const { data: rawMaterialParties } = useQuery<Party[]>({
		queryKey: ["parties-dropdown", "RAW_MATERIAL"],
		queryFn: async () => {
			const response = await axios.get("/api/v1/party/all?page=1&size=200&partyType=RAW_MATERIAL");
			return (response?.data?.data?.data ?? []) as Party[];
		},
		enabled: open,
	});

	const { data: completeSupplyParties } = useQuery<Party[]>({
		queryKey: ["parties-dropdown", "COMPLETE_SUPPLY"],
		queryFn: async () => {
			const response = await axios.get("/api/v1/party/all?page=1&size=200&partyType=COMPLETE_SUPPLY");
			return (response?.data?.data?.data ?? []) as Party[];
		},
		enabled: open,
	});

	const { data: labourParties } = useQuery<Party[]>({
		queryKey: ["parties-dropdown", "LABOUR"],
		queryFn: async () => {
			const response = await axios.get("/api/v1/party/all?page=1&size=200&partyType=LABOUR");
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
		if (costing && costing.parts?.length > 0) {
			form.reset({
				parts: costing.parts.map(p => ({
					partName: p.partName,
					quantity: p.quantity,
					supplyType: p.supplyType ?? "MANUAL",
					diameter: p.diameter ?? 0,
					length: p.length ?? 0,
					density: p.density ?? 7.85,
					materialRate: p.materialRate ?? 0,
					rawMaterialParty: typeof p.rawMaterialParty === "object" ? p.rawMaterialParty?._id ?? "" : p.rawMaterialParty ?? "",
					labourEntries: p.labourEntries.map(e => ({
						labourProcessType: typeof e.labourProcessType === "object" ? e.labourProcessType._id : e.labourProcessType,
						party: typeof e.party === "object" ? e.party?._id ?? "" : e.party ?? "",
						rate: e.rate,
						rateType: e.rateType,
					})),
					completeSupplyRate: p.completeSupplyRate ?? 0,
					completeSupplyParty: typeof p.completeSupplyParty === "object" ? p.completeSupplyParty?._id ?? "" : p.completeSupplyParty ?? "",
					completeSupplyDate: p.completeSupplyDate ? p.completeSupplyDate.split("T")[0] : "",
					profitMargin: p.profitMargin ?? 0,
				})),
				packingCost: costing.packingCost ?? 0,
				shippingCost: costing.shippingCost ?? 0,
				otherCosts: costing.otherCosts ?? 0,
			});
		} else if (!isLoading && !costing) {
			form.reset(buildDefaultForm());
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [costing, isLoading]);

	const { mutate: saveCosting, isPending } = useMutation({
		mutationFn: async (formData: CostingFormValues) => {
			const payload = {
				parts: formData.parts.map(p => ({
					partName: p.partName,
					quantity: p.quantity,
					supplyType: p.supplyType,
					diameter: p.diameter,
					length: p.length,
					density: p.density,
					materialRate: p.materialRate,
					rawMaterialParty: p.rawMaterialParty || undefined,
					labourEntries: p.labourEntries.map(e => ({
						labourProcessType: e.labourProcessType,
						party: e.party || undefined,
						rate: e.rate,
						rateType: e.rateType,
					})),
					completeSupplyRate: p.completeSupplyRate,
					completeSupplyParty: p.completeSupplyParty || undefined,
					completeSupplyDate: p.completeSupplyDate || undefined,
					profitMargin: p.profitMargin,
				})),
				packingCost: formData.packingCost,
				shippingCost: formData.shippingCost,
				otherCosts: formData.otherCosts,
			};
			const response = await axios.post(`/api/v1/costing/${lineItem._id}`, payload);
			return response?.data?.data as Costing;
		},
		onSuccess: () => {
			toast.success("Costing saved successfully");
			queryClient.invalidateQueries({ queryKey: ["costing", lineItem._id] });
			queryClient.invalidateQueries({ queryKey: ["costings-rfq", rfqId] });
			queryClient.invalidateQueries({ queryKey: ["rfq", rfqId] });
		},
		onError: (error: unknown) => {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to save costing");
		},
	});

	const onSubmit = (data: CostingFormValues) => {
		saveCosting(data);
	};

	// Part helpers
	const addPart = (type: "MANUAL" | "COMPLETE_SUPPLY" = "MANUAL") => {
		const currentParts = form.getValues("parts");
		const newPart = type === "COMPLETE_SUPPLY" ? defaultSupplyPart(`Part ${currentParts.length + 1}`) : defaultManualPart(`Part ${currentParts.length + 1}`);
		appendPart(newPart);
		setExpandedPart(currentParts.length);
	};

	const handleRemovePart = (idx: number) => {
		const currentParts = form.getValues("parts");
		removePart(idx);
		if (expandedPart >= currentParts.length - 1) setExpandedPart(Math.max(0, currentParts.length - 2));
	};

	const addLabourEntry = (partIdx: number) => {
		const entries = form.getValues(`parts.${partIdx}.labourEntries`);
		form.setValue(`parts.${partIdx}.labourEntries`, [...entries, { labourProcessType: "", party: "", rate: 0, rateType: "PER_PIECE" as const }]);
	};

	const removeLabourEntry = (partIdx: number, labourIdx: number) => {
		const entries = form.getValues(`parts.${partIdx}.labourEntries`);
		form.setValue(
			`parts.${partIdx}.labourEntries`,
			entries.filter((_, j) => j !== labourIdx)
		);
	};

	// Calculations
	const roundTo5 = (n: number): number => Math.round(n / 5) * 5;

	const calcPart = (p: CostingFormValues["parts"][number]) => {
		if (p.supplyType === "COMPLETE_SUPPLY") {
			const costPrice = roundTo5(p.completeSupplyRate * p.quantity);
			const profitAmount = (costPrice * p.profitMargin) / 100;
			const partTotal = roundTo5(costPrice + profitAmount);
			return { weight: 0, rawMaterialCost: 0, totalLabourCost: 0, costPrice, profitAmount, partTotal };
		}
		const weight = (Math.PI * Math.pow(p.diameter / 2, 2) * p.length * p.density) / 1_000_000;
		const rawMaterialCost = roundTo5(weight * p.materialRate * p.quantity);
		const totalLabourCost = roundTo5(p.labourEntries.reduce((sum, e) => sum + (e.rateType === "PER_KG" ? e.rate * weight : e.rate), 0) * p.quantity);
		const costPrice = roundTo5(rawMaterialCost + totalLabourCost);
		const profitAmount = (costPrice * p.profitMargin) / 100;
		const partTotal = roundTo5(costPrice + profitAmount);
		return { weight, rawMaterialCost, totalLabourCost, costPrice, profitAmount, partTotal };
	};

	const partCalcs = watchedParts.map(calcPart);
	const totalPartsCost = partCalcs.reduce((s, c) => s + c.partTotal, 0);
	const sellingPrice = roundTo5(totalPartsCost + watchedPackingCost + watchedShippingCost + watchedOtherCosts);
	const totalCost = roundTo5(sellingPrice * lineItem.quantity);

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
					<DialogDescription>
						Qty: {lineItem.quantity} | Type: {lineItem.item?.itemType || "—"} | Drawing: {lineItem.drawingNumber || "—"}
					</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-6 w-6 animate-spin text-primary" />
					</div>
				) : (
					<Form {...form}>
						<form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
							{/* Parts Header */}
							<div className="flex items-center justify-between">
								<h4 className="text-sm font-semibold">Parts ({partFields.length})</h4>
								{!isUnit && (
									<div className="flex gap-2">
										<Button onClick={() => addPart("MANUAL")} size="sm" type="button" variant="outline">
											<Plus className="mr-1 h-3 w-3" />
											Manual Part
										</Button>
										<Button onClick={() => addPart("COMPLETE_SUPPLY")} size="sm" type="button" variant="outline">
											<Truck className="mr-1 h-3 w-3" />
											Vendor Supply
										</Button>
									</div>
								)}
							</div>

							{/* Parts List */}
							{partFields.map((field, pIdx) => {
								const part = watchedParts[pIdx];
								if (!part) return null;
								const calc = partCalcs[pIdx];
								const isExpanded = expandedPart === pIdx;
								const isManual = part.supplyType === "MANUAL";

								return (
									<div className="rounded-lg border" key={field.id}>
										{/* Part Header */}
										<button
											className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50"
											onClick={() => setExpandedPart(isExpanded ? -1 : pIdx)}
											type="button"
										>
											<div className="flex items-center gap-3">
												<Badge className="text-[10px]" variant={isManual ? "secondary" : "default"}>
													{isManual ? "Manual" : "Vendor"}
												</Badge>
												<span className="text-sm font-semibold">{part.partName || `Part ${pIdx + 1}`}</span>
												<span className="text-xs text-muted-foreground">
													Qty: {part.quantity} | C.P: ₹{calc.costPrice.toFixed(0)} | Total: ₹{calc.partTotal.toFixed(0)}
												</span>
											</div>
											<div className="flex items-center gap-2">
												{!isUnit && partFields.length > 1 && (
													<span
														className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md hover:bg-accent"
														onClick={e => {
															e.stopPropagation();
															handleRemovePart(pIdx);
														}}
														role="button"
														tabIndex={0}
													>
														<Trash2 className="h-3.5 w-3.5 text-destructive" />
													</span>
												)}
												{isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
											</div>
										</button>

										{/* Part Content */}
										{isExpanded && (
											<div className="border-t px-4 py-4">
												{/* Part Name, Qty & Supply Toggle */}
												<div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
													<FormField
														control={form.control}
														name={`parts.${pIdx}.partName`}
														render={({ field: f }) => (
															<FormItem>
																<FormLabel className="text-xs">Part Name</FormLabel>
																<FormControl>
																	<Input {...f} />
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
													<FormField
														control={form.control}
														name={`parts.${pIdx}.quantity`}
														render={({ field: f }) => (
															<FormItem>
																<FormLabel className="text-xs">Quantity</FormLabel>
																<FormControl>
																	<Input
																		min={1}
																		onChange={e => f.onChange(parseInt(e.target.value) || 1)}
																		type="number"
																		value={f.value}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
													<FormField
														control={form.control}
														name={`parts.${pIdx}.supplyType`}
														render={({ field: f }) => (
															<FormItem>
																<FormLabel className="text-xs">Costing Type</FormLabel>
																<Select onValueChange={f.onChange} value={f.value}>
																	<FormControl>
																		<SelectTrigger>
																			<SelectValue />
																		</SelectTrigger>
																	</FormControl>
																	<SelectContent>
																		<SelectItem value="MANUAL">Manual Costing</SelectItem>
																		<SelectItem value="COMPLETE_SUPPLY">Complete Supply</SelectItem>
																	</SelectContent>
																</Select>
																<FormMessage />
															</FormItem>
														)}
													/>
												</div>

												{isManual ? (
													<>
														{/* Raw Material */}
														<h5 className="mb-2 text-xs font-semibold text-muted-foreground">Raw Material</h5>
														<div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
															<FormField
																control={form.control}
																name={`parts.${pIdx}.diameter`}
																render={({ field: f }) => (
																	<FormItem>
																		<FormLabel className="text-xs">Diameter (mm)</FormLabel>
																		<FormControl>
																			<Input
																				min={0}
																				onChange={e => f.onChange(parseFloat(e.target.value) || 0)}
																				step="0.01"
																				type="number"
																				value={f.value || ""}
																			/>
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name={`parts.${pIdx}.length`}
																render={({ field: f }) => (
																	<FormItem>
																		<FormLabel className="text-xs">Length (mm)</FormLabel>
																		<FormControl>
																			<Input
																				min={0}
																				onChange={e => f.onChange(parseFloat(e.target.value) || 0)}
																				step="0.01"
																				type="number"
																				value={f.value || ""}
																			/>
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name={`parts.${pIdx}.density`}
																render={({ field: f }) => (
																	<FormItem>
																		<FormLabel className="text-xs">Density (kg/mm³)</FormLabel>
																		<FormControl>
																			<Input
																				min={0}
																				onChange={e => f.onChange(parseFloat(e.target.value) || 0)}
																				step="0.001"
																				type="number"
																				value={f.value || ""}
																			/>
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<div className="flex flex-col gap-1.5">
																<Label className="text-xs">Weight (kg)</Label>
																<Input disabled value={calc.weight.toFixed(4)} />
															</div>
															<FormField
																control={form.control}
																name={`parts.${pIdx}.materialRate`}
																render={({ field: f }) => (
																	<FormItem>
																		<FormLabel className="text-xs">Rate (₹/kg)</FormLabel>
																		<FormControl>
																			<Input
																				min={0}
																				onChange={e => f.onChange(parseFloat(e.target.value) || 0)}
																				step="0.01"
																				type="number"
																				value={f.value || ""}
																			/>
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
														</div>
														<div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
															<FormField
																control={form.control}
																name={`parts.${pIdx}.rawMaterialParty`}
																render={({ field: f }) => (
																	<FormItem>
																		<FormLabel className="text-xs">Supplier</FormLabel>
																		<Select onValueChange={val => f.onChange(val === "none" ? "" : val)} value={f.value || "none"}>
																			<FormControl>
																				<SelectTrigger>
																					<SelectValue placeholder="Select supplier" />
																				</SelectTrigger>
																			</FormControl>
																			<SelectContent>
																				<SelectItem value="none">None</SelectItem>
																				{rawMaterialParties?.map(p => (
																					<SelectItem key={p._id} value={p._id}>
																						{p.acName}
																					</SelectItem>
																				))}
																			</SelectContent>
																		</Select>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<div className="flex flex-col gap-1.5">
																<Label className="text-xs">Raw Material Cost (₹)</Label>
																<Input disabled value={calc.rawMaterialCost.toFixed(2)} />
															</div>
														</div>

														<Separator className="my-3" />

														{/* Labour */}
														<div className="mb-3 flex items-center justify-between">
															<h5 className="text-xs font-semibold text-muted-foreground">Labour Entries</h5>
															<Button onClick={() => addLabourEntry(pIdx)} size="sm" type="button" variant="outline">
																<Plus className="mr-1 h-3 w-3" />
																Add Labour
															</Button>
														</div>
														{part.labourEntries.length === 0 ? (
															<p className="mb-3 text-sm text-muted-foreground">No labour entries.</p>
														) : (
															<div className="mb-3 space-y-3">
																{part.labourEntries.map((entry, lIdx) => (
																	<div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-5" key={lIdx}>
																		<FormField
																			control={form.control}
																			name={`parts.${pIdx}.labourEntries.${lIdx}.labourProcessType`}
																			render={({ field: f }) => (
																				<FormItem>
																					<FormLabel className="text-xs">Process</FormLabel>
																					<Select onValueChange={f.onChange} value={f.value}>
																						<FormControl>
																							<SelectTrigger>
																								<SelectValue placeholder="Select" />
																							</SelectTrigger>
																						</FormControl>
																						<SelectContent>
																							{labourProcessTypes?.map(lpt => (
																								<SelectItem key={lpt._id} value={lpt._id}>
																									{lpt.name}
																								</SelectItem>
																							))}
																						</SelectContent>
																					</Select>
																					<FormMessage />
																				</FormItem>
																			)}
																		/>
																		<FormField
																			control={form.control}
																			name={`parts.${pIdx}.labourEntries.${lIdx}.party`}
																			render={({ field: f }) => (
																				<FormItem>
																					<FormLabel className="text-xs">Vendor</FormLabel>
																					<Select onValueChange={val => f.onChange(val === "none" ? "" : val)} value={f.value || "none"}>
																						<FormControl>
																							<SelectTrigger>
																								<SelectValue placeholder="Select" />
																							</SelectTrigger>
																						</FormControl>
																						<SelectContent>
																							<SelectItem value="none">None</SelectItem>
																							{labourParties?.map(p => (
																								<SelectItem key={p._id} value={p._id}>
																									{p.acName}
																								</SelectItem>
																							))}
																						</SelectContent>
																					</Select>
																					<FormMessage />
																				</FormItem>
																			)}
																		/>
																		<FormField
																			control={form.control}
																			name={`parts.${pIdx}.labourEntries.${lIdx}.rate`}
																			render={({ field: f }) => (
																				<FormItem>
																					<FormLabel className="text-xs">Rate (₹)</FormLabel>
																					<FormControl>
																						<Input
																							min={0}
																							onChange={e => f.onChange(parseFloat(e.target.value) || 0)}
																							step="0.01"
																							type="number"
																							value={f.value || ""}
																						/>
																					</FormControl>
																					<FormMessage />
																				</FormItem>
																			)}
																		/>
																		<FormField
																			control={form.control}
																			name={`parts.${pIdx}.labourEntries.${lIdx}.rateType`}
																			render={({ field: f }) => (
																				<FormItem>
																					<FormLabel className="text-xs">Rate Type</FormLabel>
																					<Select onValueChange={f.onChange} value={f.value}>
																						<FormControl>
																							<SelectTrigger>
																								<SelectValue />
																							</SelectTrigger>
																						</FormControl>
																						<SelectContent>
																							<SelectItem value="PER_PIECE">Per Piece</SelectItem>
																							<SelectItem value="PER_KG">Per Kg</SelectItem>
																						</SelectContent>
																					</Select>
																					<FormMessage />
																				</FormItem>
																			)}
																		/>
																		<div className="flex items-end gap-2">
																			<div className="flex flex-1 flex-col gap-1.5">
																				<Label className="text-xs">Cost (₹)</Label>
																				<Input disabled value={(entry.rateType === "PER_KG" ? entry.rate * calc.weight : entry.rate).toFixed(2)} />
																			</div>
																			<Button className="mb-0.5 h-9 w-9 shrink-0" onClick={() => removeLabourEntry(pIdx, lIdx)} size="icon" type="button" variant="destructive">
																				<Trash2 className="h-4 w-4" />
																			</Button>
																		</div>
																	</div>
																))}
															</div>
														)}
														<div className="text-right text-xs text-muted-foreground">Labour: ₹{calc.totalLabourCost.toFixed(2)}</div>
													</>
												) : (
													<>
														{/* Complete Supply */}
														<h5 className="mb-2 text-xs font-semibold text-muted-foreground">Vendor Supply Details</h5>
														<div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
															<FormField
																control={form.control}
																name={`parts.${pIdx}.completeSupplyRate`}
																render={({ field: f }) => (
																	<FormItem>
																		<FormLabel className="text-xs">Rate (₹/pc)</FormLabel>
																		<FormControl>
																			<Input
																				min={0}
																				onChange={e => f.onChange(parseFloat(e.target.value) || 0)}
																				step="0.01"
																				type="number"
																				value={f.value || ""}
																			/>
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name={`parts.${pIdx}.completeSupplyParty`}
																render={({ field: f }) => (
																	<FormItem>
																		<FormLabel className="text-xs">Vendor / Party</FormLabel>
																		<Select onValueChange={val => f.onChange(val === "none" ? "" : val)} value={f.value || "none"}>
																			<FormControl>
																				<SelectTrigger>
																					<SelectValue placeholder="Select vendor" />
																				</SelectTrigger>
																			</FormControl>
																			<SelectContent>
																				<SelectItem value="none">None</SelectItem>
																				{completeSupplyParties?.map(p => (
																					<SelectItem key={p._id} value={p._id}>
																						{p.acName}
																					</SelectItem>
																				))}
																			</SelectContent>
																		</Select>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name={`parts.${pIdx}.completeSupplyDate`}
																render={({ field: f }) => (
																	<FormItem>
																		<FormLabel className="text-xs">Date</FormLabel>
																		<FormControl>
																			<DatePicker
																				disabledRange={() => false}
																				onChange={(date: Date | undefined) => f.onChange(date ? date.toISOString() : "")}
																				placeholder="Select date"
																				value={f.value ? new Date(f.value) : undefined}
																			/>
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
														</div>
													</>
												)}

												<Separator className="my-3" />

												{/* Part Pricing */}
												<h5 className="mb-2 text-xs font-semibold text-muted-foreground">Part Pricing</h5>
												<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
													<div className="flex flex-col gap-1.5">
														<Label className="text-xs">Cost Price (₹)</Label>
														<Input disabled value={calc.costPrice.toFixed(2)} />
													</div>
													<FormField
														control={form.control}
														name={`parts.${pIdx}.profitMargin`}
														render={({ field: f }) => (
															<FormItem>
																<FormLabel className="text-xs">Profit Margin (%)</FormLabel>
																<FormControl>
																	<Input
																		min={0}
																		onChange={e => f.onChange(parseFloat(e.target.value) || 0)}
																		step="0.01"
																		type="number"
																		value={f.value || ""}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
													<div className="flex flex-col gap-1.5">
														<Label className="text-xs">Profit (₹)</Label>
														<Input disabled value={calc.profitAmount.toFixed(2)} />
													</div>
													<div className="flex flex-col gap-1.5">
														<Label className="text-xs font-semibold">Part Total (₹)</Label>
														<Input className="font-semibold" disabled value={calc.partTotal.toFixed(2)} />
													</div>
												</div>
											</div>
										)}
									</div>
								);
							})}

							<Separator />

							{/* Final Pricing */}
							<div>
								<h4 className="mb-3 text-sm font-semibold">Final Pricing</h4>
								<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
									<div className="flex flex-col gap-1.5">
										<Label className="text-xs">Parts Total (₹)</Label>
										<Input disabled value={totalPartsCost.toFixed(2)} />
									</div>
									<FormField
										control={form.control}
										name="packingCost"
										render={({ field: f }) => (
											<FormItem>
												<FormLabel className="text-xs">Packing (₹)</FormLabel>
												<FormControl>
													<Input min={0} onChange={e => f.onChange(parseFloat(e.target.value) || 0)} step="0.01" type="number" value={f.value || ""} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="shippingCost"
										render={({ field: f }) => (
											<FormItem>
												<FormLabel className="text-xs">Shipping (₹)</FormLabel>
												<FormControl>
													<Input min={0} onChange={e => f.onChange(parseFloat(e.target.value) || 0)} step="0.01" type="number" value={f.value || ""} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="otherCosts"
										render={({ field: f }) => (
											<FormItem>
												<FormLabel className="text-xs">Other (₹)</FormLabel>
												<FormControl>
													<Input min={0} onChange={e => f.onChange(parseFloat(e.target.value) || 0)} step="0.01" type="number" value={f.value || ""} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
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

							<DialogFooter>
								<Button disabled={isPending || isLoading} type="submit">
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
						</form>
					</Form>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default CostingDialog;
