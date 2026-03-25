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
import { Calculator, Plus, Trash2, Loader2, ChevronDown, ChevronUp, Truck, Copy, Search, Clock } from "lucide-react";
import { CostingSchema, type CostingFormValues } from "@schemas/rfq";

const RateHistoryPopover = ({ partyId, type }: { partyId: string; type: "material" | "labour" | "supply" }) => {
	const [open, setOpen] = useState(false);

	const { data: history = [], isLoading } = useQuery<Record<string, unknown>[]>({
		queryKey: ["rate-history", type, partyId],
		queryFn: async () => {
			const response = await axios.get(`/api/v1/rate-history/${type}/${partyId}`);
			return ((response?.data?.data ?? []) as Record<string, unknown>[]).slice(0, 5);
		},
		enabled: open && !!partyId,
	});

	if (!partyId) return null;

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				<Button className="h-8 w-8 shrink-0" size="icon" title="Rate history" type="button" variant="ghost">
					<Clock className="h-3.5 w-3.5" />
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="text-sm">Rate History (Last 5)</DialogTitle>
				</DialogHeader>
				{isLoading ? (
					<div className="flex items-center justify-center py-4">
						<Loader2 className="h-4 w-4 animate-spin" />
					</div>
				) : history.length === 0 ? (
					<p className="text-muted-foreground py-4 text-center text-sm">No rate history found.</p>
				) : (
					<div className="space-y-2">
						{history.map((h, i) => (
							<div key={i} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
								<div>
									<span className="font-medium">\u20B9{((h.materialRate as number) ?? (h.rate as number) ?? 0).toFixed(2)}</span>
									{h.rateType ? <span className="text-muted-foreground ml-1 text-xs">({String(h.rateType)})</span> : null}
									<span className="text-muted-foreground ml-2 text-xs">
										{String(h.itemCode ?? "")} | {String(h.prNumber ?? "")}
									</span>
								</div>
								<span className="text-muted-foreground text-xs">{new Date(h.date as string).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}</span>
							</div>
						))}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

interface CostingDialogProps {
	lineItem: RfqLineItem;
	rfqId: string;
}

const MATERIAL_PRESETS: { label: string; density: number }[] = [
	{ label: "Mild Steel / EN Series", density: 7.85 },
	{ label: "SS 304", density: 7.93 },
	{ label: "SS 316", density: 8.0 },
	{ label: "Cast Iron", density: 7.2 },
	{ label: "Aluminium", density: 2.7 },
	{ label: "Brass", density: 8.5 },
	{ label: "Copper", density: 8.96 },
	{ label: "Bronze", density: 8.8 },
	{ label: "Custom", density: 0 },
];

const SHAPE_OPTIONS: { value: CostingFormValues["parts"][number]["shapeType"]; label: string }[] = [
	{ value: "ROUND", label: "Round Bar" },
	{ value: "SQUARE", label: "Square Bar" },
	{ value: "FLAT", label: "Flat / Rectangle" },
	{ value: "HEX", label: "Hex Bar" },
	{ value: "PIPE", label: "Pipe / Tube" },
	{ value: "SHEET", label: "Sheet / Plate" },
];

const defaultManualPart = (name = "Part", qty = 1): CostingFormValues["parts"][number] => ({
	partName: name,
	quantity: qty,
	supplyType: "MANUAL",
	shapeType: "ROUND",
	diameter: 0,
	width: 0,
	thickness: 0,
	innerDiameter: 0,
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
	shapeType: "ROUND",
	diameter: 0,
	width: 0,
	thickness: 0,
	innerDiameter: 0,
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
	const [showCloneSearch, setShowCloneSearch] = useState(false);
	const [cloneSearchQuery, setCloneSearchQuery] = useState("");

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
			parts:
				bom.length > 0
					? bom.map(b => ({
							...defaultManualPart(b.partName, b.quantity),
							diameter: parseFloat(b.diameter ?? "0") || 0,
							length: parseFloat(b.length ?? "0") || 0,
							density: parseFloat(b.density ?? "7.85") || 7.85,
						}))
					: [defaultManualPart(lineItem.item?.itemName || "Part 1")],
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
					shapeType: p.shapeType ?? "ROUND",
					diameter: p.diameter ?? 0,
					width: p.width ?? 0,
					thickness: p.thickness ?? 0,
					innerDiameter: p.innerDiameter ?? 0,
					length: p.length ?? 0,
					density: p.density ?? 7.85,
					materialRate: p.materialRate ?? 0,
					rawMaterialParty: typeof p.rawMaterialParty === "object" ? (p.rawMaterialParty?._id ?? "") : (p.rawMaterialParty ?? ""),
					labourEntries: p.labourEntries.map(e => ({
						labourProcessType: typeof e.labourProcessType === "object" ? e.labourProcessType._id : e.labourProcessType,
						party: typeof e.party === "object" ? (e.party?._id ?? "") : (e.party ?? ""),
						rate: e.rate,
						rateType: e.rateType,
					})),
					completeSupplyRate: p.completeSupplyRate ?? 0,
					completeSupplyParty: typeof p.completeSupplyParty === "object" ? (p.completeSupplyParty?._id ?? "") : (p.completeSupplyParty ?? ""),
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
					shapeType: p.shapeType,
					diameter: p.diameter,
					width: p.width,
					thickness: p.thickness,
					innerDiameter: p.innerDiameter,
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

	const { data: cloneResults = [], isFetching: isSearchingClone } = useQuery<Record<string, unknown>[]>({
		queryKey: ["clone-search", cloneSearchQuery],
		queryFn: async () => {
			const response = await axios.get(`/api/v1/costing/search/clone?q=${encodeURIComponent(cloneSearchQuery)}`);
			return (response?.data?.data ?? []) as Record<string, unknown>[];
		},
		enabled: showCloneSearch && cloneSearchQuery.length >= 2,
	});

	const { mutate: cloneCosting, isPending: isCloning } = useMutation({
		mutationFn: async (sourceCostingId: string) => {
			const response = await axios.post(`/api/v1/costing/${lineItem._id}/clone`, { sourceCostingId });
			return response?.data?.data as Costing;
		},
		onSuccess: () => {
			toast.success("Costing cloned successfully");
			setShowCloneSearch(false);
			setCloneSearchQuery("");
			queryClient.invalidateQueries({ queryKey: ["costing", lineItem._id] });
			queryClient.invalidateQueries({ queryKey: ["costings-rfq", rfqId] });
		},
		onError: () => toast.error("Failed to clone costing"),
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

	const calcVolume = (p: CostingFormValues["parts"][number]): number => {
		switch (p.shapeType) {
			case "ROUND":
				return Math.PI * Math.pow(p.diameter / 2, 2) * p.length;
			case "SQUARE":
				return Math.pow(p.width, 2) * p.length;
			case "FLAT":
				return p.width * p.thickness * p.length;
			case "HEX":
				return (Math.sqrt(3) / 2) * Math.pow(p.diameter, 2) * p.length;
			case "PIPE":
				return Math.PI * (Math.pow(p.diameter / 2, 2) - Math.pow(p.innerDiameter / 2, 2)) * p.length;
			case "SHEET":
				return p.width * p.length * p.thickness;
			default:
				return Math.PI * Math.pow(p.diameter / 2, 2) * p.length;
		}
	};

	const calcPart = (p: CostingFormValues["parts"][number]) => {
		if (p.supplyType === "COMPLETE_SUPPLY") {
			const costPrice = roundTo5(p.completeSupplyRate * p.quantity);
			const profitAmount = (costPrice * p.profitMargin) / 100;
			const partTotal = roundTo5(costPrice + profitAmount);
			return { weight: 0, rawMaterialCost: 0, totalLabourCost: 0, costPrice, profitAmount, partTotal };
		}
		const weight = (calcVolume(p) * p.density) / 1_000_000;
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
					<div className="flex gap-2 pt-2">
						<Button onClick={() => setShowCloneSearch(!showCloneSearch)} size="sm" type="button" variant="outline">
							<Copy className="mr-1 h-3 w-3" />
							Clone from Previous
						</Button>
					</div>
					{showCloneSearch && (
						<div className="bg-muted/30 mt-2 rounded-lg border p-3">
							<div className="relative mb-2">
								<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
								<Input autoFocus className="pl-9" onChange={e => setCloneSearchQuery(e.target.value)} placeholder="Search by item name, code, or PR number..." value={cloneSearchQuery} />
							</div>
							{isSearchingClone && (
								<div className="text-muted-foreground flex items-center gap-2 py-2 text-sm">
									<Loader2 className="h-3 w-3 animate-spin" />
									Searching...
								</div>
							)}
							{cloneResults.length > 0 && (
								<div className="max-h-48 space-y-1 overflow-y-auto">
									{cloneResults.map(c => {
										const rfqItem = c.rfqItem as Record<string, unknown> | undefined;
										const rfq = c.rfq as Record<string, unknown> | undefined;
										const item = (rfqItem?.item as Record<string, unknown>) ?? {};
										return (
											<button
												key={String(c._id)}
												className="hover:bg-accent flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-left text-sm"
												disabled={isCloning}
												onClick={() => cloneCosting(String(c._id))}
												type="button"
											>
												<div>
													<span className="font-medium">{String(item.itemName ?? "Unknown")}</span>
													<span className="text-muted-foreground ml-2 text-xs">
														{String(item.itemCode ?? "")} | {String(rfq?.prNumber ?? "")} | ₹{((c.sellingPrice as number) ?? 0).toFixed(2)}
													</span>
												</div>
												<Badge variant="outline" className="text-[10px]">
													{((c.parts as unknown[]) ?? []).length} parts
												</Badge>
											</button>
										);
									})}
								</div>
							)}
							{cloneSearchQuery.length >= 2 && !isSearchingClone && cloneResults.length === 0 && <p className="text-muted-foreground py-2 text-sm">No matching costings found.</p>}
						</div>
					)}
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="text-primary h-6 w-6 animate-spin" />
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
										<button className="hover:bg-muted/50 flex w-full items-center justify-between px-4 py-3 text-left" onClick={() => setExpandedPart(isExpanded ? -1 : pIdx)} type="button">
											<div className="flex items-center gap-3">
												<Badge className="text-[10px]" variant={isManual ? "secondary" : "default"}>
													{isManual ? "Manual" : "Vendor"}
												</Badge>
												<span className="text-sm font-semibold">{part.partName || `Part ${pIdx + 1}`}</span>
												<span className="text-muted-foreground text-xs">
													Qty: {part.quantity} | C.P: ₹{calc.costPrice.toFixed(0)} | Total: ₹{calc.partTotal.toFixed(0)}
												</span>
											</div>
											<div className="flex items-center gap-2">
												{!isUnit && partFields.length > 1 && (
													<span
														className="hover:bg-accent inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md"
														onClick={e => {
															e.stopPropagation();
															handleRemovePart(pIdx);
														}}
														role="button"
														tabIndex={0}
													>
														<Trash2 className="text-destructive h-3.5 w-3.5" />
													</span>
												)}
												{isExpanded ? <ChevronUp className="text-muted-foreground h-4 w-4" /> : <ChevronDown className="text-muted-foreground h-4 w-4" />}
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
																	<Input min={1} onChange={e => f.onChange(parseInt(e.target.value) || 1)} type="number" value={f.value} />
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
														<h5 className="text-muted-foreground mb-2 text-xs font-semibold">Raw Material</h5>
														{/* Shape & Material Preset */}
														<div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
															<FormField
																control={form.control}
																name={`parts.${pIdx}.shapeType`}
																render={({ field: f }) => (
																	<FormItem>
																		<FormLabel className="text-xs">Shape Type</FormLabel>
																		<Select onValueChange={f.onChange} value={f.value}>
																			<FormControl>
																				<SelectTrigger>
																					<SelectValue />
																				</SelectTrigger>
																			</FormControl>
																			<SelectContent>
																				{SHAPE_OPTIONS.map(s => (
																					<SelectItem key={s.value} value={s.value}>
																						{s.label}
																					</SelectItem>
																				))}
																			</SelectContent>
																		</Select>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<div>
																<Label className="text-xs">Material Preset</Label>
																<Select
																	onValueChange={val => {
																		const preset = MATERIAL_PRESETS.find(m => m.label === val);
																		if (preset && preset.density > 0) form.setValue(`parts.${pIdx}.density`, preset.density);
																	}}
																	value=""
																>
																	<SelectTrigger className="mt-1">
																		<SelectValue placeholder="Select material" />
																	</SelectTrigger>
																	<SelectContent>
																		{MATERIAL_PRESETS.map(m => (
																			<SelectItem key={m.label} value={m.label}>
																				{m.label} {m.density > 0 ? `(${m.density})` : ""}
																			</SelectItem>
																		))}
																	</SelectContent>
																</Select>
															</div>
														</div>
														{/* Dimension Fields (conditional on shape) */}
														<div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
															{/* Diameter — ROUND, HEX, PIPE */}
															{(part.shapeType === "ROUND" || part.shapeType === "HEX" || part.shapeType === "PIPE") && (
																<FormField
																	control={form.control}
																	name={`parts.${pIdx}.diameter`}
																	render={({ field: f }) => (
																		<FormItem>
																			<FormLabel className="text-xs">{part.shapeType === "PIPE" ? "Outer Dia (mm)" : "Diameter (mm)"}</FormLabel>
																			<FormControl>
																				<Input min={0} onChange={e => f.onChange(parseFloat(e.target.value) || 0)} step="0.01" type="number" value={f.value || ""} />
																			</FormControl>
																			<FormMessage />
																		</FormItem>
																	)}
																/>
															)}
															{/* Inner Diameter — PIPE only */}
															{part.shapeType === "PIPE" && (
																<FormField
																	control={form.control}
																	name={`parts.${pIdx}.innerDiameter`}
																	render={({ field: f }) => (
																		<FormItem>
																			<FormLabel className="text-xs">Inner Dia (mm)</FormLabel>
																			<FormControl>
																				<Input min={0} onChange={e => f.onChange(parseFloat(e.target.value) || 0)} step="0.01" type="number" value={f.value || ""} />
																			</FormControl>
																			<FormMessage />
																		</FormItem>
																	)}
																/>
															)}
															{/* Width — SQUARE, FLAT, SHEET */}
															{(part.shapeType === "SQUARE" || part.shapeType === "FLAT" || part.shapeType === "SHEET") && (
																<FormField
																	control={form.control}
																	name={`parts.${pIdx}.width`}
																	render={({ field: f }) => (
																		<FormItem>
																			<FormLabel className="text-xs">Width (mm)</FormLabel>
																			<FormControl>
																				<Input min={0} onChange={e => f.onChange(parseFloat(e.target.value) || 0)} step="0.01" type="number" value={f.value || ""} />
																			</FormControl>
																			<FormMessage />
																		</FormItem>
																	)}
																/>
															)}
															{/* Thickness — FLAT, SHEET */}
															{(part.shapeType === "FLAT" || part.shapeType === "SHEET") && (
																<FormField
																	control={form.control}
																	name={`parts.${pIdx}.thickness`}
																	render={({ field: f }) => (
																		<FormItem>
																			<FormLabel className="text-xs">Thickness (mm)</FormLabel>
																			<FormControl>
																				<Input min={0} onChange={e => f.onChange(parseFloat(e.target.value) || 0)} step="0.01" type="number" value={f.value || ""} />
																			</FormControl>
																			<FormMessage />
																		</FormItem>
																	)}
																/>
															)}
															{/* Length — all shapes */}
															<FormField
																control={form.control}
																name={`parts.${pIdx}.length`}
																render={({ field: f }) => (
																	<FormItem>
																		<FormLabel className="text-xs">Length (mm)</FormLabel>
																		<FormControl>
																			<Input min={0} onChange={e => f.onChange(parseFloat(e.target.value) || 0)} step="0.01" type="number" value={f.value || ""} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															{/* Density */}
															<FormField
																control={form.control}
																name={`parts.${pIdx}.density`}
																render={({ field: f }) => (
																	<FormItem>
																		<FormLabel className="text-xs">Density (g/cm³)</FormLabel>
																		<FormControl>
																			<Input min={0} onChange={e => f.onChange(parseFloat(e.target.value) || 0)} step="0.001" type="number" value={f.value || ""} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															{/* Weight (computed) */}
															<div className="flex flex-col gap-1.5">
																<Label className="text-xs">Weight (kg)</Label>
																<Input disabled value={calc.weight.toFixed(4)} />
															</div>
															{/* Material Rate */}
															<FormField
																control={form.control}
																name={`parts.${pIdx}.materialRate`}
																render={({ field: f }) => (
																	<FormItem>
																		<FormLabel className="text-xs">Rate (₹/kg)</FormLabel>
																		<FormControl>
																			<Input min={0} onChange={e => f.onChange(parseFloat(e.target.value) || 0)} step="0.01" type="number" value={f.value || ""} />
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
															<RateHistoryPopover partyId={part.rawMaterialParty} type="material" />
															<div className="flex flex-col gap-1.5">
																<Label className="text-xs">Raw Material Cost (₹)</Label>
																<Input disabled value={calc.rawMaterialCost.toFixed(2)} />
															</div>
														</div>

														<Separator className="my-3" />

														{/* Labour */}
														<div className="mb-3 flex items-center justify-between">
															<h5 className="text-muted-foreground text-xs font-semibold">Labour Entries</h5>
															<Button onClick={() => addLabourEntry(pIdx)} size="sm" type="button" variant="outline">
																<Plus className="mr-1 h-3 w-3" />
																Add Labour
															</Button>
														</div>
														{part.labourEntries.length === 0 ? (
															<p className="text-muted-foreground mb-3 text-sm">No labour entries.</p>
														) : (
															<div className="mb-3 space-y-3">
																{part.labourEntries.map((entry, lIdx) => (
																	<div className="bg-muted/30 grid grid-cols-2 gap-3 rounded-lg border p-3 sm:grid-cols-5" key={lIdx}>
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
																		<RateHistoryPopover partyId={entry.party} type="labour" />
																		<FormField
																			control={form.control}
																			name={`parts.${pIdx}.labourEntries.${lIdx}.rate`}
																			render={({ field: f }) => (
																				<FormItem>
																					<FormLabel className="text-xs">Rate (₹)</FormLabel>
																					<FormControl>
																						<Input min={0} onChange={e => f.onChange(parseFloat(e.target.value) || 0)} step="0.01" type="number" value={f.value || ""} />
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
														<div className="text-muted-foreground text-right text-xs">Labour: ₹{calc.totalLabourCost.toFixed(2)}</div>
													</>
												) : (
													<>
														{/* Complete Supply */}
														<h5 className="text-muted-foreground mb-2 text-xs font-semibold">Vendor Supply Details</h5>
														<div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
															<FormField
																control={form.control}
																name={`parts.${pIdx}.completeSupplyRate`}
																render={({ field: f }) => (
																	<FormItem>
																		<FormLabel className="text-xs">Rate (₹/pc)</FormLabel>
																		<FormControl>
																			<Input min={0} onChange={e => f.onChange(parseFloat(e.target.value) || 0)} step="0.01" type="number" value={f.value || ""} />
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
															<RateHistoryPopover partyId={part.completeSupplyParty} type="supply" />
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
												<h5 className="text-muted-foreground mb-2 text-xs font-semibold">Part Pricing</h5>
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
																	<Input min={0} onChange={e => f.onChange(parseFloat(e.target.value) || 0)} step="0.01" type="number" value={f.value || ""} />
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
