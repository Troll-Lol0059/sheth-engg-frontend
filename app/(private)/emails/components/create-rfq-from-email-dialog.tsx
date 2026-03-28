"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@config/axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import { FileText, Globe, Paperclip, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import ExtractionPreview from "../../RFQ/components/extraction-preview";

type DialogStep = "idle" | "processing" | "review" | "confirming";

interface CreateRfqFromEmailDialogProps {
	email: EmailRecord | null;
	open: boolean;
	onClose: () => void;
}

const PROGRESS_MESSAGES = [
	"Connecting to Ariba...",
	"Logging in and downloading document...",
	"Extracting data from document...",
	"Almost there...",
];

const CreateRfqFromEmailDialog = ({ email, open, onClose }: CreateRfqFromEmailDialogProps) => {
	const queryClient = useQueryClient();
	const [step, setStep] = useState<DialogStep>("idle");
	const [extractionData, setExtractionData] = useState<ExtractionResponse["data"] | null>(null);
	const [progressMessage, setProgressMessage] = useState(PROGRESS_MESSAGES[0] ?? "");
	const [errorMessage, setErrorMessage] = useState("");

	// Rotate progress messages during processing
	useEffect(() => {
		if (step !== "processing") return;
		let idx = 0;
		setProgressMessage(PROGRESS_MESSAGES[0] ?? "");
		const interval = setInterval(() => {
			idx++;
			if (idx < PROGRESS_MESSAGES.length) {
				setProgressMessage(PROGRESS_MESSAGES[idx] ?? "");
			}
		}, 8000);
		return () => clearInterval(interval);
	}, [step]);

	// Reset state when dialog opens/closes
	useEffect(() => {
		if (open) {
			setStep("idle");
			setExtractionData(null);
			setErrorMessage("");
		}
	}, [open]);

	// Download + Extract mutation
	const { mutate: downloadAndExtract } = useMutation({
		mutationFn: async () => {
			const res = await axios.post(`/api/v1/email/${email?._id}/download-and-extract`, {}, {
				timeout: 120000,
			});
			return res?.data?.data as ExtractionResponse["data"];
		},
		onSuccess: data => {
			// Merge email classification data as fallback for empty extraction fields
			if (email) {
				const extracted = email.classification.extractedData;
				if (!data.extractedData.prNumber && extracted.prNumbers[0]) {
					data.extractedData.prNumber = extracted.prNumbers[0];
				}
				if (!data.extractedData.companyName && extracted.companyNames[0]) {
					data.extractedData.companyName = extracted.companyNames[0];
				}
				if (!data.extractedData.location && extracted.location) {
					data.extractedData.location = extracted.location;
				}
			}
			setExtractionData(data);
			setStep("review");
		},
		onError: (err: unknown) => {
			const msg =
				err && typeof err === "object" && "response" in err
					? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Download or extraction failed")
					: "Download or extraction failed";
			setErrorMessage(msg);
			setStep("idle");
		},
	});

	// Confirm mutation
	const { mutate: confirmRfq, isPending: isConfirming } = useMutation({
		mutationFn: async (payload: ConfirmPayload) => {
			const res = await axios.post("/api/v1/rfp-extract/confirm", {
				...payload,
				emailId: email?._id,
			});
			return res?.data?.data;
		},
		onSuccess: () => {
			toast.success("RFQ created successfully from email");
			queryClient.invalidateQueries({ queryKey: ["emails"] });
			queryClient.invalidateQueries({ queryKey: ["email-stats"] });
			queryClient.invalidateQueries({ queryKey: ["email-unread-count"] });
			queryClient.invalidateQueries({ queryKey: ["rfqs"] });
			onClose();
		},
		onError: (err: unknown) => {
			const msg =
				err && typeof err === "object" && "response" in err
					? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to create RFQ")
					: "Failed to create RFQ";
			toast.error(msg);
			setStep("review");
		},
	});

	const handleStartProcess = () => {
		setErrorMessage("");
		setStep("processing");
		downloadAndExtract();
	};

	const handleConfirm = (payload: ConfirmPayload) => {
		setStep("confirming");
		confirmRfq(payload);
	};

	if (!email) return null;

	const classification = email.classification;
	const extracted = classification.extractedData;
	const hasAribaDoc = email.aribaLinks.some(l => l.downloadStatus === "DOWNLOADED");
	const hasAttachment = email.attachments.some(a => a.cloudinaryUrl);
	const hasAribaLink = email.aribaLinks.length > 0;
	const hasDocSource = hasAribaDoc || hasAttachment || hasAribaLink;

	return (
		<Dialog
			onOpenChange={v => {
				if (!v && step !== "processing" && step !== "confirming") onClose();
			}}
			open={open}
		>
			<DialogContent className={step === "review" ? "max-h-[90vh] max-w-4xl overflow-y-auto" : "max-w-lg"}>
				<DialogHeader>
					<DialogTitle>Create RFQ from Email</DialogTitle>
					<DialogDescription>
						{step === "idle" && "Review the email data, then click Create RFQ to download and extract."}
						{step === "processing" && "Downloading and extracting document..."}
						{step === "review" && "Review extracted data, edit if needed, then confirm."}
						{step === "confirming" && "Creating RFQ..."}
					</DialogDescription>
				</DialogHeader>

				{/* ─── IDLE STEP ─── */}
				{step === "idle" && (
					<div className="space-y-4">
						{/* Error banner */}
						{errorMessage && (
							<div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
								<AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
								<div>
									<p className="text-sm font-medium text-red-800">Failed</p>
									<p className="text-xs text-red-600">{errorMessage}</p>
								</div>
							</div>
						)}

						{/* Pre-filled info from classification */}
						<div className="grid grid-cols-2 gap-3">
							{extracted.prNumbers.length > 0 && (
								<div>
									<span className="text-muted-foreground text-xs">PR Number</span>
									<p className="text-sm font-medium">{extracted.prNumbers[0]}</p>
								</div>
							)}
							{extracted.companyNames.length > 0 && (
								<div>
									<span className="text-muted-foreground text-xs">Company</span>
									<p className="text-sm font-medium">{extracted.companyNames[0]}</p>
								</div>
							)}
							{extracted.location && (
								<div>
									<span className="text-muted-foreground text-xs">Location</span>
									<p className="text-sm font-medium">{extracted.location}</p>
								</div>
							)}
							{extracted.dueDate && (
								<div>
									<span className="text-muted-foreground text-xs">Due Date</span>
									<p className="text-sm font-medium">{new Date(extracted.dueDate).toLocaleDateString()}</p>
								</div>
							)}
						</div>

						<Separator />

						{/* Document source indicator */}
						<div>
							<p className="text-muted-foreground mb-2 text-xs font-medium">Document Source</p>
							{hasAribaDoc && (
								<div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-2">
									<Globe className="h-4 w-4 text-green-600" />
									<span className="text-sm">Ariba document (already downloaded)</span>
									<Badge className="ml-auto" variant="outline">
										Ready
									</Badge>
								</div>
							)}
							{!hasAribaDoc && hasAttachment && (
								<div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-2">
									<Paperclip className="h-4 w-4 text-blue-600" />
									<span className="text-sm">Email attachment</span>
									<Badge className="ml-auto" variant="outline">
										Ready
									</Badge>
								</div>
							)}
							{!hasAribaDoc && !hasAttachment && hasAribaLink && (
								<div className="flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 p-2">
									<Globe className="h-4 w-4 text-orange-600" />
									<span className="text-sm">Ariba link — document will be auto-downloaded</span>
								</div>
							)}
							{!hasDocSource && <p className="text-muted-foreground text-sm">No document source available for this email.</p>}
						</div>

						<div className="flex justify-end gap-2">
							<Button onClick={onClose} variant="outline">
								Cancel
							</Button>
							{errorMessage ? (
								<Button disabled={!hasDocSource} onClick={handleStartProcess}>
									<RotateCcw className="mr-1 h-4 w-4" />
									Retry
								</Button>
							) : (
								<Button disabled={!hasDocSource} onClick={handleStartProcess}>
									<FileText className="mr-1 h-4 w-4" />
									{hasAribaDoc || hasAttachment ? "Extract & Create RFQ" : "Download & Create RFQ"}
								</Button>
							)}
						</div>
					</div>
				)}

				{/* ���── PROCESSING STEP ─── */}
				{step === "processing" && (
					<div className="flex flex-col items-center gap-4 py-12">
						<Loader2 className="text-primary h-10 w-10 animate-spin" />
						<p className="text-sm font-medium">{progressMessage}</p>
						<p className="text-muted-foreground text-xs">This may take up to 60 seconds...</p>
					</div>
				)}

				{/* ──��� REVIEW STEP ─── */}
				{step === "review" && extractionData && <ExtractionPreview data={extractionData} isConfirming={isConfirming} onConfirm={handleConfirm} />}

				{/* ─── CONFIRMING STEP ��── */}
				{step === "confirming" && (
					<div className="flex flex-col items-center gap-4 py-12">
						<Loader2 className="text-primary h-10 w-10 animate-spin" />
						<p className="text-sm font-medium">Creating RFQ...</p>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default CreateRfqFromEmailDialog;
