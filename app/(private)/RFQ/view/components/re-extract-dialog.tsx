"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "@config/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@components/ui/dialog";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { RefreshCw, Upload, CheckCircle2, AlertTriangle, Loader2, FileText, List, Hash, Download } from "lucide-react";

type ExtractionMode = "full" | "single";

interface ReExtractDialogProps {
	rfq: Rfq;
}

const ReExtractDialog = ({ rfq }: ReExtractDialogProps) => {
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);
	const [mode, setMode] = useState<ExtractionMode>("full");
	const [isExtracting, setIsExtracting] = useState(false);
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const [serialNumber, setSerialNumber] = useState("");
	const [useStoredDoc, setUseStoredDoc] = useState(true);

	// Full extraction state
	const [fullExtractedData, setFullExtractedData] = useState<ExtractionResponse["data"] | null>(null);

	// Single item extraction state
	const [singleExtractedItem, setSingleExtractedItem] = useState<ParsedItem | null>(null);
	const [singleConfidence, setSingleConfidence] = useState(0);
	const [singleLayer, setSingleLayer] = useState("");

	// Fetch linked email to get downloadedDocUrl as fallback for old RFQs that predate documentUrl storage
	const { data: linkedEmail } = useQuery<{ aribaLinks: AribaLink[]; attachments?: { cloudinaryUrl?: string; filename?: string }[] } | null>({
		queryKey: ["rfq-linked-email", rfq._id],
		queryFn: async () => {
			const res = await axios.get(`/api/v1/rfq/${rfq._id}/linked-email`);
			return res?.data?.data;
		},
		enabled: !rfq.documentUrl, // only fetch if rfq.documentUrl missing
		retry: 0,
	});

	const emailDocUrl =
		linkedEmail?.aribaLinks?.find(l => l.downloadedDocUrl)?.downloadedDocUrl ??
		linkedEmail?.attachments?.find(a => a.cloudinaryUrl)?.cloudinaryUrl ??
		null;

	const storedDocUrl = rfq.documentUrl || emailDocUrl;
	const storedDocFilename = storedDocUrl ? (decodeURIComponent(storedDocUrl.split("/").pop()?.split("?")[0] ?? "") || "document") : null;

	const onDrop = useCallback((acceptedFiles: File[]) => {
		if (acceptedFiles[0]) {
			setUploadedFile(acceptedFiles[0]);
			setFullExtractedData(null);
			setSingleExtractedItem(null);
		}
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: { "application/pdf": [".pdf"], "application/msword": [".doc"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
		maxFiles: 1,
	});

	const handleExtract = async () => {
		if (mode === "single" && !serialNumber.trim()) {
			toast.error("Enter a serial number to extract a specific item");
			return;
		}
		if (!useStoredDoc && !uploadedFile) {
			toast.error("Please upload a file");
			return;
		}

		setIsExtracting(true);
		try {
			if (mode === "full") {
				let res: { data: ExtractionResponse };
				if (useStoredDoc && storedDocUrl) {
					res = await axios.post("/api/v1/rfp-extract/re-extract-url", {
						documentUrl: storedDocUrl,
						filename: storedDocFilename,
					});
				} else {
					const formData = new FormData();
					formData.append("rfpFile", uploadedFile!);
					res = await axios.post("/api/v1/rfp-extract/re-extract", formData, {
						headers: { "Content-Type": "multipart/form-data" },
					});
				}
				setFullExtractedData((res.data as unknown as ExtractionResponse).data);
			} else {
				let res: { data: SingleItemExtractionResponse };
				if (useStoredDoc && storedDocUrl) {
					res = await axios.post("/api/v1/rfp-extract/single-item-url", {
						documentUrl: storedDocUrl,
						filename: storedDocFilename,
						serialNumber: serialNumber.trim(),
					});
				} else {
					const formData = new FormData();
					formData.append("rfpFile", uploadedFile!);
					formData.append("serialNumber", serialNumber.trim());
					res = await axios.post("/api/v1/rfp-extract/single-item", formData, {
						headers: { "Content-Type": "multipart/form-data" },
					});
				}
				const data = (res.data as unknown as SingleItemExtractionResponse).data;
				setSingleExtractedItem(data.item);
				setSingleConfidence(data.confidence);
				setSingleLayer(data.layer);
			}
		} catch {
			toast.error("Extraction failed. Please try again.");
		} finally {
			setIsExtracting(false);
		}
	};

	// Full extraction → replace all items
	const { mutate: applyAll, isPending: isApplyingAll } = useMutation({
		mutationFn: async () => {
			if (!fullExtractedData) throw new Error("No data");
			const res = await axios.post(`/api/v1/rfp-extract/apply/${rfq._id}`, { items: fullExtractedData.extractedData.items });
			return res.data;
		},
		onSuccess: () => {
			toast.success("All items replaced from extracted data");
			queryClient.invalidateQueries({ queryKey: ["rfq", rfq._id] });
			handleClose();
		},
		onError: () => toast.error("Failed to apply extracted data"),
	});

	// Single item → add to RFQ
	const { mutate: addSingleItem, isPending: isAddingItem } = useMutation({
		mutationFn: async () => {
			if (!singleExtractedItem) throw new Error("No item");
			const res = await axios.post(`/api/v1/rfp-extract/add-item/${rfq._id}`, singleExtractedItem);
			return res.data;
		},
		onSuccess: () => {
			toast.success("Item added to RFQ");
			queryClient.invalidateQueries({ queryKey: ["rfq", rfq._id] });
			handleClose();
		},
		onError: () => toast.error("Failed to add item"),
	});

	const handleClose = () => {
		if (isExtracting || isApplyingAll || isAddingItem) return;
		setIsOpen(false);
		setFullExtractedData(null);
		setSingleExtractedItem(null);
		setUploadedFile(null);
		setSerialNumber("");
		setMode("full");
		setUseStoredDoc(true);
	};

	const handleModeSwitch = (newMode: ExtractionMode) => {
		setMode(newMode);
		setFullExtractedData(null);
		setSingleExtractedItem(null);
		setUploadedFile(null);
		setSerialNumber("");
	};

	const fullItems = fullExtractedData?.extractedData?.items ?? [];
	const isProcessing = isExtracting || isApplyingAll || isAddingItem;
	const hasResult = mode === "full" ? fullExtractedData !== null : singleExtractedItem !== null;
	const canExtract = useStoredDoc ? !!storedDocUrl : !!uploadedFile;

	return (
		<>
			<Button onClick={() => setIsOpen(true)} size="sm" variant="outline" className="gap-1.5">
				<RefreshCw className="h-4 w-4" />
				Re-Extract
			</Button>

			<Dialog open={isOpen} onOpenChange={handleClose}>
				<DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Re-Extract RFQ Data</DialogTitle>
						<DialogDescription>Re-extract item data from the RFP document. Single-item mode uses significantly fewer tokens.</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						{/* Mode toggle */}
						<div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
							<button
								onClick={() => handleModeSwitch("full")}
								className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${mode === "full" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
							>
								<List className="h-4 w-4" />
								Full Extraction
							</button>
							<button
								onClick={() => handleModeSwitch("single")}
								className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${mode === "single" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
							>
								<Hash className="h-4 w-4" />
								Single Item
								<Badge variant="secondary" className="text-[10px]">
									fewer tokens
								</Badge>
							</button>
						</div>

						{mode === "single" && (
							<div className="space-y-1.5">
								<Label htmlFor="serialNumber">Serial / Section Number</Label>
								<Input id="serialNumber" placeholder="e.g. 7.3 or 7.3.1" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} disabled={isProcessing} />
								<p className="text-xs text-muted-foreground">Enter the serial number of the item to extract from the document.</p>
							</div>
						)}

						{/* Document source */}
						{storedDocUrl ? (
							<div className="space-y-2">
								<Label>Document Source</Label>
								{/* Stored document */}
								<div
									onClick={() => { if (!isProcessing) { setUseStoredDoc(true); setUploadedFile(null); setFullExtractedData(null); setSingleExtractedItem(null); } }}
									className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${useStoredDoc ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`}
								>
									<div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${useStoredDoc ? "border-primary" : "border-muted-foreground"}`}>
										{useStoredDoc && <div className="h-2 w-2 rounded-full bg-primary" />}
									</div>
									<FileText className="h-4 w-4 shrink-0 text-primary" />
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium">{storedDocFilename}</p>
										<p className="text-xs text-muted-foreground">Stored document (no upload needed)</p>
									</div>
									<a
										href={storedDocUrl}
										target="_blank"
										rel="noopener noreferrer"
										onClick={e => e.stopPropagation()}
										className="shrink-0 rounded-md border p-1.5 hover:bg-muted"
										title="Download document"
									>
										<Download className="h-3.5 w-3.5" />
									</a>
								</div>
								{/* Upload different file */}
								<div
									onClick={() => { if (!isProcessing) { setUseStoredDoc(false); setFullExtractedData(null); setSingleExtractedItem(null); } }}
									className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${!useStoredDoc ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`}
								>
									<div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${!useStoredDoc ? "border-primary" : "border-muted-foreground"}`}>
										{!useStoredDoc && <div className="h-2 w-2 rounded-full bg-primary" />}
									</div>
									<Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
									<p className="text-sm text-muted-foreground">Upload a different document</p>
								</div>

								{!useStoredDoc && (
									<div
										{...getRootProps()}
										className={`cursor-pointer rounded-lg border-2 border-dashed p-5 text-center transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"}`}
									>
										<input {...getInputProps()} />
										{uploadedFile ? (
											<div className="flex items-center justify-center gap-2">
												<FileText className="h-4 w-4 text-primary" />
												<span className="text-sm font-medium">{uploadedFile.name}</span>
											</div>
										) : (
											<p className="text-sm text-muted-foreground">{isDragActive ? "Drop here" : "Drag & drop or click — PDF, DOC, DOCX"}</p>
										)}
									</div>
								)}
							</div>
						) : (
							<div className="space-y-2">
								<Label>Document</Label>
								<p className="text-xs text-muted-foreground">No stored document found for this RFQ. Upload the RFP file to extract.</p>
								<div
									{...getRootProps()}
									className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"}`}
								>
									<input {...getInputProps()} />
									<Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
									{uploadedFile ? (
										<div className="flex items-center justify-center gap-2">
											<FileText className="h-4 w-4 text-primary" />
											<span className="text-sm font-medium">{uploadedFile.name}</span>
										</div>
									) : (
										<>
											<p className="text-sm font-medium">{isDragActive ? "Drop here" : "Drag & drop or click to upload"}</p>
											<p className="mt-1 text-xs text-muted-foreground">PDF, DOC, or DOCX</p>
										</>
									)}
								</div>
							</div>
						)}

						{canExtract && !hasResult && (
							<Button onClick={handleExtract} disabled={isExtracting || (mode === "single" && !serialNumber.trim())} className="w-full">
								{isExtracting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										{mode === "single" ? "Extracting single item..." : "Extracting all items..."}
									</>
								) : (
									<>
										<RefreshCw className="mr-2 h-4 w-4" />
										{mode === "single" ? `Extract Item ${serialNumber || ""}`.trim() : "Extract All Items"}
									</>
								)}
							</Button>
						)}

						{/* Full extraction results */}
						{mode === "full" && fullExtractedData && (
							<div className="space-y-3">
								<Separator />
								<div className="flex items-center gap-2">
									{fullExtractedData.extraction?.status === "FAILED" ? (
										<AlertTriangle className="h-4 w-4 text-destructive" />
									) : (
										<CheckCircle2 className="h-4 w-4 text-green-500" />
									)}
									<span className="text-sm font-medium">Extraction Result</span>
									<Badge variant="outline" className="ml-auto text-xs">
										{fullExtractedData.extraction?.layer} · {fullExtractedData.extraction?.confidence}% confidence
									</Badge>
								</div>
								{fullItems.length === 0 ? (
									<p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">No items found. Try a different file or mode.</p>
								) : (
									<>
										<div className="rounded-md border">
											<div className="grid grid-cols-12 gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
												<div className="col-span-1">#</div>
												<div className="col-span-3">Item Code</div>
												<div className="col-span-5">Item Name</div>
												<div className="col-span-2 text-right">Qty</div>
												<div className="col-span-1 text-right">Dwg</div>
											</div>
											<div className="max-h-48 overflow-y-auto">
												{fullItems.map((item, idx) => (
													<div key={idx} className="grid grid-cols-12 gap-2 border-b px-3 py-2 text-xs last:border-0">
														<div className="col-span-1 text-muted-foreground">{item.serialNumber || idx + 1}</div>
														<div className="col-span-3 font-mono font-medium">{item.itemCode}</div>
														<div className="col-span-5 truncate">{item.itemName}</div>
														<div className="col-span-2 text-right">{item.quantity}</div>
														<div className="col-span-1 text-right">{item.drawingNumber ? "✓" : "—"}</div>
													</div>
												))}
											</div>
										</div>
										<div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
											<strong>Warning:</strong> Applying will replace all {(rfq.items as RfqLineItem[]).length} current item(s) with {fullItems.length} extracted item(s).
										</div>
									</>
								)}
							</div>
						)}

						{/* Single item result */}
						{mode === "single" && singleExtractedItem && (
							<div className="space-y-3">
								<Separator />
								<div className="flex items-center gap-2">
									<CheckCircle2 className="h-4 w-4 text-green-500" />
									<span className="text-sm font-medium">Item Extracted</span>
									<Badge variant="outline" className="ml-auto text-xs">
										{singleLayer} · {singleConfidence}% confidence
									</Badge>
								</div>
								<div className="rounded-md border bg-muted/30 p-4 text-sm">
									<div className="grid grid-cols-2 gap-x-4 gap-y-2">
										<div>
											<span className="text-xs text-muted-foreground">Serial #</span>
											<p className="font-medium">{singleExtractedItem.serialNumber || "—"}</p>
										</div>
										<div>
											<span className="text-xs text-muted-foreground">Item Code</span>
											<p className="font-mono font-medium">{singleExtractedItem.itemCode || "—"}</p>
										</div>
										<div className="col-span-2">
											<span className="text-xs text-muted-foreground">Item Name</span>
											<p className="font-medium">{singleExtractedItem.itemName || "—"}</p>
										</div>
										<div>
											<span className="text-xs text-muted-foreground">Quantity</span>
											<p className="font-medium">{singleExtractedItem.quantity} {singleExtractedItem.uom || ""}</p>
										</div>
										<div>
											<span className="text-xs text-muted-foreground">Drawing #</span>
											<p className="font-medium">{singleExtractedItem.drawingNumber || "—"}</p>
										</div>
										{singleExtractedItem.technical?.material && (
											<div>
												<span className="text-xs text-muted-foreground">Material</span>
												<p className="font-medium">{singleExtractedItem.technical.material}</p>
											</div>
										)}
										{singleExtractedItem.technical?.grade && (
											<div>
												<span className="text-xs text-muted-foreground">Grade</span>
												<p className="font-medium">{singleExtractedItem.technical.grade}</p>
											</div>
										)}
									</div>
								</div>
								<p className="text-xs text-muted-foreground">This item will be <strong>added</strong> to the RFQ without replacing existing items.</p>
							</div>
						)}
					</div>

					<DialogFooter className="gap-2">
						<Button onClick={handleClose} variant="outline" disabled={isProcessing}>
							Cancel
						</Button>
						{mode === "full" && fullItems.length > 0 && (
							<Button onClick={() => applyAll()} disabled={isApplyingAll}>
								{isApplyingAll ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Applying...</> : `Replace All with ${fullItems.length} Item(s)`}
							</Button>
						)}
						{mode === "single" && singleExtractedItem && (
							<Button onClick={() => addSingleItem()} disabled={isAddingItem}>
								{isAddingItem ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : "Add Item to RFQ"}
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default ReExtractDialog;
