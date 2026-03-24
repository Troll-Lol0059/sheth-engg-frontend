"use client";
import { useRef, useState } from "react";
import axios from "@config/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@components/ui/form";
import { Pencil, Save, X, Package, ChevronDown, ChevronUp, Upload, FileText, ExternalLink, Loader2, Plus, Trash2, Calculator } from "lucide-react";
import CostingDialog from "./costing-dialog";
import { ItemMasterSchema, LineItemSchema, BomSchema } from "@/schemas/rfq";
import type { ItemMasterFormValues, LineItemFormValues, BomFormValues } from "@/schemas/rfq";

interface RfqItemsSectionProps {
	items: RfqLineItem[];
	rfqId: string;
}

const updateRfqItemApi = async (rfqItemId: string, data: Record<string, unknown>) => {
	const response = await axios.put(`/api/v1/rfqItem/${rfqItemId}`, data);
	return response?.data;
};

const uploadDrawingApi = async (rfqItemId: string, file: File) => {
	const formData = new FormData();
	formData.append("drawing", file);
	const response = await axios.put(`/api/v1/rfqItem/${rfqItemId}/drawing`, formData, {
		headers: { "Content-Type": "multipart/form-data" },
	});
	return response?.data;
};

const RfqItemsSection = ({ items, rfqId }: RfqItemsSectionProps) => {
	const [expandedItem, setExpandedItem] = useState<string | null>(null);

	if (!items || items.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Line Items</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">No line items found for this RFQ.</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<Package className="h-5 w-5" />
					Line Items ({items.length})
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{items.map((lineItem, idx) => (
					<ItemCard
						expanded={expandedItem === lineItem._id}
						idx={idx}
						key={lineItem._id}
						lineItem={lineItem}
						onToggle={() => setExpandedItem(expandedItem === lineItem._id ? null : lineItem._id)}
						rfqId={rfqId}
					/>
				))}
			</CardContent>
		</Card>
	);
};

interface ItemCardProps {
	lineItem: RfqLineItem;
	idx: number;
	expanded: boolean;
	onToggle: () => void;
	rfqId: string;
}

