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
								<TableHead>Item</TableHead>
								<TableHead className="text-right">Weight (kg)</TableHead>
								<TableHead className="text-right">Raw Material (₹)</TableHead>
								<TableHead className="text-right">Labour (₹)</TableHead>
								<TableHead className="text-right">Cost Price (₹)</TableHead>
								<TableHead className="text-right">Selling Price (₹/pc)</TableHead>
								<TableHead className="text-right">Qty</TableHead>
								<TableHead className="text-right">Total (₹)</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{costings.map(costing => {
								const rfqItem = typeof costing.rfqItem === "object" ? costing.rfqItem : null;
								return (
									<TableRow key={costing._id}>
										<TableCell className="font-medium">{rfqItem?.item?.itemName ?? rfqItem?.item?.itemCode ?? "—"}</TableCell>
										<TableCell className="text-right">{costing.weight.toFixed(3)}</TableCell>
										<TableCell className="text-right">{costing.rawMaterialCost.toFixed(2)}</TableCell>
										<TableCell className="text-right">{costing.totalLabourCost.toFixed(2)}</TableCell>
										<TableCell className="text-right">{costing.costPrice.toFixed(2)}</TableCell>
										<TableCell className="text-right">{costing.sellingPrice.toFixed(2)}</TableCell>
										<TableCell className="text-right">{rfqItem?.quantity ?? "—"}</TableCell>
										<TableCell className="text-right font-semibold">{costing.totalCost.toFixed(2)}</TableCell>
									</TableRow>
								);
							})}
							<TableRow className="bg-muted/50 font-semibold">
								<TableCell colSpan={7} className="text-right">
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
