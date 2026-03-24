"use client";
import { useMemo, useState } from "react";
import axios from "@config/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import {
	IndianRupee,
	Loader2,
	Search,
	ChevronLeft,
	ChevronRight,
	Download,
	FileSpreadsheet,
	History,
	Send,
	CheckCircle2,
	AlertCircle,
	Clock,
	FileText,
	ChevronDown,
	ChevronUp,
	Plus,
	Trash2,
	Check,
} from "lucide-react";
import CostingDialog from "./costing-dialog";

const ITEMS_PER_PAGE = 10;

// ── Status badge config (shared with TechOfferPanel pattern) ──
const STATUS_CONFIG: Record<CommercialOfferStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
	DRAFT: { label: "Draft", variant: "secondary", icon: FileText },
	SUBMITTED: { label: "Submitted", variant: "default", icon: Send },
	UNDER_REVIEW: { label: "Under Review", variant: "outline", icon: Clock },
	REVISION_REQUESTED: { label: "Revision Requested", variant: "destructive", icon: AlertCircle },
	APPROVED: { label: "Approved", variant: "default", icon: CheckCircle2 },
	SUPERSEDED: { label: "Superseded", variant: "secondary", icon: History },
};

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
		<div className="space-y-4">
			{/* ── Commercial Offer Version Panel ── */}
			<CommercialOfferPanel rfqId={rfqId} />

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
		</div>
	);
};

// ══════════════════════════════════════════════════════
// COMMERCIAL OFFER VERSION PANEL
// ══════════════════════════════════════════════════════

interface CommercialOfferPanelProps {
	rfqId: string;
}

