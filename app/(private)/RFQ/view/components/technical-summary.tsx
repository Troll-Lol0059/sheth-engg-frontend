"use client";
import { useMemo, useState } from "react";
import axios from "@config/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Separator } from "@components/ui/separator";
import { Textarea } from "@components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@components/ui/form";
import { Wrench, Pencil, Save, X, Plus, Trash2, Search, ChevronLeft, ChevronRight, Download, FileSpreadsheet, Loader2, History, Send, CheckCircle2, AlertCircle, Clock, FileText, ChevronDown, ChevronUp, Check, GitCompareArrows } from "lucide-react";
import { LineItemSchema, BomSchema } from "@schemas/rfq";
import RegretItemDialog from "./regret-item-dialog";
import type { LineItemFormValues, BomFormValues } from "@schemas/rfq";

const ITEMS_PER_PAGE = 10;

interface TechnicalSummaryProps {
	items: RfqLineItem[];
	rfqId: string;
}

const updateRfqItemApi = async (rfqItemId: string, data: Record<string, unknown>) => {
	const response = await axios.put(`/api/v1/rfqItem/${rfqItemId}`, data);
	return response?.data;
};

// ── Status badge colors ──
const STATUS_CONFIG: Record<TechOfferStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
	DRAFT: { label: "Draft", variant: "secondary", icon: FileText },
	SUBMITTED: { label: "Submitted", variant: "default", icon: Send },
	UNDER_REVIEW: { label: "Under Review", variant: "outline", icon: Clock },
	REVISION_REQUESTED: { label: "Revision Requested", variant: "destructive", icon: AlertCircle },
	APPROVED: { label: "Approved", variant: "default", icon: CheckCircle2 },
	SUPERSEDED: { label: "Superseded", variant: "secondary", icon: History },
};

// ══════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════

