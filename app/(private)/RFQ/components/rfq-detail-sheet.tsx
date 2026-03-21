"use client";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { format } from "date-fns";
import { X } from "lucide-react";

interface RfqDetailSheetProps {
	rfq: Rfq | null;
	open: boolean;
	onClose: () => void;
}

const statusVariantMap: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
	PREVIEW: "secondary",
	ACCEPTING_RESPONSE: "default",
	PENDING_SELECTION: "warning",
	AWARDED: "success",
	COMPLETED: "success",
};

const RfqDetailSheet = ({ rfq, open, onClose }: RfqDetailSheetProps) => {
	if (!rfq) return null;

	const items = (rfq.items ?? []) as RfqLineItem[];
	const hasPopulatedItems = items.length > 0 && typeof items[0] !== "string";

	return (
		<Dialog onOpenChange={val => !val && onClose()} open={open}>
			<DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle>RFQ Details — {rfq.prNumber}</DialogTitle>
						<Button className="h-6 w-6" onClick={onClose} size="icon" variant="ghost">
							<X className="h-4 w-4" />
						</Button>
					</div>
					<DialogDescription>Detailed view of the RFQ and its line items.</DialogDescription>
				</DialogHeader>

				{/* Header info */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<InfoField label="PR Number" value={rfq.prNumber} />
					<InfoField label="Company" value={rfq.companyName} />
					<InfoField label="Location" value={rfq.location} />
					<InfoField label="Owner" value={rfq.ownerName} />
					<InfoField label="Start Date" value={rfq.startDate ? format(new Date(rfq.startDate), "dd MMM yyyy") : "—"} />
					<InfoField label="Due Date" value={rfq.dueDate ? format(new Date(rfq.dueDate), "dd MMM yyyy") : "—"} />
					<div className="flex flex-col gap-1">
						<span className="text-xs text-muted-foreground">Status</span>
						<Badge className="w-fit" variant={statusVariantMap[rfq.status] ?? "default"}>
							{rfq.status.replace(/_/g, " ")}
						</Badge>
					</div>
					<InfoField label="Quoted" value={rfq.isQuoted ? "Yes" : "No"} />
					{rfq.deliveryWeeks && <InfoField label="Delivery Weeks" value={String(rfq.deliveryWeeks)} />}
				</div>

				{/* Line items */}
				{hasPopulatedItems && (
					<div className="flex flex-col gap-2">
						<h3 className="text-sm font-semibold">Line Items ({items.length})</h3>
						<div className="rounded-xl border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>#</TableHead>
										<TableHead>Item Code</TableHead>
										<TableHead>Item Name</TableHead>
										<TableHead>Qty</TableHead>
										<TableHead>Drawing No.</TableHead>
										<TableHead>Material</TableHead>
										<TableHead>Grade</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{items.map((lineItem, idx) => (
										<TableRow key={lineItem._id}>
											<TableCell>{idx + 1}</TableCell>
											<TableCell>{lineItem.item?.itemCode || "—"}</TableCell>
											<TableCell>{lineItem.item?.itemName || "—"}</TableCell>
											<TableCell>{lineItem.quantity}</TableCell>
											<TableCell>{lineItem.drawingNumber || "—"}</TableCell>
											<TableCell>{lineItem.itemTechSpecs?.material || "—"}</TableCell>
											<TableCell>{lineItem.itemTechSpecs?.grade || "—"}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>
				)}

				{!hasPopulatedItems && items.length > 0 && (
					<p className="text-sm text-muted-foreground">This RFQ has {items.length} item(s) (IDs only — detail view requires populated data).</p>
				)}
			</DialogContent>
		</Dialog>
	);
};

const InfoField = ({ label, value }: { label: string; value: string }) => (
	<div className="flex flex-col gap-1">
		<span className="text-xs text-muted-foreground">{label}</span>
		<span className="text-sm font-medium">{value || "—"}</span>
	</div>
);

export default RfqDetailSheet;
