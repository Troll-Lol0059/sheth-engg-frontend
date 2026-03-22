"use client";
import { useRef, useState } from "react";
import axios from "@config/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import { Pencil, Save, X, Package, ChevronDown, ChevronUp, Upload, FileText, ExternalLink, Loader2 } from "lucide-react";
import CostingDialog from "./costing-dialog";

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
	const [form, setForm] = useState({
		quantity: lineItem.quantity,
		drawingNumber: lineItem.drawingNumber ?? "",
		itemTechSpecs: {
			material: lineItem.itemTechSpecs?.material ?? "",
			diameter: lineItem.itemTechSpecs?.diameter ?? "",
			length: lineItem.itemTechSpecs?.length ?? "",
			weight: lineItem.itemTechSpecs?.weight ?? "",
			grade: lineItem.itemTechSpecs?.grade ?? "",
		},
	});

	const { mutate, isPending } = useMutation({
		mutationFn: () =>
			updateRfqItemApi(lineItem._id, {
				quantity: form.quantity,
				drawingNumber: form.drawingNumber,
				itemTechSpecs: form.itemTechSpecs,
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
		setForm({
			quantity: lineItem.quantity,
			drawingNumber: lineItem.drawingNumber ?? "",
			itemTechSpecs: {
				material: lineItem.itemTechSpecs?.material ?? "",
				diameter: lineItem.itemTechSpecs?.diameter ?? "",
				length: lineItem.itemTechSpecs?.length ?? "",
				weight: lineItem.itemTechSpecs?.weight ?? "",
				grade: lineItem.itemTechSpecs?.grade ?? "",
			},
		});
		setIsEditing(false);
	};

	const updateTech = (key: string, value: string) =>
		setForm(prev => ({ ...prev, itemTechSpecs: { ...prev.itemTechSpecs, [key]: value } }));

	return (
		<div className="rounded-lg border bg-card">
			{/* Collapsed header */}
			<button className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50" onClick={onToggle} type="button">
				<div className="flex items-center gap-4">
					<Badge className="h-7 w-7 items-center justify-center rounded-full p-0" variant="outline">
						{idx + 1}
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
								<Button disabled={isPending} onClick={handleCancel} size="sm" variant="outline">
									<X className="mr-2 h-3 w-3" />
									Cancel
								</Button>
								<Button disabled={isPending} onClick={() => mutate()} size="sm">
									<Save className="mr-2 h-3 w-3" />
									{isPending ? "Saving..." : "Save"}
								</Button>
							</div>
						)}
					</div>

					{/* Item master info (always read-only) */}
					<div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
						<ReadOnlyField label="Item Code" value={lineItem.item?.itemCode} />
						<ReadOnlyField label="Item Name" value={lineItem.item?.itemName} />
						<ReadOnlyField label="Description" value={lineItem.item?.itemDesc} />
						<ReadOnlyField label="Type" value={lineItem.item?.itemType} />
					</div>

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
							{/* Editable: Quantity & Drawing */}
							<Separator className="my-4" />
							<div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Quantity</Label>
									<Input min={1} onChange={e => setForm(prev => ({ ...prev, quantity: Number(e.target.value) }))} type="number" value={form.quantity} />
								</div>
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Drawing Number</Label>
									<Input onChange={e => setForm(prev => ({ ...prev, drawingNumber: e.target.value }))} value={form.drawingNumber} />
								</div>
							</div>

							{/* Editable: Technical Specifications */}
							<Separator className="my-4" />
							<h5 className="mb-3 text-sm font-semibold">Technical Specifications</h5>
							<div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Material</Label>
									<Input onChange={e => updateTech("material", e.target.value)} value={form.itemTechSpecs.material} />
								</div>
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Diameter</Label>
									<Input onChange={e => updateTech("diameter", e.target.value)} value={form.itemTechSpecs.diameter} />
								</div>
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Length</Label>
									<Input onChange={e => updateTech("length", e.target.value)} value={form.itemTechSpecs.length} />
								</div>
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Weight</Label>
									<Input onChange={e => updateTech("weight", e.target.value)} value={form.itemTechSpecs.weight} />
								</div>
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs">Grade</Label>
									<Input onChange={e => updateTech("grade", e.target.value)} value={form.itemTechSpecs.grade} />
								</div>
							</div>

							{/* Read-only: Commercial Specifications (shown during edit too) */}
							{lineItem.commercialSpecs && (
								<>
									<Separator className="my-4" />
									<h5 className="mb-3 text-sm font-semibold text-muted-foreground">Commercial Specifications (read-only)</h5>
									<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
										<ReadOnlyField label="Currency" value={lineItem.commercialSpecs.currency} />
										<ReadOnlyField label="Raw Material Cost" value={String(lineItem.commercialSpecs.rawMaterialCost)} />
										<ReadOnlyField label="Labor Cost" value={String(lineItem.commercialSpecs.laborCost)} />
										<ReadOnlyField label="Packing Cost" value={String(lineItem.commercialSpecs.packingCost)} />
										<ReadOnlyField label="Shipping Cost" value={String(lineItem.commercialSpecs.shippingCost)} />
										<ReadOnlyField label="Profit Margin" value={`${lineItem.commercialSpecs.profitMargin}%`} />
										<ReadOnlyField label="Other Costs" value={String(lineItem.commercialSpecs.otherCosts)} />
										<ReadOnlyField label="Selling Price" value={String(lineItem.commercialSpecs.sellingPrice)} />
										<ReadOnlyField label="Total Cost" value={String(lineItem.commercialSpecs.totalCost)} />
									</div>
								</>
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
								</>
							)}

							{lineItem.commercialSpecs && (
								<>
									<Separator className="my-4" />
									<h5 className="mb-3 text-sm font-semibold">Commercial Specifications</h5>
									<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
										<ReadOnlyField label="Currency" value={lineItem.commercialSpecs.currency} />
										<ReadOnlyField label="Raw Material Cost" value={String(lineItem.commercialSpecs.rawMaterialCost)} />
										<ReadOnlyField label="Labor Cost" value={String(lineItem.commercialSpecs.laborCost)} />
										<ReadOnlyField label="Packing Cost" value={String(lineItem.commercialSpecs.packingCost)} />
										<ReadOnlyField label="Shipping Cost" value={String(lineItem.commercialSpecs.shippingCost)} />
										<ReadOnlyField label="Profit Margin" value={`${lineItem.commercialSpecs.profitMargin}%`} />
										<ReadOnlyField label="Other Costs" value={String(lineItem.commercialSpecs.otherCosts)} />
										<ReadOnlyField label="Selling Price" value={String(lineItem.commercialSpecs.sellingPrice)} />
										<ReadOnlyField label="Total Cost" value={String(lineItem.commercialSpecs.totalCost)} />
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