const TechnicalSummary = ({ items, rfqId }: TechnicalSummaryProps) => {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);

	const filtered = useMemo(() => {
		if (!search.trim()) return items;
		const q = search.toLowerCase();
		return items.filter(li => (li.serialNumber ?? "").toLowerCase().includes(q) || (li.item?.itemName ?? "").toLowerCase().includes(q) || (li.item?.itemCode ?? "").toLowerCase().includes(q) || (li.item?.itemDesc ?? "").toLowerCase().includes(q));
	}, [items, search]);

	const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
	const safePage = Math.min(page, totalPages - 1);
	const paged = filtered.slice(safePage * ITEMS_PER_PAGE, (safePage + 1) * ITEMS_PER_PAGE);

	if (!items || items.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Technical Summary</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">No line items found.</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			{/* ── Technical Offer Version Panel ── */}
			<TechOfferPanel rfqId={rfqId} />

			{/* Search */}
			<div className="relative">
				<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
				<Input
					className="pl-9"
					onChange={e => {
						setSearch(e.target.value);
						setPage(0);
					}}
					placeholder="Search by item code or item name..."
					value={search}
				/>
			</div>

			{paged.length === 0 ? <p className="text-muted-foreground py-4 text-center text-sm">No items match your search.</p> : paged.map(lineItem => <TechItemCard key={lineItem._id} lineItem={lineItem} rfqId={rfqId} />)}

			{/* Pagination */}
			{filtered.length > ITEMS_PER_PAGE && (
				<div className="flex items-center justify-between rounded-lg border px-4 py-2">
					<span className="text-muted-foreground text-sm">
						Showing {safePage * ITEMS_PER_PAGE + 1}–{Math.min((safePage + 1) * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
					</span>
					<div className="flex items-center gap-2">
						<Button disabled={safePage === 0} onClick={() => setPage(p => p - 1)} size="sm" variant="ghost">
							<ChevronLeft className="h-4 w-4" />
							Prev
						</Button>
						<span className="text-sm">
							{safePage + 1} / {totalPages}
						</span>
						<Button disabled={safePage >= totalPages - 1} onClick={() => setPage(p => p + 1)} size="sm" variant="ghost">
							Next
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};

// ══════════════════════════════════════════════════════
// TECH OFFER VERSION PANEL
// ══════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════
// TECH OFFER DIFF COMPONENT
// ══════════════════════════════════════════════════════

interface TechOfferDiffProps {
	offerA: TechnicalOffer;
	offerB: TechnicalOffer;
}

const TechOfferDiff = ({ offerA, offerB }: TechOfferDiffProps) => {
	// offerA is older, offerB is newer (by version number)
	const [older, newer] = offerA.version < offerB.version ? [offerA, offerB] : [offerB, offerA];

	// Build a map of items by itemCode for comparison
	const olderItems = new Map(older.snapshot.items.map(i => [i.itemCode, i]));
	const newerItems = new Map(newer.snapshot.items.map(i => [i.itemCode, i]));
	const allCodes = [...new Set([...olderItems.keys(), ...newerItems.keys()])];

	const diffFields = (a: Record<string, unknown>, b: Record<string, unknown>, fields: string[]) => {
		return fields.filter(f => JSON.stringify(a[f]) !== JSON.stringify(b[f]));
	};

	const ITEM_FIELDS = ["material", "grade", "quantity", "remarks", "itemName", "itemDesc", "hardness", "drawingNumber", "bom"];

	const formatDiffValue = (field: string, value: unknown): string => {
		if (value === null || value === undefined || value === "") return "—";
		if (field === "hardness" && Array.isArray(value)) {
			if (value.length === 0) return "—";
			return value.map((h: { hardnessType?: string; value?: string; measurement?: string }) => `${h.hardnessType}: ${h.value} ${h.measurement}`).join(", ");
		}
		if (field === "bom" && Array.isArray(value)) {
			if (value.length === 0) return "—";
			return value.map((b: { quantity?: number; partName?: string }) => `${b.quantity} ${b.partName}`).join(" + ");
		}
		return String(value);
	};

	return (
		<div className="bg-muted/20 mt-3 rounded-lg border p-4">
			<div className="mb-3 flex items-center justify-between">
				<h5 className="text-sm font-semibold">
					Version Comparison: v{older.version} &rarr; v{newer.version}
				</h5>
			</div>
			{allCodes.length === 0 ? (
				<p className="text-muted-foreground text-sm">No items to compare.</p>
			) : (
				<div className="space-y-2">
					{allCodes
						.map(code => {
							const oldItem = olderItems.get(code);
							const newItem = newerItems.get(code);

							if (!oldItem) {
								return (
									<div key={code} className="rounded-md border border-green-200 bg-green-50 p-2 text-sm">
										<span className="font-medium text-green-700">+ Added:</span> {code} &mdash; {newItem?.itemName}
									</div>
								);
							}
							if (!newItem) {
								return (
									<div key={code} className="rounded-md border border-red-200 bg-red-50 p-2 text-sm">
										<span className="font-medium text-red-700">&minus; Removed:</span> {code} &mdash; {oldItem.itemName}
									</div>
								);
							}

							const changed = diffFields(oldItem as unknown as Record<string, unknown>, newItem as unknown as Record<string, unknown>, ITEM_FIELDS);
							if (changed.length === 0) return null;

							return (
								<div key={code} className="rounded-md border border-amber-200 bg-amber-50 p-2 text-sm">
									<span className="font-medium">{code}</span> &mdash; {newItem.itemName}
									<div className="mt-1 space-y-1">
										{changed.map(field => (
											<div key={field} className="ml-4 text-xs">
												<span className="text-muted-foreground">{field}:</span> <span className="text-red-600 line-through">{formatDiffValue(field, (oldItem as unknown as Record<string, unknown>)[field])}</span>
												{" \u2192 "}
												<span className="font-medium text-green-700">{formatDiffValue(field, (newItem as unknown as Record<string, unknown>)[field])}</span>
											</div>
										))}
									</div>
								</div>
							);
						})
						.filter(Boolean)}
					{allCodes.every(code => {
						const o = olderItems.get(code);
						const n = newerItems.get(code);
						if (!o || !n) return false;
						return diffFields(o as unknown as Record<string, unknown>, n as unknown as Record<string, unknown>, ITEM_FIELDS).length === 0;
					}) && <p className="text-muted-foreground text-sm">No differences found between these versions.</p>}
				</div>
			)}
		</div>
	);
};

interface TechOfferPanelProps {
	rfqId: string;
}

const TechOfferPanel = ({ rfqId }: TechOfferPanelProps) => {
	const [downloadingPdf, setDownloadingPdf] = useState(false);
	const [downloadingExcel, setDownloadingExcel] = useState(false);

	const handleDownload = async (format: "pdf" | "excel", offerId?: string) => {
		const setter = format === "pdf" ? setDownloadingPdf : setDownloadingExcel;
		setter(true);
		try {
			const url = offerId ? `/api/v1/technical-offer/${rfqId}/${format}?offerId=${offerId}` : `/api/v1/technical-offer/${rfqId}/${format}`;
			const response = await axios.get(url, { responseType: "blob" });
			const disposition = response.headers["content-disposition"] ?? "";
			const starMatch = disposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/);
			const plainMatch = disposition.match(/filename="?([^";\n]+)"?/);
			const downloadName = starMatch?.[1] ? decodeURIComponent(starMatch[1]) : plainMatch?.[1] ?? `Technical_Offer.${format === "pdf" ? "pdf" : "xlsx"}`;
			const blob = new Blob([response.data]);
			const blobUrl = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = blobUrl;
			a.download = downloadName;
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(blobUrl);
			toast.success(`Technical offer ${format.toUpperCase()} downloaded`);
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
	const [diffVersions, setDiffVersions] = useState<[string | null, string | null]>([null, null]);

	const toggleDiff = (offerId: string) => {
		setDiffVersions(prev => {
			if (prev[0] === offerId) return [null, prev[1]];
			if (prev[1] === offerId) return [prev[0], null];
			if (!prev[0]) return [offerId, prev[1]];
			return [prev[0], offerId];
		});
	};

	// Fetch version history
	const { data: offers = [], isLoading } = useQuery<TechnicalOffer[]>({
		queryKey: ["tech-offer-history", rfqId],
		queryFn: async () => {
			const response = await axios.get(`/api/v1/technical-offer/${rfqId}/history`);
			return response?.data?.data ?? [];
		},
	});

	// Latest non-superseded offer
	const activeOffer = offers.find(o => o.status !== "SUPERSEDED");

	// Generate new version
	const { mutate: generate, isPending: isGenerating } = useMutation({
		mutationFn: async () => {
			const response = await axios.post(`/api/v1/technical-offer/${rfqId}/generate`);
			return response?.data;
		},
		onSuccess: () => {
			toast.success("New technical offer version generated");
			queryClient.invalidateQueries({ queryKey: ["tech-offer-history", rfqId] });
			queryClient.invalidateQueries({ queryKey: ["rfq", rfqId] });
		},
		onError: () => toast.error("Failed to generate technical offer"),
	});

	// Submit offer
	const { mutate: submitOffer, isPending: isSubmitting } = useMutation({
		mutationFn: async (offerId: string) => {
			const response = await axios.patch(`/api/v1/technical-offer/offer/${offerId}/submit`);
			return response?.data;
		},
		onSuccess: () => {
			toast.success("Technical offer submitted");
			queryClient.invalidateQueries({ queryKey: ["tech-offer-history", rfqId] });
		},
		onError: () => toast.error("Failed to submit"),
	});

	// Review offer (approve / request revision)
	const { mutate: reviewOffer, isPending: isReviewing } = useMutation({
		mutationFn: async ({ offerId, body }: { offerId: string; body: Record<string, unknown> }) => {
			const response = await axios.patch(`/api/v1/technical-offer/offer/${offerId}/review`, body);
			return response?.data;
		},
		onSuccess: () => {
			toast.success("Review submitted");
			setReviewingOffer(null);
			setReviewRemarks("");
			setApprovedBy("");
			setChangeRequests([]);
			queryClient.invalidateQueries({ queryKey: ["tech-offer-history", rfqId] });
		},
		onError: () => toast.error("Failed to submit review"),
	});

	// Resolve change request
	const { mutate: resolveChangeReq } = useMutation({
		mutationFn: async ({ offerId, crId }: { offerId: string; crId: string }) => {
			const response = await axios.patch(`/api/v1/technical-offer/offer/${offerId}/change-request/${crId}/resolve`);
			return response?.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tech-offer-history", rfqId] });
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
						Technical Offer
						{activeOffer && (
							<>
								<Badge variant={STATUS_CONFIG[activeOffer.status].variant} className="ml-2 text-xs">
									{STATUS_CONFIG[activeOffer.status].label}
								</Badge>
								<span className="text-muted-foreground text-sm font-normal">v{activeOffer.version}</span>
							</>
						)}
						{!activeOffer && offers.length === 0 && <span className="text-muted-foreground text-sm font-normal">No versions yet</span>}
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
					<div className="border-destructive/30 bg-destructive/5 rounded-lg border p-3">
						<h5 className="text-destructive mb-2 text-sm font-semibold">Change Requests</h5>
						{activeOffer.reviewRemarks && <p className="text-muted-foreground mb-3 text-sm italic">&quot;{activeOffer.reviewRemarks}&quot;</p>}
						<div className="space-y-2">
							{activeOffer.changeRequests.map(cr => (
								<div key={cr._id} className={`flex items-start gap-3 rounded-md border p-2 text-sm ${cr.resolved ? "border-green-200 bg-green-50" : "bg-white"}`}>
									<div className="flex-1">
										<span className="font-medium">{cr.itemCode}</span> — <span className="text-muted-foreground">{cr.field}</span>
										<div className="mt-1 text-xs">
											<span className="text-red-600 line-through">{cr.currentValue}</span> → <span className="font-medium text-green-700">{cr.requestedValue}</span>
										</div>
										{cr.notes && <p className="text-muted-foreground mt-1 text-xs">{cr.notes}</p>}
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
					<div className="bg-muted/30 rounded-lg border p-4">
						<h5 className="mb-3 text-sm font-semibold">Review Technical Offer</h5>
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
							<Textarea onChange={e => setReviewRemarks(e.target.value)} placeholder="Comments about this technical offer..." rows={2} value={reviewRemarks} />
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
								{changeRequests.length === 0 && <p className="text-muted-foreground text-sm">No change requests added. Add specific changes the client requested.</p>}
								<div className="space-y-3">
									{changeRequests.map((cr, idx) => (
										<div className="rounded-md border bg-white p-3" key={idx}>
											<div className="mb-2 flex items-center justify-between">
												<span className="text-xs font-medium">Change #{idx + 1}</span>
												<Button className="h-6 w-6" onClick={() => removeChangeRequest(idx)} size="icon" type="button" variant="ghost">
													<Trash2 className="text-destructive h-3 w-3" />
												</Button>
											</div>
											<div className="grid grid-cols-2 gap-2">
												<div>
													<label className="text-muted-foreground mb-1 block text-[10px]">Item Code</label>
													<Input className="h-8 text-sm" onChange={e => updateChangeRequest(idx, "itemCode", e.target.value)} value={cr.itemCode} />
												</div>
												<div>
													<label className="text-muted-foreground mb-1 block text-[10px]">Field</label>
													<Input className="h-8 text-sm" onChange={e => updateChangeRequest(idx, "field", e.target.value)} placeholder="e.g. material" value={cr.field} />
												</div>
												<div>
													<label className="text-muted-foreground mb-1 block text-[10px]">Current Value</label>
													<Input className="h-8 text-sm" onChange={e => updateChangeRequest(idx, "currentValue", e.target.value)} value={cr.currentValue} />
												</div>
												<div>
													<label className="text-muted-foreground mb-1 block text-[10px]">Requested Value</label>
													<Input className="h-8 text-sm" onChange={e => updateChangeRequest(idx, "requestedValue", e.target.value)} value={cr.requestedValue} />
												</div>
											</div>
											<div className="mt-2">
												<label className="text-muted-foreground mb-1 block text-[10px]">Notes</label>
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
						<div className="text-muted-foreground flex items-center gap-2 text-sm">
							<Loader2 className="h-4 w-4 animate-spin" />
							Loading history...
						</div>
					) : offers.length === 0 ? (
						<p className="text-muted-foreground text-sm">No versions generated yet.</p>
					) : (
						<div className="space-y-2">
							{offers.map(offer => {
								const config = STATUS_CONFIG[offer.status];
								const StatusIcon = config.icon;
								return (
									<div className={`flex items-center justify-between rounded-lg border p-3 ${offer.status === "APPROVED" ? "border-green-200 bg-green-50/50" : ""}`} key={offer._id}>
										<div className="flex items-center gap-3">
											<StatusIcon className="text-muted-foreground h-4 w-4" />
											<div>
												<div className="flex items-center gap-2">
													<span className="text-sm font-medium">v{offer.version}</span>
													<Badge className="text-xs" variant={config.variant}>
														{config.label}
													</Badge>
												</div>
												<p className="text-muted-foreground text-xs">
													{new Date(offer.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
													{offer.snapshot.items.length > 0 && ` — ${offer.snapshot.items.length} items`}
												</p>
												{offer.approvedBy && <p className="text-xs text-green-700">Approved by: {offer.approvedBy}</p>}
												{offer.reviewRemarks && offer.status === "REVISION_REQUESTED" && <p className="text-destructive mt-1 text-xs italic">&quot;{offer.reviewRemarks}&quot;</p>}
											</div>
										</div>
										<div className="flex items-center gap-1">
											<Button disabled={downloadingPdf} onClick={() => handleDownload("pdf", offer._id)} size="sm" title="Download PDF" variant="ghost">
												<Download className="h-3 w-3" />
											</Button>
											<Button disabled={downloadingExcel} onClick={() => handleDownload("excel", offer._id)} size="sm" title="Download Excel" variant="ghost">
												<FileSpreadsheet className="h-3 w-3" />
											</Button>
											<Button
												onClick={() => toggleDiff(offer._id)}
												size="sm"
												title="Compare versions"
												variant={diffVersions.includes(offer._id) ? "default" : "ghost"}
												className={diffVersions.includes(offer._id) ? "h-8 w-8" : ""}
											>
												<GitCompareArrows className="h-3 w-3" />
											</Button>
										</div>
									</div>
								);
							})}
							{diffVersions[0] &&
								diffVersions[1] &&
								(() => {
									const a = offers.find(o => o._id === diffVersions[0]);
									const b = offers.find(o => o._id === diffVersions[1]);
									if (a && b) return <TechOfferDiff offerA={a} offerB={b} />;
									return null;
								})()}
						</div>
					)}
				</CardContent>
			)}
		</Card>
	);
};

// ══════════════════════════════════════════════════════
// TECH ITEM CARD (existing — unchanged)
// ══════════════════════════════════════════════════════

interface TechItemCardProps {
	lineItem: RfqLineItem;
	rfqId: string;
}

const TechItemCard = ({ lineItem, rfqId }: TechItemCardProps) => {
	const queryClient = useQueryClient();
	const [isEditing, setIsEditing] = useState(false);

	const item = lineItem.item;
	const isSetOrAssembly = item?.itemType === "SET" || item?.itemType === "ASSEMBLY";
	const bom = item?.bom ?? [];
	const techSpecs = lineItem.itemTechSpecs;

	// ── Master data for hardness dropdowns ──
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

	// ── Form: Line Item Tech Specs (UNIT items) ──
	const lineItemForm = useForm<LineItemFormValues>({
		resolver: zodResolver(LineItemSchema),
		defaultValues: {
			quantity: lineItem.quantity,
			drawingNumber: lineItem.drawingNumber ?? "",
			itemTechSpecs: {
				material: techSpecs?.material ?? "",
				diameter: techSpecs?.diameter ?? "",
				length: techSpecs?.length ?? "",
				weight: techSpecs?.weight ?? "",
				grade: techSpecs?.grade ?? "",
				remarks: techSpecs?.remarks ?? "",
				hardness: (techSpecs?.hardness ?? []).map(h => ({
					hardnessType: h.hardnessType,
					value: h.value,
					measurement: h.measurement,
				})),
			},
		},
	});

	const {
		fields: hardnessFields,
		append: appendHardness,
		remove: removeHardness,
	} = useFieldArray({
		control: lineItemForm.control,
		name: "itemTechSpecs.hardness",
	});

	const { mutate: saveTechSpecs, isPending: isSavingTechSpecs } = useMutation({
		mutationFn: (values: LineItemFormValues) =>
			updateRfqItemApi(lineItem._id, {
				quantity: values.quantity,
				drawingNumber: values.drawingNumber,
				itemTechSpecs: values.itemTechSpecs,
			}),
		onSuccess: () => {
			toast.success("Technical specs updated");
			queryClient.invalidateQueries({ queryKey: ["rfq", rfqId] });
			setIsEditing(false);
		},
		onError: () => {
			toast.error("Failed to update technical specs");
		},
	});

	// ── Form: BOM (SET/ASSEMBLY items) ──
	const bomForm = useForm<BomFormValues>({
		resolver: zodResolver(BomSchema),
		defaultValues: {
			bom: bom.map(b => ({
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

	const {
		fields: bomFields,
		append: appendBom,
		remove: removeBom,
	} = useFieldArray({
		control: bomForm.control,
		name: "bom",
	});

	const calcBomWeight = (bomIdx: number) => {
		const dia = parseFloat(bomForm.getValues(`bom.${bomIdx}.diameter`) || "0") || 0;
		const len = parseFloat(bomForm.getValues(`bom.${bomIdx}.length`) || "0") || 0;
		const den = parseFloat(bomForm.getValues(`bom.${bomIdx}.density`) || "7.85") || 7.85;
		if (dia > 0 && len > 0) {
			const w = (Math.PI * Math.pow(dia / 2, 2) * len * den) / 1_000_000;
			bomForm.setValue(`bom.${bomIdx}.weight`, w.toFixed(4));
		}
	};

	const { mutate: saveBom, isPending: isSavingBom } = useMutation({
		mutationFn: async (values: BomFormValues) => {
			const response = await axios.put(`/api/v1/item?itemCode=${item?.itemCode}`, { bom: values.bom });
			return response?.data;
		},
		onSuccess: () => {
			toast.success("BOM saved successfully");
			queryClient.invalidateQueries({ queryKey: ["rfq", rfqId] });
			setIsEditing(false);
		},
		onError: () => {
			toast.error("Failed to save BOM");
		},
	});

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

	const handleCancel = () => {
		lineItemForm.reset({
			quantity: lineItem.quantity,
			drawingNumber: lineItem.drawingNumber ?? "",
			itemTechSpecs: {
				material: techSpecs?.material ?? "",
				diameter: techSpecs?.diameter ?? "",
				length: techSpecs?.length ?? "",
				weight: techSpecs?.weight ?? "",
				grade: techSpecs?.grade ?? "",
				remarks: techSpecs?.remarks ?? "",
				hardness: (techSpecs?.hardness ?? []).map(h => ({
					hardnessType: h.hardnessType,
					value: h.value,
					measurement: h.measurement,
				})),
			},
		});
		bomForm.reset({
			bom: bom.map(b => ({
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
		<Card className={lineItem.isRegret ? "border-destructive/40 border-l-4" : ""}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-base">
					<Badge className="flex h-7 min-w-7 items-center justify-center rounded-full px-1.5" variant={lineItem.isRegret ? "destructive" : "outline"}>
						{lineItem.serialNumber || "—"}
					</Badge>
					<Wrench className={`h-4 w-4 ${lineItem.isRegret ? "text-muted-foreground" : ""}`} />
					<span className={lineItem.isRegret ? "text-muted-foreground" : ""}>{item?.itemName || "—"}</span>
					<Badge variant="outline" className="ml-1 text-xs">
						{item?.itemType || "UNIT"}
					</Badge>
					{lineItem.isRegret && <Badge variant="destructive" className="text-xs">Regretted</Badge>}
					<span className="text-muted-foreground ml-auto flex items-center gap-2 text-sm font-normal">
						{item?.itemCode}
						{!isEditing ? (
							<>
								{!lineItem.isRegret && <RegretItemDialog rfqItemId={lineItem._id} rfqId={rfqId} itemName={lineItem.item?.itemName ?? "Unknown"} />}
								<Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
									<Pencil className="mr-2 h-3 w-3" />
									Edit
								</Button>
							</>
						) : (
							<Button onClick={handleCancel} size="sm" variant="outline">
								<X className="mr-2 h-3 w-3" />
								Cancel
							</Button>
						)}
					</span>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{isSetOrAssembly ? (
					isEditing ? (
						<BomEditForm
							addBomHardness={addBomHardness}
							appendBom={appendBom}
							bomFields={bomFields}
							bomForm={bomForm}
							calcBomWeight={calcBomWeight}
							hardnessMeasurements={hardnessMeasurements}
							hardnessTypes={hardnessTypes}
							isSavingBom={isSavingBom}
							removeBom={removeBom}
							removeBomHardness={removeBomHardness}
							saveBom={saveBom}
						/>
					) : (
						<BomReadOnly bom={bom} />
					)
				) : isEditing ? (
					<TechSpecsEditForm
						appendHardness={appendHardness}
						hardnessFields={hardnessFields}
						hardnessMeasurements={hardnessMeasurements}
						hardnessTypes={hardnessTypes}
						isSaving={isSavingTechSpecs}
						lineItemForm={lineItemForm}
						removeHardness={removeHardness}
						saveTechSpecs={saveTechSpecs}
					/>
				) : (
					<TechSpecsReadOnly techSpecs={techSpecs} />
				)}
			</CardContent>
		</Card>
	);
};

// ── Read-only: UNIT tech specs ──
const TechSpecsReadOnly = ({ techSpecs }: { techSpecs?: RfqItemTechSpecs }) => (
	<div className="space-y-3">
		<h4 className="text-sm font-semibold">Technical Specifications</h4>
		<div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-5">
			<ReadOnlyField label="Material" value={techSpecs?.material} />
			<ReadOnlyField label="Diameter" value={techSpecs?.diameter} />
			<ReadOnlyField label="Length" value={techSpecs?.length} />
			<ReadOnlyField label="Weight" value={techSpecs?.weight} />
			<ReadOnlyField label="Grade" value={techSpecs?.grade} />
			<ReadOnlyField label="Remarks" value={techSpecs?.remarks} />
		</div>
		{techSpecs?.hardness && techSpecs.hardness.length > 0 && (
			<div className="space-y-1">
				<p className="text-sm font-semibold">Hardness</p>
				<div className="flex flex-wrap gap-2">
					{techSpecs.hardness.map((h, hIdx) => (
						<Badge key={h._id || hIdx} variant="secondary" className="text-xs">
							{h.hardnessType}: {h.value} {h.measurement}
						</Badge>
					))}
				</div>
			</div>
		)}
	</div>
);

// ── Read-only: BOM ──
const BomReadOnly = ({ bom }: { bom: BomEntry[] }) => (
	<div className="space-y-3">
		<h4 className="text-sm font-semibold">BOM Parts ({bom.length})</h4>
		{bom.length === 0 ? (
			<p className="text-muted-foreground text-sm">No BOM entries.</p>
		) : (
			<>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="text-muted-foreground border-b text-left">
								<th className="pr-3 pb-2 font-medium">#</th>
								<th className="pr-3 pb-2 font-medium">Part Name</th>
								<th className="pr-3 pb-2 font-medium">Material</th>
								<th className="pr-3 pb-2 font-medium">Qty</th>
								<th className="pr-3 pb-2 font-medium">Dia (mm)</th>
								<th className="pr-3 pb-2 font-medium">Length (mm)</th>
								<th className="pr-3 pb-2 font-medium">Weight (kg)</th>
								<th className="pr-3 pb-2 font-medium">Density</th>
								<th className="pr-3 pb-2 font-medium">Grade</th>
								<th className="pr-3 pb-2 font-medium">Make</th>
								<th className="pr-3 pb-2 font-medium">Remarks</th>
							</tr>
						</thead>
						<tbody>
							{bom.map((part, pIdx) => (
								<tr key={part._id || pIdx} className="border-b last:border-0">
									<td className="py-2 pr-3">{pIdx + 1}</td>
									<td className="py-2 pr-3 font-medium">{part.partName}</td>
									<td className="py-2 pr-3">{part.material || "—"}</td>
									<td className="py-2 pr-3">{part.quantity}</td>
									<td className="py-2 pr-3">{part.diameter || "—"}</td>
									<td className="py-2 pr-3">{part.length || "—"}</td>
									<td className="py-2 pr-3">{part.weight || "—"}</td>
									<td className="py-2 pr-3">{part.density || "—"}</td>
									<td className="py-2 pr-3">{part.grade || "—"}</td>
									<td className="py-2 pr-3">{part.make || "—"}</td>
									<td className="py-2 pr-3">{part.remarks || "—"}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				{bom.some(p => p.hardness && p.hardness.length > 0) && (
					<div className="space-y-2">
						<h4 className="text-sm font-semibold">Hardness Details</h4>
						{bom.map(
							(part, pIdx) =>
								part.hardness &&
								part.hardness.length > 0 && (
									<div key={part._id || pIdx} className="rounded-lg border p-3">
										<p className="text-muted-foreground mb-1 text-xs font-medium">{part.partName}</p>
										<div className="flex flex-wrap gap-2">
											{part.hardness.map((h, hIdx) => (
												<Badge key={h._id || hIdx} variant="secondary" className="text-xs">
													{h.hardnessType}: {h.value} {h.measurement}
												</Badge>
											))}
										</div>
									</div>
								)
						)}
					</div>
				)}
			</>
		)}
	</div>
);

// ── Editable: UNIT tech specs form ──
interface TechSpecsEditFormProps {
	lineItemForm: ReturnType<typeof useForm<LineItemFormValues>>;
	hardnessFields: { id: string }[];
	appendHardness: (value: { hardnessType: string; value: string; measurement: string }) => void;
	removeHardness: (index: number) => void;
	hardnessTypes: HardnessType[];
	hardnessMeasurements: HardnessMeasurement[];
	saveTechSpecs: (values: LineItemFormValues) => void;
	isSaving: boolean;
}

const TechSpecsEditForm = ({ lineItemForm, hardnessFields, appendHardness, removeHardness, hardnessTypes, hardnessMeasurements, saveTechSpecs, isSaving }: TechSpecsEditFormProps) => (
	<Form {...lineItemForm}>
		<h4 className="mb-3 text-sm font-semibold">Technical Specifications</h4>
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

		{/* Remarks */}
		<div className="mb-4 grid grid-cols-1 gap-3">
			<FormField
				control={lineItemForm.control}
				name="itemTechSpecs.remarks"
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
			<p className="text-muted-foreground mb-4 text-sm">No hardness entries.</p>
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
							<Trash2 className="text-destructive h-4 w-4" />
						</Button>
					</div>
				))}
			</div>
		)}

		<div className="flex justify-end">
			<Button disabled={isSaving} onClick={lineItemForm.handleSubmit(values => saveTechSpecs(values))} size="sm">
				<Save className="mr-2 h-3 w-3" />
				{isSaving ? "Saving..." : "Save Tech Specs"}
			</Button>
		</div>
	</Form>
);

// ── Editable: BOM form ──
interface BomEditFormProps {
	bomForm: ReturnType<typeof useForm<BomFormValues>>;
	bomFields: { id: string }[];
	appendBom: (value: BomFormValues["bom"][number]) => void;
	removeBom: (index: number) => void;
	calcBomWeight: (bomIdx: number) => void;
	addBomHardness: (bomIdx: number) => void;
	removeBomHardness: (bomIdx: number, hIdx: number) => void;
	hardnessTypes: HardnessType[];
	hardnessMeasurements: HardnessMeasurement[];
	saveBom: (values: BomFormValues) => void;
	isSavingBom: boolean;
}

const BomEditForm = ({ bomForm, bomFields, appendBom, removeBom, calcBomWeight, addBomHardness, removeBomHardness, hardnessTypes, hardnessMeasurements, saveBom, isSavingBom }: BomEditFormProps) => (
	<Form {...bomForm}>
		<div className="mb-3 flex items-center justify-between">
			<h4 className="text-sm font-semibold">Bill of Materials (BOM)</h4>
			<div className="flex gap-2">
				<Button
					onClick={() => appendBom({ partName: "", partDescription: "", material: "", quantity: 1, diameter: "", length: "", weight: "", density: "7.85", grade: "", make: "", remarks: "", hardness: [] })}
					size="sm"
					type="button"
					variant="outline"
				>
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
			<p className="text-muted-foreground text-sm">No BOM entries. Click &quot;Add Part&quot; to define sub-parts.</p>
		) : (
			<div className="space-y-4">
				{bomFields.map((bomField, i) => {
					const watchedHardness = bomForm.watch(`bom.${i}.hardness`) ?? [];
					return (
						<div className="bg-muted/20 rounded-lg border p-4" key={bomField.id}>
							<div className="mb-3 flex items-center justify-between">
								<span className="text-sm font-semibold">
									Part {i + 1}
									{bomForm.watch(`bom.${i}.partName`) ? ` — ${bomForm.watch(`bom.${i}.partName`)}` : ""}
								</span>
								<Button className="h-7 w-7" onClick={() => removeBom(i)} size="icon" type="button" variant="ghost">
									<Trash2 className="text-destructive h-4 w-4" />
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
								<span className="text-muted-foreground text-xs font-medium">Hardness</span>
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
											<Button className="mb-0.5" onClick={() => removeBomHardness(i, hIdx)} size="icon" type="button" variant="ghost">
												<Trash2 className="text-destructive h-4 w-4" />
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
);

const ReadOnlyField = ({ label, value }: { label: string; value?: string }) => (
	<div className="flex flex-col gap-1">
		<span className="text-muted-foreground text-xs">{label}</span>
		<span className="text-sm font-medium">{value || "—"}</span>
	</div>
);

export default TechnicalSummary;