const ItemCard = ({ lineItem, idx, expanded, onToggle, rfqId }: ItemCardProps) => {
	const queryClient = useQueryClient();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isEditing, setIsEditing] = useState(false);

	const { data: hardnessTypes = [] } = useQuery<HardnessType[]>({
		queryKey: ["hardness-types-all-select"],
		queryFn: async () => {
			const response = await axios.get("/api/v1/master/hardness-type/all?page=1&size=100&sortBy=name&sortOrder=asc");
			return response?.data?.data?.data ?? [];
		},
		enabled: isEditing,
	});

	const { data: hardnessMeasurements = [] } = useQuery<HardnessMeasurement[]>({
		queryKey: ["hardness-measurements-all-select"],
		queryFn: async () => {
			const response = await axios.get("/api/v1/master/hardness-measurement/all?page=1&size=100&sortBy=name&sortOrder=asc");
			return response?.data?.data?.data ?? [];
		},
		enabled: isEditing,
	});

	// ── Form 1: Item Master ──
	const itemMasterForm = useForm<ItemMasterFormValues>({
		resolver: zodResolver(ItemMasterSchema),
		defaultValues: {
			itemName: lineItem.item?.itemName ?? "",
			itemType: (lineItem.item?.itemType as z.infer<typeof ItemMasterSchema>["itemType"]) ?? "UNIT",
		},
	});

	const { mutate: saveItemMaster, isPending: isSavingItemMaster } = useMutation({
		mutationFn: async (values: ItemMasterFormValues) => {
			const response = await axios.put(`/api/v1/item?itemCode=${lineItem.item?.itemCode}`, {
				itemName: values.itemName,
				itemType: values.itemType,
			});
			return response?.data;
		},
		onSuccess: () => {
			toast.success("Item updated successfully");
			queryClient.invalidateQueries({ queryKey: ["rfq", rfqId] });
		},
		onError: () => {
			toast.error("Failed to update item");
		},
	});

	const watchedItemType = itemMasterForm.watch("itemType");
	const isSetOrAssembly = watchedItemType === "SET" || watchedItemType === "ASSEMBLY";

	// ── Form 2: Line Item ──
	const lineItemForm = useForm<LineItemFormValues>({
		resolver: zodResolver(LineItemSchema),
		defaultValues: {
			quantity: lineItem.quantity,
			drawingNumber: lineItem.drawingNumber ?? "",
			itemTechSpecs: {
				material: lineItem.itemTechSpecs?.material ?? "",
				diameter: lineItem.itemTechSpecs?.diameter ?? "",
				length: lineItem.itemTechSpecs?.length ?? "",
				weight: lineItem.itemTechSpecs?.weight ?? "",
				grade: lineItem.itemTechSpecs?.grade ?? "",
				hardness: (lineItem.itemTechSpecs?.hardness ?? []).map(h => ({
					hardnessType: h.hardnessType,
					value: h.value,
					measurement: h.measurement,
				})),
			},
		},
	});

	const { fields: hardnessFields, append: appendHardness, remove: removeHardness } = useFieldArray({
		control: lineItemForm.control,
		name: "itemTechSpecs.hardness",
	});

	const { mutate: saveLineItem, isPending: isSavingLineItem } = useMutation({
		mutationFn: (values: LineItemFormValues) =>
			updateRfqItemApi(lineItem._id, {
				quantity: values.quantity,
				drawingNumber: values.drawingNumber,
				itemTechSpecs: values.itemTechSpecs,
			}),
		onSuccess: () => {
			toast.success("Item updated successfully");
			queryClient.invalidateQueries({ queryKey: ["rfq", rfqId] });
			setIsEditing(false);
		},
		onError: () => {
			toast.error("Failed to update item");
		},
	});

	// ── Form 3: BOM ──
	const bomForm = useForm<BomFormValues>({
		resolver: zodResolver(BomSchema),
		defaultValues: {
			bom: (lineItem.item?.bom ?? []).map(b => ({
				partName: b.partName,
				partDescription: b.partDescription ?? "",
				material: b.material ?? "",
				quantity: b.quantity,
				diameter: b.diameter ?? "",
				length: b.length ?? "",
				weight: b.weight ?? "",
				density: b.density ?? "7.85",
				grade: b.grade ?? "",
				make: b.make ?? "",
				remarks: b.remarks ?? "",
				hardness: (b.hardness ?? []).map(h => ({ hardnessType: h.hardnessType, value: h.value, measurement: h.measurement })),
			})),
		},
	});

	// Weight calculator for BOM parts
	const calcBomWeight = (bomIdx: number) => {
		const dia = parseFloat(bomForm.getValues(`bom.${bomIdx}.diameter`) || "0") || 0;
		const len = parseFloat(bomForm.getValues(`bom.${bomIdx}.length`) || "0") || 0;
		const den = parseFloat(bomForm.getValues(`bom.${bomIdx}.density`) || "7.85") || 7.85;
		if (dia > 0 && len > 0) {
			const w = (Math.PI * Math.pow(dia / 2, 2) * len * den) / 1_000_000;
			bomForm.setValue(`bom.${bomIdx}.weight`, w.toFixed(4));
		}
	};

	const { fields: bomFields, append: appendBom, remove: removeBom } = useFieldArray({
		control: bomForm.control,
		name: "bom",
	});

	const { mutate: saveBom, isPending: isSavingBom } = useMutation({
		mutationFn: async (values: BomFormValues) => {
			const response = await axios.put(`/api/v1/item?itemCode=${lineItem.item?.itemCode}`, { bom: values.bom });
			return response?.data;
		},
		onSuccess: () => {
			toast.success("BOM saved successfully");
			queryClient.invalidateQueries({ queryKey: ["rfq", rfqId] });
		},
		onError: () => {
			toast.error("Failed to save BOM");
		},
	});

	// ── BOM nested hardness helpers (manual setValue/getValues) ──
	const addBomHardness = (bomIdx: number) => {
		const current = bomForm.getValues(`bom.${bomIdx}.hardness`) ?? [];
		bomForm.setValue(`bom.${bomIdx}.hardness`, [...current, { hardnessType: "", value: "", measurement: "" }]);
	};

	const removeBomHardness = (bomIdx: number, hIdx: number) => {
		const current = bomForm.getValues(`bom.${bomIdx}.hardness`) ?? [];
		bomForm.setValue(
			`bom.${bomIdx}.hardness`,
			current.filter((_, j) => j !== hIdx)
		);
	};

	// ── Drawing upload (not a form) ──
	const { mutate: uploadDrawing, isPending: isUploading } = useMutation({
		mutationFn: (file: File) => uploadDrawingApi(lineItem._id, file),
		onSuccess: () => {
			toast.success("Drawing uploaded successfully");
			queryClient.invalidateQueries({ queryKey: ["rfq", rfqId] });
		},
		onError: (error: unknown) => {
			const axiosErr = error as { response?: { data?: { message?: string } } };
			const msg = axiosErr?.response?.data?.message ?? "Failed to upload drawing";
			toast.error(msg);
		},
	});

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.name.toLowerCase().endsWith(".pdf")) {
			toast.error("Only PDF files are allowed");
			e.target.value = "";
			return;
		}

		uploadDrawing(file);
		e.target.value = "";
	};

	const handleCancel = () => {
		itemMasterForm.reset({
			itemName: lineItem.item?.itemName ?? "",
			itemType: (lineItem.item?.itemType as z.infer<typeof ItemMasterSchema>["itemType"]) ?? "UNIT",
		});
		lineItemForm.reset({
			quantity: lineItem.quantity,
			drawingNumber: lineItem.drawingNumber ?? "",
			itemTechSpecs: {
				material: lineItem.itemTechSpecs?.material ?? "",
				diameter: lineItem.itemTechSpecs?.diameter ?? "",
				length: lineItem.itemTechSpecs?.length ?? "",
				weight: lineItem.itemTechSpecs?.weight ?? "",
				grade: lineItem.itemTechSpecs?.grade ?? "",
				hardness: (lineItem.itemTechSpecs?.hardness ?? []).map(h => ({
					hardnessType: h.hardnessType,
					value: h.value,
					measurement: h.measurement,
				})),
			},
		});
		bomForm.reset({
			bom: (lineItem.item?.bom ?? []).map(b => ({
				partName: b.partName,
				partDescription: b.partDescription ?? "",
				material: b.material ?? "",
				quantity: b.quantity,
				diameter: b.diameter ?? "",
				length: b.length ?? "",
				weight: b.weight ?? "",
				density: b.density ?? "7.85",
				grade: b.grade ?? "",
				make: b.make ?? "",
				remarks: b.remarks ?? "",
				hardness: (b.hardness ?? []).map(h => ({ hardnessType: h.hardnessType, value: h.value, measurement: h.measurement })),
			})),
		});
		setIsEditing(false);
	};

	return (
		<div className="rounded-lg border bg-card">
			{/* Collapsed header */}
			<button className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50" onClick={onToggle} type="button">
				<div className="flex items-center gap-4">
					<Badge className="flex h-7 min-w-7 items-center justify-center rounded-full px-1.5" variant="outline">
						{lineItem.serialNumber || idx + 1}
					</Badge>
					<div>
						<p className="text-sm font-semibold">{lineItem.item?.itemName || "Unknown Item"}</p>
						<p className="text-xs text-muted-foreground">
							{lineItem.item?.itemCode || "—"} &middot; Qty: {lineItem.quantity} &middot; {lineItem.item?.itemType || "—"}
							{lineItem.drawingUrl ? " &middot; Drawing attached" : ""}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{(lineItem.commercialSpecs?.totalCost > 0 || lineItem.commercialSpecs?.sellingPrice > 0) && <Calculator className="h-4 w-4 text-blue-600" />}
					{lineItem.drawingUrl && <FileText className="h-4 w-4 text-green-600" />}
					{expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
				</div>
			</button>

			{/* Expanded content */}
			{expanded && (
				<div className="border-t px-4 py-4">
					<div className="mb-3 flex items-center justify-between">
						<h4 className="text-sm font-semibold">Item Details</h4>
						{!isEditing ? (
							<div className="flex gap-2">
								<CostingDialog lineItem={lineItem} rfqId={rfqId} />
								<Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
									<Pencil className="mr-2 h-3 w-3" />
									Edit Item
								</Button>
							</div>
						) : (
							<div className="flex gap-2">
								<Button disabled={isSavingLineItem} onClick={handleCancel} size="sm" variant="outline">
									<X className="mr-2 h-3 w-3" />
									Cancel
								</Button>
								<Button disabled={isSavingLineItem} onClick={lineItemForm.handleSubmit(values => saveLineItem(values))} size="sm">
									<Save className="mr-2 h-3 w-3" />
									{isSavingLineItem ? "Saving..." : "Save"}
								</Button>
							</div>
						)}
					</div>

					{/* Item master info */}
					{isEditing ? (
						<Form {...itemMasterForm}>
							<div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
								<ReadOnlyField label="Item Code" value={lineItem.item?.itemCode} />
								<FormField
									control={itemMasterForm.control}
									name="itemName"
									render={({ field }) => (
										<FormItem className="flex flex-col gap-1.5">
											<FormLabel className="text-xs">Item Name</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<ReadOnlyField label="Description" value={lineItem.item?.itemDesc} />
								<FormField
									control={itemMasterForm.control}
									name="itemType"
									render={({ field }) => (
										<FormItem className="flex flex-col gap-1.5">
											<FormLabel className="text-xs">Type</FormLabel>
											<Select onValueChange={field.onChange} value={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select type" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="UNIT">UNIT</SelectItem>
													<SelectItem value="SET">SET</SelectItem>
													<SelectItem value="ASSEMBLY">ASSEMBLY</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Button className="self-end" disabled={isSavingItemMaster} onClick={itemMasterForm.handleSubmit(values => saveItemMaster(values))} size="sm" variant="outline">
									<Save className="mr-2 h-3 w-3" />
									{isSavingItemMaster ? "Saving..." : "Save Item"}
								</Button>
							</div>
						</Form>
					) : (
						<div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
							<ReadOnlyField label="Item Code" value={lineItem.item?.itemCode} />
							<ReadOnlyField label="Item Name" value={lineItem.item?.itemName} />
							<ReadOnlyField label="Description" value={lineItem.item?.itemDesc} />
							<ReadOnlyField label="Type" value={lineItem.item?.itemType} />
						</div>
					)}

					{/* Drawing section */}
					<Separator className="my-4" />
					<DrawingSection
						drawingUrl={lineItem.drawingUrl}
						fileInputRef={fileInputRef}
						handleFileChange={handleFileChange}
						isUploading={isUploading}
					/>

					{isEditing ? (
						<>
							{/* Editable: Line Item Form (Quantity, Drawing Number, Tech Specs, Hardness) */}
							<Form {...lineItemForm}>
								<Separator className="my-4" />
								<div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
									<FormField
										control={lineItemForm.control}
										name="quantity"
										render={({ field }) => (
											<FormItem className="flex flex-col gap-1.5">
												<FormLabel className="text-xs">Quantity</FormLabel>
												<FormControl>
													<Input min={1} type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={lineItemForm.control}
										name="drawingNumber"
										render={({ field }) => (
											<FormItem className="flex flex-col gap-1.5">
												<FormLabel className="text-xs">Drawing Number</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Technical Specifications */}
								<Separator className="my-4" />
								<h5 className="mb-3 text-sm font-semibold">Technical Specifications</h5>
								<div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
									<FormField
										control={lineItemForm.control}
										name="itemTechSpecs.material"
										render={({ field }) => (
											<FormItem className="flex flex-col gap-1.5">
												<FormLabel className="text-xs">Material</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={lineItemForm.control}
										name="itemTechSpecs.diameter"
										render={({ field }) => (
											<FormItem className="flex flex-col gap-1.5">
												<FormLabel className="text-xs">Diameter</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={lineItemForm.control}
										name="itemTechSpecs.length"
										render={({ field }) => (
											<FormItem className="flex flex-col gap-1.5">
												<FormLabel className="text-xs">Length</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={lineItemForm.control}
										name="itemTechSpecs.weight"
										render={({ field }) => (
											<FormItem className="flex flex-col gap-1.5">
												<FormLabel className="text-xs">Weight</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={lineItemForm.control}
										name="itemTechSpecs.grade"
										render={({ field }) => (
											<FormItem className="flex flex-col gap-1.5">
												<FormLabel className="text-xs">Grade</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Hardness */}
								<Separator className="my-4" />
								<div className="mb-3 flex items-center justify-between">
									<h5 className="text-sm font-semibold">Hardness</h5>
									<Button onClick={() => appendHardness({ hardnessType: "", value: "", measurement: "" })} size="sm" type="button" variant="outline">
										<Plus className="mr-2 h-3 w-3" />
										Add Hardness
									</Button>
								</div>
								{hardnessFields.length === 0 ? (
									<p className="mb-4 text-sm text-muted-foreground">No hardness entries. Click &quot;Add Hardness&quot; to add one.</p>
								) : (
									<div className="mb-4 space-y-3">
										{hardnessFields.map((hField, i) => (
											<div className="flex items-end gap-3" key={hField.id}>
												<FormField
													control={lineItemForm.control}
													name={`itemTechSpecs.hardness.${i}.hardnessType`}
													render={({ field }) => (
														<FormItem className="flex flex-1 flex-col gap-1.5">
															<FormLabel className="text-xs">Hardness Type</FormLabel>
															<Select onValueChange={field.onChange} value={field.value}>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder="Select type" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{hardnessTypes.map(ht => (
																		<SelectItem key={ht._id} value={ht.name}>
																			{ht.name}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={lineItemForm.control}
													name={`itemTechSpecs.hardness.${i}.value`}
													render={({ field }) => (
														<FormItem className="flex flex-1 flex-col gap-1.5">
															<FormLabel className="text-xs">Value</FormLabel>
															<FormControl>
																<Input placeholder="e.g. 200-225" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={lineItemForm.control}
													name={`itemTechSpecs.hardness.${i}.measurement`}
													render={({ field }) => (
														<FormItem className="flex flex-1 flex-col gap-1.5">
															<FormLabel className="text-xs">Measurement</FormLabel>
															<Select onValueChange={field.onChange} value={field.value}>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder="Select unit" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{hardnessMeasurements.map(hm => (
																		<SelectItem key={hm._id} value={hm.name}>
																			{hm.name}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>
												<Button className="mb-0.5" onClick={() => removeHardness(i)} size="icon" type="button" variant="ghost">
													<Trash2 className="h-4 w-4 text-destructive" />
												</Button>
											</div>
										))}
									</div>
								)}
							</Form>

							{/* Editable: BOM (SET/ASSEMBLY only) */}
							{isSetOrAssembly && (
								<Form {...bomForm}>
									<Separator className="my-4" />
									<div className="mb-3 flex items-center justify-between">
										<h5 className="text-sm font-semibold">Bill of Materials (BOM)</h5>
										<div className="flex gap-2">
											<Button onClick={() => appendBom({ partName: "", partDescription: "", material: "", quantity: 1, diameter: "", length: "", weight: "", density: "7.85", grade: "", make: "", remarks: "", hardness: [] })} size="sm" type="button" variant="outline">
												<Plus className="mr-2 h-3 w-3" />
												Add Part
											</Button>
											<Button disabled={isSavingBom} onClick={bomForm.handleSubmit(values => saveBom(values))} size="sm" type="button">
												<Save className="mr-2 h-3 w-3" />
												{isSavingBom ? "Saving..." : "Save BOM"}
											</Button>
										</div>
									</div>
									{bomFields.length === 0 ? (
										<p className="mb-4 text-sm text-muted-foreground">No BOM entries. Click &quot;Add Part&quot; to define sub-parts.</p>
									) : (
										<div className="mb-4 space-y-4">
											{bomFields.map((bomField, i) => {
												const watchedHardness = bomForm.watch(`bom.${i}.hardness`) ?? [];
												return (
													<div className="rounded-lg border bg-muted/20 p-4" key={bomField.id}>
														<div className="mb-3 flex items-center justify-between">
															<span className="text-sm font-semibold">Part {i + 1}{bomForm.watch(`bom.${i}.partName`) ? ` — ${bomForm.watch(`bom.${i}.partName`)}` : ""}</span>
															<Button className="h-7 w-7" onClick={() => removeBom(i)} size="icon" type="button" variant="ghost">
																<Trash2 className="h-4 w-4 text-destructive" />
															</Button>
														</div>
														{/* Row 1: Basic info */}
														<div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
															<FormField
																control={bomForm.control}
																name={`bom.${i}.partName`}
																render={({ field }) => (
																	<FormItem className="flex flex-col gap-1.5">
																		<FormLabel className="text-xs">Part Name *</FormLabel>
																		<FormControl>
																			<Input placeholder="e.g. Bolt" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={bomForm.control}
																name={`bom.${i}.partDescription`}
																render={({ field }) => (
																	<FormItem className="flex flex-col gap-1.5">
																		<FormLabel className="text-xs">Description</FormLabel>
																		<FormControl>
																			<Input placeholder="Optional" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={bomForm.control}
																name={`bom.${i}.material`}
																render={({ field }) => (
																	<FormItem className="flex flex-col gap-1.5">
																		<FormLabel className="text-xs">Material</FormLabel>
																		<FormControl>
																			<Input placeholder="e.g. MS" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={bomForm.control}
																name={`bom.${i}.quantity`}
																render={({ field }) => (
																	<FormItem className="flex flex-col gap-1.5">
																		<FormLabel className="text-xs">Qty *</FormLabel>
																		<FormControl>
																			<Input min={1} type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
														</div>
														{/* Row 2: Tech specs */}
														<div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
															<FormField
																control={bomForm.control}
																name={`bom.${i}.diameter`}
																render={({ field }) => (
																	<FormItem className="flex flex-col gap-1.5">
																		<FormLabel className="text-xs">Diameter (mm)</FormLabel>
																		<FormControl>
																			<Input placeholder="e.g. 12" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={bomForm.control}
																name={`bom.${i}.length`}
																render={({ field }) => (
																	<FormItem className="flex flex-col gap-1.5">
																		<FormLabel className="text-xs">Length (mm)</FormLabel>
																		<FormControl>
																			<Input placeholder="e.g. 50" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={bomForm.control}
																name={`bom.${i}.density`}
																render={({ field }) => (
																	<FormItem className="flex flex-col gap-1.5">
																		<FormLabel className="text-xs">Density (g/cm³)</FormLabel>
																		<FormControl>
																			<Input placeholder="7.85" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={bomForm.control}
																name={`bom.${i}.weight`}
																render={({ field }) => (
																	<FormItem className="flex flex-col gap-1.5">
																		<FormLabel className="text-xs">Weight (kg)</FormLabel>
																		<div className="flex gap-1">
																			<FormControl>
																				<Input placeholder="e.g. 0.5" {...field} />
																			</FormControl>
																			<Button className="h-9 shrink-0 px-2 text-[10px]" onClick={() => calcBomWeight(i)} size="sm" type="button" variant="outline">
																				Calc
																			</Button>
																		</div>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={bomForm.control}
																name={`bom.${i}.grade`}
																render={({ field }) => (
																	<FormItem className="flex flex-col gap-1.5">
																		<FormLabel className="text-xs">Grade</FormLabel>
																		<FormControl>
																			<Input placeholder="e.g. 8.8" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={bomForm.control}
																name={`bom.${i}.make`}
																render={({ field }) => (
																	<FormItem className="flex flex-col gap-1.5">
																		<FormLabel className="text-xs">Make</FormLabel>
																		<FormControl>
																			<Input placeholder="e.g. Sundram" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
														</div>
														{/* Row 3: Remarks */}
														<div className="mb-3 grid grid-cols-1 gap-3">
															<FormField
																control={bomForm.control}
																name={`bom.${i}.remarks`}
																render={({ field }) => (
																	<FormItem className="flex flex-col gap-1.5">
																		<FormLabel className="text-xs">Remarks</FormLabel>
																		<FormControl>
																			<Input placeholder="Any additional notes" {...field} />
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
														</div>
														{/* Row 4: Hardness */}
														<div className="flex items-center justify-between">
															<span className="text-xs font-medium text-muted-foreground">Hardness</span>
															<Button className="h-7" onClick={() => addBomHardness(i)} size="sm" type="button" variant="outline">
																<Plus className="mr-1 h-3 w-3" />
																Add
															</Button>
														</div>
														{watchedHardness.length > 0 && (
															<div className="mt-2 space-y-2">
																{watchedHardness.map((_, hIdx) => (
																	<div className="flex items-end gap-3" key={hIdx}>
																		<FormField
																			control={bomForm.control}
																			name={`bom.${i}.hardness.${hIdx}.hardnessType`}
																			render={({ field }) => (
																				<FormItem className="flex flex-1 flex-col gap-1.5">
																					<FormLabel className="text-xs">Type</FormLabel>
																					<Select onValueChange={field.onChange} value={field.value}>
																						<FormControl>
																							<SelectTrigger>
																								<SelectValue placeholder="Select" />
																							</SelectTrigger>
																						</FormControl>
																						<SelectContent>
																							{hardnessTypes.map(ht => (
																								<SelectItem key={ht._id} value={ht.name}>{ht.name}</SelectItem>
																							))}
																						</SelectContent>
																					</Select>
																					<FormMessage />
																				</FormItem>
																			)}
																		/>
																		<FormField
																			control={bomForm.control}
																			name={`bom.${i}.hardness.${hIdx}.value`}
																			render={({ field }) => (
																				<FormItem className="flex flex-1 flex-col gap-1.5">
																					<FormLabel className="text-xs">Value</FormLabel>
																					<FormControl>
																						<Input placeholder="e.g. 200-225" {...field} />
																					</FormControl>
																					<FormMessage />
																				</FormItem>
																			)}
																		/>
																		<FormField
																			control={bomForm.control}
																			name={`bom.${i}.hardness.${hIdx}.measurement`}
																			render={({ field }) => (
																				<FormItem className="flex flex-1 flex-col gap-1.5">
																					<FormLabel className="text-xs">Measurement</FormLabel>
																					<Select onValueChange={field.onChange} value={field.value}>
																						<FormControl>
																							<SelectTrigger>
																								<SelectValue placeholder="Select" />
																							</SelectTrigger>
																						</FormControl>
																						<SelectContent>
																							{hardnessMeasurements.map(hm => (
																								<SelectItem key={hm._id} value={hm.name}>{hm.name}</SelectItem>
																							))}
																						</SelectContent>
																					</Select>
																					<FormMessage />
																				</FormItem>
																			)}
																		/>
																		<Button className="mb-0.5" onClick={() => removeBomHardness(i, hIdx)} size="icon" type="button" variant="ghost">
																			<Trash2 className="h-4 w-4 text-destructive" />
																		</Button>
																	</div>
																))}
															</div>
														)}
													</div>
												);
											})}
										</div>
									)}
								</Form>
							)}

						</>
					) : (
						<>
							{/* Read-only view */}
							<div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
								<ReadOnlyField label="Quantity" value={String(lineItem.quantity)} />
								<ReadOnlyField label="Drawing Number" value={lineItem.drawingNumber} />
							</div>

							{lineItem.itemTechSpecs && (
								<>
									<Separator className="my-4" />
									<h5 className="mb-3 text-sm font-semibold">Technical Specifications</h5>
									<div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
										<ReadOnlyField label="Material" value={lineItem.itemTechSpecs.material} />
										<ReadOnlyField label="Diameter" value={lineItem.itemTechSpecs.diameter} />
										<ReadOnlyField label="Length" value={lineItem.itemTechSpecs.length} />
										<ReadOnlyField label="Weight" value={lineItem.itemTechSpecs.weight} />
										<ReadOnlyField label="Grade" value={lineItem.itemTechSpecs.grade} />
									</div>

									{lineItem.itemTechSpecs.hardness && lineItem.itemTechSpecs.hardness.length > 0 && (
										<>
											<Separator className="my-4" />
											<h5 className="mb-3 text-sm font-semibold">Hardness</h5>
											<div className="mb-4 space-y-2">
												{lineItem.itemTechSpecs.hardness.map((h, i) => (
													<div className="grid grid-cols-3 gap-3 rounded-md border bg-muted/30 px-3 py-2" key={h._id || i}>
														<ReadOnlyField label="Hardness Type" value={h.hardnessType} />
														<ReadOnlyField label="Value" value={h.value} />
														<ReadOnlyField label="Measurement" value={h.measurement} />
													</div>
												))}
											</div>
										</>
									)}
								</>
							)}

							{/* Read-only: BOM (SET/ASSEMBLY only) */}
							{isSetOrAssembly && lineItem.item?.bom && lineItem.item.bom.length > 0 && (
								<>
									<Separator className="my-4" />
									<h5 className="mb-3 text-sm font-semibold">Bill of Materials (BOM)</h5>
									<div className="mb-4 space-y-3">
										{lineItem.item.bom.map((entry, i) => (
											<div className="rounded-lg border bg-muted/20 p-4" key={entry._id || i}>
												<p className="mb-2 text-sm font-semibold">Part {i + 1} — {entry.partName || "Unnamed"}</p>
												<div className="mb-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
													<ReadOnlyField label="Part Name" value={entry.partName} />
													<ReadOnlyField label="Description" value={entry.partDescription} />
													<ReadOnlyField label="Material" value={entry.material} />
													<ReadOnlyField label="Quantity" value={String(entry.quantity)} />
												</div>
												<div className="mb-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
													<ReadOnlyField label="Diameter (mm)" value={entry.diameter} />
													<ReadOnlyField label="Length (mm)" value={entry.length} />
													<ReadOnlyField label="Density (g/cm³)" value={entry.density} />
													<ReadOnlyField label="Weight (kg)" value={entry.weight} />
													<ReadOnlyField label="Grade" value={entry.grade} />
													<ReadOnlyField label="Make" value={entry.make} />
												</div>
												{entry.remarks && (
													<div className="mb-2">
														<ReadOnlyField label="Remarks" value={entry.remarks} />
													</div>
												)}
												{entry.hardness && entry.hardness.length > 0 && (
													<div className="mt-2">
														<span className="text-xs font-medium text-muted-foreground">Hardness</span>
														<div className="mt-1 space-y-1">
															{entry.hardness.map((h, hIdx) => (
																<div className="grid grid-cols-3 gap-3 rounded-md border bg-background px-3 py-2" key={h._id || hIdx}>
																	<ReadOnlyField label="Type" value={h.hardnessType} />
																	<ReadOnlyField label="Value" value={h.value} />
																	<ReadOnlyField label="Measurement" value={h.measurement} />
																</div>
															))}
														</div>
													</div>
												)}
											</div>
										))}
									</div>
								</>
							)}

						</>
					)}
				</div>
			)}
		</div>
	);
};

interface DrawingSectionProps {
	drawingUrl: string;
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	isUploading: boolean;
}

const DrawingSection = ({ drawingUrl, fileInputRef, handleFileChange, isUploading }: DrawingSectionProps) => {
	return (
		<div className="mb-4">
			<h5 className="mb-3 text-sm font-semibold">Drawing</h5>
			{drawingUrl ? (
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
						<FileText className="h-4 w-4 text-red-600" />
						<span className="text-sm font-medium">Drawing PDF</span>
					</div>
					<Button
						onClick={() => window.open(drawingUrl, "_blank", "noopener,noreferrer")}
						size="sm"
						variant="outline"
					>
						<ExternalLink className="mr-2 h-3 w-3" />
						Open Drawing
					</Button>
					<input accept=".pdf,application/pdf" className="hidden" onChange={handleFileChange} ref={fileInputRef} type="file" />
					<Button disabled={isUploading} onClick={() => fileInputRef.current?.click()} size="sm" variant="outline">
						{isUploading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Upload className="mr-2 h-3 w-3" />}
						Replace
					</Button>
				</div>
			) : (
				<div className="flex items-center gap-3">
					<span className="text-sm text-muted-foreground">No drawing uploaded</span>
					<input accept=".pdf,application/pdf" className="hidden" onChange={handleFileChange} ref={fileInputRef} type="file" />
					<Button disabled={isUploading} onClick={() => fileInputRef.current?.click()} size="sm" variant="outline">
						{isUploading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Upload className="mr-2 h-3 w-3" />}
						Upload PDF
					</Button>
				</div>
			)}
		</div>
	);
};

const ReadOnlyField = ({ label, value }: { label: string; value?: string }) => (
	<div className="flex flex-col gap-1">
		<span className="text-xs text-muted-foreground">{label}</span>
		<span className="text-sm font-medium">{value || "—"}</span>
	</div>
);

export default RfqItemsSection;
