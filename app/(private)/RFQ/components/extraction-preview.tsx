"use client";
import { useState } from "react";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Label } from "@components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Check, Pencil } from "lucide-react";

interface ExtractionPreviewProps {
	data: ExtractionResponse["data"];
	onConfirm: (payload: ConfirmPayload) => void;
	isConfirming: boolean;
}

const ExtractionPreview = ({ data, onConfirm, isConfirming }: ExtractionPreviewProps) => {
	const extracted = data.extractedData;

	const [prNumber, setPrNumber] = useState(extracted.prNumber || "");
	const [supplyType, setSupplyType] = useState(extracted.supplyType || "");
	const [location, setLocation] = useState(extracted.location || "");
	const [companyName, setCompanyName] = useState(extracted.companyName || "");
	const [dueDate, setDueDate] = useState("");
	const [ownerName, setOwnerName] = useState("");
	const [items, setItems] = useState<ParsedItem[]>(extracted.items || []);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);

	const updateItem = (index: number, field: keyof ParsedItem, value: string | number) => {
		const updated = [...items];
		updated[index] = { ...updated[index], [field]: value };
		setItems(updated);
	};

	const handleConfirm = () => {
		if (!prNumber || !location || !companyName) return;
		onConfirm({ prNumber, supplyType, location, companyName, dueDate, ownerName, items });
	};

	const confidenceVariant = data.extraction.confidence >= 80 ? "success" : data.extraction.confidence >= 50 ? "warning" : "destructive";

	return (
		<div className="flex flex-col gap-6">
			{/* Extraction metadata */}
			<div className="flex flex-wrap items-center gap-3">
				<Badge variant={confidenceVariant}>Confidence: {data.extraction.confidence}%</Badge>
				<Badge variant="secondary">Layer: {data.extraction.layer}</Badge>
				<Badge variant={data.extraction.status === "FAILED" ? "destructive" : "default"}>{data.extraction.status}</Badge>
			</div>

			{/* Editable header fields */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div className="flex flex-col gap-1.5">
					<Label>PR Number *</Label>
					<Input onChange={e => setPrNumber(e.target.value)} placeholder="PR Number" value={prNumber} />
				</div>
				<div className="flex flex-col gap-1.5">
					<Label>Company Name *</Label>
					<Input onChange={e => setCompanyName(e.target.value)} placeholder="Company Name" value={companyName} />
				</div>
				<div className="flex flex-col gap-1.5">
					<Label>Location *</Label>
					<Input onChange={e => setLocation(e.target.value)} placeholder="Location" value={location} />
				</div>
				<div className="flex flex-col gap-1.5">
					<Label>Supply Type</Label>
					<Input onChange={e => setSupplyType(e.target.value)} placeholder="Supply Type" value={supplyType} />
				</div>
				<div className="flex flex-col gap-1.5">
					<Label>Owner Name</Label>
					<Input onChange={e => setOwnerName(e.target.value)} placeholder="Owner Name" value={ownerName} />
				</div>
				<div className="flex flex-col gap-1.5">
					<Label>Due Date</Label>
					<input className="flex h-12 w-full items-center rounded-xl border border-border bg-input px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2" onChange={e => setDueDate(e.target.value)} type="date" value={dueDate} />
				</div>
			</div>

			{/* Items table */}
			<div className="flex flex-col gap-2">
				<h3 className="text-sm font-semibold">Extracted Items ({items.length})</h3>
				{items.length > 0 ? (
					<div className="rounded-xl border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>#</TableHead>
									<TableHead>Item Code</TableHead>
									<TableHead>Item Name</TableHead>
									<TableHead>Quantity</TableHead>
									<TableHead>Drawing No.</TableHead>
									<TableHead>Material</TableHead>
									<TableHead>Grade</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((item, idx) => (
									<TableRow key={idx}>
										<TableCell>{idx + 1}</TableCell>
										<TableCell>
											{editingIndex === idx ? (
												<Input className="h-8 w-24" onChange={e => updateItem(idx, "itemCode", e.target.value)} value={item.itemCode} />
											) : (
												item.itemCode || "—"
											)}
										</TableCell>
										<TableCell>
											{editingIndex === idx ? (
												<Input className="h-8 w-32" onChange={e => updateItem(idx, "itemName", e.target.value)} value={item.itemName} />
											) : (
												item.itemName || "—"
											)}
										</TableCell>
										<TableCell>
											{editingIndex === idx ? (
												<Input className="h-8 w-20" onChange={e => updateItem(idx, "quantity", Number(e.target.value))} type="number" value={item.quantity} />
											) : (
												item.quantity
											)}
										</TableCell>
										<TableCell>{item.drawingNumber || "—"}</TableCell>
										<TableCell>{item.technical?.material || "—"}</TableCell>
										<TableCell>{item.technical?.grade || "—"}</TableCell>
										<TableCell>
											<Button onClick={() => setEditingIndex(editingIndex === idx ? null : idx)} size="icon" variant="ghost">
												{editingIndex === idx ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				) : (
					<p className="text-sm text-muted-foreground">No items extracted. You may need to re-extract or enter data manually.</p>
				)}
			</div>

			{/* Confirm button */}
			<Button className="self-end" disabled={!prNumber || !location || !companyName || isConfirming} onClick={handleConfirm}>
				{isConfirming ? "Creating RFQ..." : "Confirm & Create RFQ"}
			</Button>
		</div>
	);
};

export default ExtractionPreview;
