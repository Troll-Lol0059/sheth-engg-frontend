"use client";
import axios from "@config/axios";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { IndianRupee, Loader2 } from "lucide-react";

interface CostingSummaryProps {
	rfqId: string;
	items: RfqLineItem[];
}

const CostingSummary = ({ rfqId, items }: CostingSummaryProps) => {
	const { data: costings, isLoading } = useQuery<Costing[]>({
		queryKey: ["costings-rfq", rfqId],
		queryFn: async () => {
			const response = await axios.get(`/api/v1/costing/rfq/${rfqId}`);
			return (response?.data?.data ?? []) as Costing[];
		},
	});

	if (isLoading) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center py-8">
					<Loader2 className="h-5 w-5 animate-spin text-primary" />
				</CardContent>
			</Card>
		);
	}

	if (!costings || costings.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<IndianRupee className="h-5 w-5" />
						Costing Summary
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">No costings created yet. Open a line item and click &ldquo;Add Costing&rdquo; to get started.</p>
				</CardContent>
			</Card>
		);
	}

	const grandTotal = costings.reduce((sum, c) => sum + c.totalCost, 0);
	const quotedCount = costings.length;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between text-lg">
					<span className="flex items-center gap-2">
						<IndianRupee className="h-5 w-5" />
						Costing Summary
					</span>
					<Badge variant={quotedCount === items.length ? "success" : "warning"}>
						{quotedCount}/{items.length} items quoted
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Sl. No.</TableHead>
								<TableHead>Item</TableHead>
								<TableHead>Part</TableHead>
								<TableHead>Type</TableHead>
								<TableHead className="text-right">Qty</TableHead>
								<TableHead className="text-right">Cost Price (₹)</TableHead>
								<TableHead className="text-right">Margin (%)</TableHead>
								<TableHead className="text-right">Part Total (₹)</TableHead>
								<TableHead className="text-right">Packing (₹)</TableHead>
								<TableHead className="text-right">Shipping (₹)</TableHead>
								<TableHead className="text-right">Selling Price (₹/pc)</TableHead>
								<TableHead className="text-right">Item Qty</TableHead>
								<TableHead className="text-right">Total (₹)</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{costings.map(costing => {
								const rfqItem = typeof costing.rfqItem === "object" ? costing.rfqItem : null;
								const parts = costing.parts ?? [];
								const hasParts = parts.length > 0;

								return hasParts ? (
									parts.map((part, pIdx) => (
										<TableRow key={`${costing._id}-${pIdx}`}>
											{pIdx === 0 && (
												<>
													<TableCell className="align-top" rowSpan={parts.length}>
														{rfqItem?.serialNumber || "—"}
													</TableCell>
													<TableCell className="align-top font-medium" rowSpan={parts.length}>
														{rfqItem?.item?.itemName ?? rfqItem?.item?.itemCode ?? "—"}
													</TableCell>
												</>
											)}
											<TableCell className="text-xs">{part.partName}</TableCell>
											<TableCell>
												<Badge className="text-[10px]" variant={part.supplyType === "COMPLETE_SUPPLY" ? "default" : "secondary"}>
													{part.supplyType === "COMPLETE_SUPPLY" ? "Vendor" : "Manual"}
												</Badge>
											</TableCell>
											<TableCell className="text-right">{part.quantity}</TableCell>
											<TableCell className="text-right">{part.costPrice?.toFixed(2) ?? "0.00"}</TableCell>
											<TableCell className="text-right">{part.profitMargin?.toFixed(1) ?? "0.0"}%</TableCell>
											<TableCell className="text-right">{part.partTotal?.toFixed(2) ?? "0.00"}</TableCell>
											{pIdx === 0 && (
												<>
													<TableCell className="text-right align-top" rowSpan={parts.length}>
														{costing.packingCost?.toFixed(2) ?? "0.00"}
													</TableCell>
													<TableCell className="text-right align-top" rowSpan={parts.length}>
														{costing.shippingCost?.toFixed(2) ?? "0.00"}
													</TableCell>
													<TableCell className="text-right align-top font-semibold" rowSpan={parts.length}>
														{costing.sellingPrice.toFixed(2)}
													</TableCell>
													<TableCell className="text-right align-top" rowSpan={parts.length}>
														{rfqItem?.quantity ?? "—"}
													</TableCell>
													<TableCell className="text-right align-top font-semibold" rowSpan={parts.length}>
														{costing.totalCost.toFixed(2)}
													</TableCell>
												</>
											)}
										</TableRow>
									))
								) : (
									<TableRow key={costing._id}>
										<TableCell>{rfqItem?.serialNumber || "—"}</TableCell>
										<TableCell className="font-medium">{rfqItem?.item?.itemName ?? rfqItem?.item?.itemCode ?? "—"}</TableCell>
										<TableCell colSpan={6} className="text-center text-xs text-muted-foreground">
											No parts
										</TableCell>
										<TableCell className="text-right">{costing.packingCost?.toFixed(2) ?? "0.00"}</TableCell>
										<TableCell className="text-right">{costing.shippingCost?.toFixed(2) ?? "0.00"}</TableCell>
										<TableCell className="text-right">{costing.sellingPrice.toFixed(2)}</TableCell>
										<TableCell className="text-right">{rfqItem?.quantity ?? "—"}</TableCell>
										<TableCell className="text-right font-semibold">{costing.totalCost.toFixed(2)}</TableCell>
									</TableRow>
								);
							})}
							<TableRow className="bg-muted/50 font-semibold">
								<TableCell className="text-right" colSpan={12}>
									Grand Total
								</TableCell>
								<TableCell className="text-right">₹{grandTotal.toFixed(2)}</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
};

export default CostingSummary;