const CommercialOfferPanel = ({ rfqId }: CommercialOfferPanelProps) => {
	const [downloadingPdf, setDownloadingPdf] = useState(false);
	const [downloadingExcel, setDownloadingExcel] = useState(false);

	const handleDownload = async (format: "pdf" | "excel", offerId?: string) => {
		const setter = format === "pdf" ? setDownloadingPdf : setDownloadingExcel;
		setter(true);
		try {
			const url = offerId ? `/api/v1/commercial-offer/${rfqId}/${format}?offerId=${offerId}` : `/api/v1/commercial-offer/${rfqId}/${format}`;
			const response = await axios.get(url, { responseType: "blob" });
			const blob = new Blob([response.data]);
			const blobUrl = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = blobUrl;
			a.download = `Commercial_Offer.${format === "pdf" ? "pdf" : "xlsx"}`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(blobUrl);
			toast.success(`Commercial offer ${format.toUpperCase()} downloaded`);
		} catch {
			toast.error(`Failed to download ${format.toUpperCase()}`);
		} finally {
			setter(false);
		}
	};

	const queryClient = useQueryClient();
	const [showHistory, setShowHistory] = useState(false);
	const [reviewingOffer, setReviewingOffer] = useState<string | null>(null);
	const [reviewAction, setReviewAction] = useState<"approve" | "request_revision">("approve");
	const [reviewRemarks, setReviewRemarks] = useState("");
	const [approvedBy, setApprovedBy] = useState("");
	const [changeRequests, setChangeRequests] = useState<{ itemCode: string; field: string; currentValue: string; requestedValue: string; notes: string }[]>([]);

	// Fetch version history
	const { data: offers = [], isLoading } = useQuery<CommercialOffer[]>({
		queryKey: ["commercial-offer-history", rfqId],
		queryFn: async () => {
			const response = await axios.get(`/api/v1/commercial-offer/${rfqId}/history`);
			return response?.data?.data ?? [];
		},
	});

	// Latest non-superseded offer
	const activeOffer = offers.find(o => o.status !== "SUPERSEDED");

	// Generate new version
	const { mutate: generate, isPending: isGenerating } = useMutation({
		mutationFn: async () => {
			const response = await axios.post(`/api/v1/commercial-offer/${rfqId}/generate`);
			return response?.data;
		},
		onSuccess: () => {
			toast.success("New commercial offer version generated");
			queryClient.invalidateQueries({ queryKey: ["commercial-offer-history", rfqId] });
			queryClient.invalidateQueries({ queryKey: ["rfq", rfqId] });
		},
		onError: () => toast.error("Failed to generate commercial offer"),
	});

	// Submit offer
	const { mutate: submitOffer, isPending: isSubmitting } = useMutation({
		mutationFn: async (offerId: string) => {
			const response = await axios.patch(`/api/v1/commercial-offer/offer/${offerId}/submit`);
			return response?.data;
		},
		onSuccess: () => {
			toast.success("Commercial offer submitted");
			queryClient.invalidateQueries({ queryKey: ["commercial-offer-history", rfqId] });
		},
		onError: () => toast.error("Failed to submit"),
	});

	// Review offer (approve / request revision)
	const { mutate: reviewOffer, isPending: isReviewing } = useMutation({
		mutationFn: async ({ offerId, body }: { offerId: string; body: Record<string, unknown> }) => {
			const response = await axios.patch(`/api/v1/commercial-offer/offer/${offerId}/review`, body);
			return response?.data;
		},
		onSuccess: () => {
			toast.success("Review submitted");
			setReviewingOffer(null);
			setReviewRemarks("");
			setApprovedBy("");
			setChangeRequests([]);
			queryClient.invalidateQueries({ queryKey: ["commercial-offer-history", rfqId] });
		},
		onError: () => toast.error("Failed to submit review"),
	});

	// Resolve change request
	const { mutate: resolveChangeReq } = useMutation({
		mutationFn: async ({ offerId, crId }: { offerId: string; crId: string }) => {
			const response = await axios.patch(`/api/v1/commercial-offer/offer/${offerId}/change-request/${crId}/resolve`);
			return response?.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["commercial-offer-history", rfqId] });
		},
		onError: () => toast.error("Failed to resolve change request"),
	});

	const handleSubmitReview = (offerId: string) => {
		const body: Record<string, unknown> = {
			action: reviewAction,
			reviewRemarks,
		};
		if (reviewAction === "approve") {
			body.approvedBy = approvedBy;
		} else {
			body.changeRequests = changeRequests.map(cr => ({ ...cr, resolved: false }));
		}
		reviewOffer({ offerId, body });
	};

	const addChangeRequest = () => {
		setChangeRequests(prev => [...prev, { itemCode: "", field: "", currentValue: "", requestedValue: "", notes: "" }]);
	};

	const updateChangeRequest = (idx: number, field: string, value: string) => {
		setChangeRequests(prev => prev.map((cr, i) => (i === idx ? { ...cr, [field]: value } : cr)));
	};

	const removeChangeRequest = (idx: number) => {
		setChangeRequests(prev => prev.filter((_, i) => i !== idx));
	};

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center justify-between text-base">
					<div className="flex items-center gap-2">
						<History className="h-4 w-4" />
						Commercial Offer
						{activeOffer && (
							<>
								<Badge variant={STATUS_CONFIG[activeOffer.status].variant} className="ml-2 text-xs">
									{STATUS_CONFIG[activeOffer.status].label}
								</Badge>
								<span className="text-sm font-normal text-muted-foreground">v{activeOffer.version}</span>
							</>
						)}
						{!activeOffer && offers.length === 0 && <span className="text-sm font-normal text-muted-foreground">No versions yet</span>}
					</div>
					<div className="flex items-center gap-2">
						{activeOffer?.status === "DRAFT" && (
							<Button disabled={isSubmitting} onClick={() => submitOffer(activeOffer._id)} size="sm" variant="outline">
								<Send className="mr-2 h-3 w-3" />
								{isSubmitting ? "Submitting..." : "Mark Submitted"}
							</Button>
						)}
						{activeOffer && ["SUBMITTED", "UNDER_REVIEW"].includes(activeOffer.status) && (
							<Button
								onClick={() => {
									setReviewingOffer(reviewingOffer === activeOffer._id ? null : activeOffer._id);
									setReviewAction("approve");
								}}
								size="sm"
								variant="outline"
							>
								<CheckCircle2 className="mr-2 h-3 w-3" />
								Review
							</Button>
						)}
						<Button disabled={isGenerating} onClick={() => generate()} size="sm">
							<Plus className="mr-2 h-3 w-3" />
							{isGenerating ? "Generating..." : offers.length === 0 ? "Generate Offer" : "New Version"}
						</Button>
						{offers.length > 0 && (
							<Button onClick={() => setShowHistory(!showHistory)} size="sm" variant="ghost">
								{showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
							</Button>
						)}
					</div>
				</CardTitle>
			</CardHeader>

			{/* Active offer change requests */}
			{activeOffer?.status === "REVISION_REQUESTED" && activeOffer.changeRequests.length > 0 && (
				<CardContent className="pt-0">
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
						<h5 className="mb-2 text-sm font-semibold text-destructive">Change Requests</h5>
						{activeOffer.reviewRemarks && <p className="mb-3 text-sm italic text-muted-foreground">&quot;{activeOffer.reviewRemarks}&quot;</p>}
						<div className="space-y-2">
							{activeOffer.changeRequests.map(cr => (
								<div key={cr._id} className={`flex items-start gap-3 rounded-md border p-2 text-sm ${cr.resolved ? "border-green-200 bg-green-50" : "bg-white"}`}>
									<div className="flex-1">
										<span className="font-medium">{cr.itemCode}</span> — <span className="text-muted-foreground">{cr.field}</span>
										<div className="mt-1 text-xs">
											<span className="text-red-600 line-through">{cr.currentValue}</span> → <span className="font-medium text-green-700">{cr.requestedValue}</span>
										</div>
										{cr.notes && <p className="mt-1 text-xs text-muted-foreground">{cr.notes}</p>}
									</div>
									{!cr.resolved ? (
										<Button className="h-7 shrink-0" onClick={() => resolveChangeReq({ offerId: activeOffer._id, crId: cr._id })} size="sm" variant="outline">
											<Check className="mr-1 h-3 w-3" />
											Resolve
										</Button>
									) : (
										<Badge className="shrink-0 text-xs" variant="outline">
											Resolved
										</Badge>
									)}
								</div>
							))}
						</div>
						{activeOffer.changeRequests.every(cr => cr.resolved) && <p className="mt-3 text-sm text-green-700">All changes resolved. You can now generate a new version.</p>}
					</div>
				</CardContent>
			)}

			{/* Review form */}
			{reviewingOffer && (
				<CardContent className="pt-0">
					<div className="rounded-lg border bg-muted/30 p-4">
						<h5 className="mb-3 text-sm font-semibold">Review Commercial Offer</h5>
						<div className="mb-3 flex gap-3">
							<Button onClick={() => setReviewAction("approve")} size="sm" variant={reviewAction === "approve" ? "default" : "outline"}>
								<CheckCircle2 className="mr-2 h-3 w-3" />
								Approve
							</Button>
							<Button onClick={() => setReviewAction("request_revision")} size="sm" variant={reviewAction === "request_revision" ? "destructive" : "outline"}>
								<AlertCircle className="mr-2 h-3 w-3" />
								Request Revision
							</Button>
						</div>

						<div className="mb-3">
							<label className="mb-1 block text-xs font-medium">Review Remarks</label>
							<Textarea onChange={e => setReviewRemarks(e.target.value)} placeholder="Comments about this commercial offer..." rows={2} value={reviewRemarks} />
						</div>

						{reviewAction === "approve" && (
							<div className="mb-3">
								<label className="mb-1 block text-xs font-medium">Approved By</label>
								<Input onChange={e => setApprovedBy(e.target.value)} placeholder="Client contact name" value={approvedBy} />
							</div>
						)}

						{reviewAction === "request_revision" && (
							<div className="mb-3">
								<div className="mb-2 flex items-center justify-between">
									<label className="text-xs font-medium">Change Requests</label>
									<Button onClick={addChangeRequest} size="sm" type="button" variant="outline">
										<Plus className="mr-1 h-3 w-3" />
										Add
									</Button>
								</div>
								{changeRequests.length === 0 && <p className="text-sm text-muted-foreground">No change requests added. Add specific changes the client requested.</p>}
								<div className="space-y-3">
									{changeRequests.map((cr, idx) => (
										<div className="rounded-md border bg-white p-3" key={idx}>
											<div className="mb-2 flex items-center justify-between">
												<span className="text-xs font-medium">Change #{idx + 1}</span>
												<Button className="h-6 w-6" onClick={() => removeChangeRequest(idx)} size="icon" type="button" variant="ghost">
													<Trash2 className="h-3 w-3 text-destructive" />
												</Button>
											</div>
											<div className="grid grid-cols-2 gap-2">
												<div>
													<label className="mb-1 block text-[10px] text-muted-foreground">Item Code</label>
													<Input className="h-8 text-sm" onChange={e => updateChangeRequest(idx, "itemCode", e.target.value)} value={cr.itemCode} />
												</div>
												<div>
													<label className="mb-1 block text-[10px] text-muted-foreground">Field</label>
													<Input className="h-8 text-sm" onChange={e => updateChangeRequest(idx, "field", e.target.value)} placeholder="e.g. sellingPrice" value={cr.field} />
												</div>
												<div>
													<label className="mb-1 block text-[10px] text-muted-foreground">Current Value</label>
													<Input className="h-8 text-sm" onChange={e => updateChangeRequest(idx, "currentValue", e.target.value)} value={cr.currentValue} />
												</div>
												<div>
													<label className="mb-1 block text-[10px] text-muted-foreground">Requested Value</label>
													<Input className="h-8 text-sm" onChange={e => updateChangeRequest(idx, "requestedValue", e.target.value)} value={cr.requestedValue} />
												</div>
											</div>
											<div className="mt-2">
												<label className="mb-1 block text-[10px] text-muted-foreground">Notes</label>
												<Input className="h-8 text-sm" onChange={e => updateChangeRequest(idx, "notes", e.target.value)} placeholder="Optional notes" value={cr.notes} />
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						<div className="flex justify-end gap-2">
							<Button
								onClick={() => {
									setReviewingOffer(null);
									setReviewRemarks("");
									setChangeRequests([]);
								}}
								size="sm"
								variant="outline"
							>
								Cancel
							</Button>
							<Button disabled={isReviewing} onClick={() => handleSubmitReview(reviewingOffer)} size="sm" variant={reviewAction === "approve" ? "default" : "destructive"}>
								{isReviewing ? "Submitting..." : reviewAction === "approve" ? "Approve" : "Request Revision"}
							</Button>
						</div>
					</div>
				</CardContent>
			)}

			{/* Version history */}
			{showHistory && (
				<CardContent className="pt-0">
					{isLoading ? (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Loader2 className="h-4 w-4 animate-spin" />
							Loading history...
						</div>
					) : offers.length === 0 ? (
						<p className="text-sm text-muted-foreground">No versions generated yet.</p>
					) : (
						<div className="space-y-2">
							{offers.map(offer => {
								const config = STATUS_CONFIG[offer.status];
								const StatusIcon = config.icon;
								return (
									<div className={`flex items-center justify-between rounded-lg border p-3 ${offer.status === "APPROVED" ? "border-green-200 bg-green-50/50" : ""}`} key={offer._id}>
										<div className="flex items-center gap-3">
											<StatusIcon className="h-4 w-4 text-muted-foreground" />
											<div>
												<div className="flex items-center gap-2">
													<span className="text-sm font-medium">v{offer.version}</span>
													<Badge className="text-xs" variant={config.variant}>
														{config.label}
													</Badge>
												</div>
												<p className="text-xs text-muted-foreground">
													{new Date(offer.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
													{offer.snapshot.items.length > 0 && ` — ${offer.snapshot.items.length} items, ₹${offer.snapshot.grandTotalWithGst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
												</p>
												{offer.approvedBy && <p className="text-xs text-green-700">Approved by: {offer.approvedBy}</p>}
												{offer.reviewRemarks && offer.status === "REVISION_REQUESTED" && <p className="mt-1 text-xs italic text-destructive">&quot;{offer.reviewRemarks}&quot;</p>}
											</div>
										</div>
										<div className="flex items-center gap-1">
											<Button disabled={downloadingPdf} onClick={() => handleDownload("pdf", offer._id)} size="sm" title="Download PDF" variant="ghost">
												<Download className="h-3 w-3" />
											</Button>
											<Button disabled={downloadingExcel} onClick={() => handleDownload("excel", offer._id)} size="sm" title="Download Excel" variant="ghost">
												<FileSpreadsheet className="h-3 w-3" />
											</Button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			)}
		</Card>
	);
};

export default CostingSummary;
