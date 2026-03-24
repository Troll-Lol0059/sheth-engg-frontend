"use client";
import { useMemo, useState } from "react";
import axios from "@config/axios";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { IndianRupee, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import CostingDialog from "./costing-dialog";

const ITEMS_PER_PAGE = 10;

interface CostingSummaryProps {
	rfqId: string;
	items: RfqLineItem[];
}

const CostingSummary = ({ rfqId, items }: CostingSummaryProps) => {
	const [search, setSearch] = useState("");
	const [quotedPage, setQuotedPage] = useState(0);
	const [unquotedPage, setUnquotedPage] = useState(0);

	const { data: costings, isLoading } = useQuery<Costing[]>({
		queryKey: ["costings-rfq", rfqId],
		queryFn: async () => {
			const response = await axios.get(`/api/v1/costing/rfq/${rfqId}`);
			return (response?.data?.data ?? []) as Costing[];
		},
	});

	// Build a set of rfqItem IDs that have costings
	const costingByRfqItemId = useMemo(() => {
		const map = new Map<string, Costing>();
		(costings ?? []).forEach(c => {
			const rfqItemId = typeof c.rfqItem === "object" ? c.rfqItem._id : c.rfqItem;
			map.set(rfqItemId, c);
		});
		return map;
	}, [costings]);

	// Filter costings by search
	const filteredCostings = useMemo(() => {
		if (!search.trim()) return costings ?? [];
		const q = search.toLowerCase();
		return (costings ?? []).filter(c => {
			const rfqItem = typeof c.rfqItem === "object" ? c.rfqItem : null;
			return (
				(rfqItem?.serialNumber ?? "").toLowerCase().includes(q) ||
				(rfqItem?.item?.itemName ?? "").toLowerCase().includes(q) ||
				(rfqItem?.item?.itemCode ?? "").toLowerCase().includes(q) ||
				c.parts?.some(p => p.partName.toLowerCase().includes(q))
			);
		});
	}, [costings, search]);

	const unquotedItems = useMemo(() => {
		const all = items.filter(li => !costingByRfqItemId.has(li._id));
		if (!search.trim()) return all;
		const q = search.toLowerCase();
		return all.filter(
			li =>
				(li.serialNumber ?? "").toLowerCase().includes(q) ||
				(li.item?.itemName ?? "").toLowerCase().includes(q) ||
				(li.item?.itemCode ?? "").toLowerCase().includes(q)
		);
	}, [items, costingByRfqItemId, search]);

	const quotedCount = costingByRfqItemId.size;
	const grandTotal = (costings ?? []).reduce((sum, c) => sum + c.totalCost, 0);

	// Pagination for quoted (costings table)
	const quotedTotalPages = Math.max(1, Math.ceil(filteredCostings.length / ITEMS_PER_PAGE));
	const safeQuotedPage = Math.min(quotedPage, quotedTotalPages - 1);
	const pagedCostings = filteredCostings.slice(safeQuotedPage * ITEMS_PER_PAGE, (safeQuotedPage + 1) * ITEMS_PER_PAGE);

	// Pagination for unquoted items
	const unquotedTotalPages = Math.max(1, Math.ceil(unquotedItems.length / ITEMS_PER_PAGE));
	const safeUnquotedPage = Math.min(unquotedPage, unquotedTotalPages - 1);
	const pagedUnquoted = unquotedItems.slice(safeUnquotedPage * ITEMS_PER_PAGE, (safeUnquotedPage + 1) * ITEMS_PER_PAGE);

	if (isLoading) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center py-8">
					<Loader2 className="h-5 w-5 animate-spin text-primary" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between text-lg">
					<span className="flex items-center gap-2">
						<IndianRupee className="h-5 w-5" />
						Costing Summary
					</span>
					<div className="flex items-center gap-3">
						{grandTotal > 0 && <span className="text-sm font-semibold">Grand Total: ₹{grandTotal.toFixed(2)}</span>}
						<Badge variant={quotedCount === items.length ? "success" : "warning"}>
							{quotedCount}/{items.length} items quoted
						</Badge>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Search */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						className="pl-9"
						onChange={e => {
							setSearch(e.target.value);
							setQuotedPage(0);
							setUnquotedPage(0);
						}}
						placeholder="Search by item code or item name..."
						value={search}
					/>
				</div>

				{/* Quoted items table */}
				{pagedCostings.length > 0 && (
					<>
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
										<TableHead className="text-center">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{pagedCostings.map(costing => {
										const rfqItem = typeof costing.rfqItem === "object" ? costing.rfqItem : null;
										const matchingLineItem = rfqItem ? items.find(li => li._id === rfqItem._id) : null;
										const parts = costing.parts ?? [];
										const hasParts = parts.length > 0;

										return hasParts ? (
											parts.map((part, pIdx) => (
												<TableRow key={`${costing._id}-${pIdx}`}>
													{pIdx === 0 && (
														<>
															<TableCell className="align-top font-semibold" rowSpan={parts.length}>
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
															<TableCell className="text-center align-top" rowSpan={parts.length}>
																{matchingLineItem && <CostingDialog lineItem={matchingLineItem} rfqId={rfqId} />}
															</TableCell>
														</>
													)}
												</TableRow>
											))
										) : (
											<TableRow key={costing._id}>
												<TableCell className="font-semibold">{rfqItem?.serialNumber || "—"}</TableCell>
												<TableCell className="font-medium">{rfqItem?.item?.itemName ?? rfqItem?.item?.itemCode ?? "—"}</TableCell>
												<TableCell colSpan={6} className="text-center text-xs text-muted-foreground">
													No parts
												</TableCell>
												<TableCell className="text-right">{costing.packingCost?.toFixed(2) ?? "0.00"}</TableCell>
												<TableCell className="text-right">{costing.shippingCost?.toFixed(2) ?? "0.00"}</TableCell>
												<TableCell className="text-right">{costing.sellingPrice.toFixed(2)}</TableCell>
												<TableCell className="text-right">{rfqItem?.quantity ?? "—"}</TableCell>
												<TableCell className="text-right font-semibold">{costing.totalCost.toFixed(2)}</TableCell>
												<TableCell className="text-center">{matchingLineItem && <CostingDialog lineItem={matchingLineItem} rfqId={rfqId} />}</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>

						{/* Quoted pagination */}
						{filteredCostings.length > ITEMS_PER_PAGE && (
							<div className="flex items-center justify-between rounded-lg border px-4 py-2">
								<span className="text-sm text-muted-foreground">
									Showing {safeQuotedPage * ITEMS_PER_PAGE + 1}–{Math.min((safeQuotedPage + 1) * ITEMS_PER_PAGE, filteredCostings.length)} of {filteredCostings.length} quoted items
								</span>
								<div className="flex items-center gap-2">
									<Button disabled={safeQuotedPage === 0} onClick={() => setQuotedPage(p => p - 1)} size="sm" variant="ghost">
										<ChevronLeft className="h-4 w-4" />
										Prev
									</Button>
									<span className="text-sm">
										{safeQuotedPage + 1} / {quotedTotalPages}
									</span>
									<Button disabled={safeQuotedPage >= quotedTotalPages - 1} onClick={() => setQuotedPage(p => p + 1)} size="sm" variant="ghost">
										Next
										<ChevronRight className="h-4 w-4" />
									</Button>
								</div>
							</div>
						)}
					</>
				)}

				{/* Items without costing yet */}
				{pagedUnquoted.length > 0 && (
					<div className="space-y-2">
						<h4 className="text-sm font-semibold text-muted-foreground">Items without costing ({unquotedItems.length})</h4>
						<div className="space-y-2">
							{pagedUnquoted.map(li => (
								<div key={li._id} className="flex items-center justify-between rounded-lg border px-4 py-3">
									<div className="flex items-center gap-3">
										<Badge className="flex h-7 min-w-7 items-center justify-center rounded-full px-1.5" variant="outline">
											{li.serialNumber || "—"}
										</Badge>
										<div>
											<p className="text-sm font-medium">{li.item?.itemName || "Unknown Item"}</p>
											<p className="text-xs text-muted-foreground">
												{li.item?.itemCode} &middot; Qty: {li.quantity} &middot; {li.item?.itemType || "UNIT"}
											</p>
										</div>
									</div>
									<CostingDialog lineItem={li} rfqId={rfqId} />
								</div>
							))}
						</div>

						{/* Unquoted pagination */}
						{unquotedItems.length > ITEMS_PER_PAGE && (
							<div className="flex items-center justify-between rounded-lg border px-4 py-2">
								<span className="text-sm text-muted-foreground">
									Showing {safeUnquotedPage * ITEMS_PER_PAGE + 1}–{Math.min((safeUnquotedPage + 1) * ITEMS_PER_PAGE, unquotedItems.length)} of {unquotedItems.length}
								</span>
								<div className="flex items-center gap-2">
									<Button disabled={safeUnquotedPage === 0} onClick={() => setUnquotedPage(p => p - 1)} size="sm" variant="ghost">
										<ChevronLeft className="h-4 w-4" />
										Prev
									</Button>
									<span className="text-sm">
										{safeUnquotedPage + 1} / {unquotedTotalPages}
									</span>
									<Button disabled={safeUnquotedPage >= unquotedTotalPages - 1} onClick={() => setUnquotedPage(p => p + 1)} size="sm" variant="ghost">
										Next
										<ChevronRight className="h-4 w-4" />
									</Button>
								</div>
							</div>
						)}
					</div>
				)}

				{pagedCostings.length === 0 && pagedUnquoted.length === 0 && (
					<p className="py-4 text-center text-sm text-muted-foreground">{search.trim() ? "No items match your search." : "No costings created yet."}</p>
				)}
			</CardContent>
		</Card>
	);
};

export default CostingSummary;
