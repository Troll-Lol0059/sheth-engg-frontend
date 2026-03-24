"use client";
import { useState } from "react";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@components/ui/toaster";
import { Button } from "@components/ui/button";
import { FileInput } from "@components/ui/file-input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@components/ui/dialog";
import { Plus, RotateCcw } from "lucide-react";
import ExtractionPreview from "./extraction-preview";

interface AddRfqDialogProps {
	onConfirmed?: () => void;
}

const AddRfqDialog = ({ onConfirmed }: AddRfqDialogProps) => {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [files, setFiles] = useState<File[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [isConfirming, setIsConfirming] = useState(false);
	const [extractionData, setExtractionData] = useState<ExtractionResponse["data"] | null>(null);

	const handleUpload = async () => {
		if (files.length === 0) {
			toast.error("Error!", { description: "Please select a file to upload." });
			return;
		}

		setIsUploading(true);
		const toastId = toast.loading("Uploading...", { description: "Extracting data from your document." });

		try {
			const formData = new FormData();
			formData.append("rfpFile", files[0]);

			const response = await axios.post("/api/v1/rfp-extract/upload", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			const result = response?.data as ExtractionResponse;
			setExtractionData(result.data);

			toast.success("Extracted!", {
				id: toastId,
				description: `Data extracted via ${result.data.extraction.layer} layer (confidence: ${result.data.extraction.confidence}%)`,
			});
		} catch (error: unknown) {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			toast.error(errorData?.error ?? "Upload Failed", {
				id: toastId,
				description: errorData?.message ?? "Failed to extract data from the document.",
			});
		} finally {
			setIsUploading(false);
		}
	};

	const handleReExtract = async () => {
		if (files.length === 0) return;

		setIsUploading(true);
		const toastId = toast.loading("Re-extracting...", { description: "Running extraction pipeline again." });

		try {
			const formData = new FormData();
			formData.append("rfpFile", files[0]);

			const response = await axios.post("/api/v1/rfp-extract/re-extract", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			const result = response?.data as ExtractionResponse;
			setExtractionData(result.data);

			toast.success("Re-extracted!", {
				id: toastId,
				description: `Data re-extracted via ${result.data.extraction.layer} layer`,
			});
		} catch (error: unknown) {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			toast.error(errorData?.error ?? "Re-extraction Failed", {
				id: toastId,
				description: errorData?.message ?? "Failed to re-extract data.",
			});
		} finally {
			setIsUploading(false);
		}
	};

	const handleConfirm = async (payload: ConfirmPayload) => {
		setIsConfirming(true);
		const toastId = toast.loading("Saving...", { description: "Creating RFQ from extracted data." });

		try {
			await axios.post("/api/v1/rfp-extract/confirm", payload);

			toast.success("RFQ Created!", {
				id: toastId,
				description: `RFQ ${payload.prNumber} has been created successfully.`,
			});

			setOpen(false);
			resetState();
			queryClient.invalidateQueries({ queryKey: ["rfqs-all"] });
			onConfirmed?.();
		} catch (error: unknown) {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			toast.error(errorData?.error ?? "Save Failed", {
				id: toastId,
				description: errorData?.message ?? "Failed to save the RFQ.",
			});
		} finally {
			setIsConfirming(false);
		}
	};

	const resetState = () => {
		setFiles([]);
		setExtractionData(null);
	};

	return (
		<Dialog
			onOpenChange={val => {
				setOpen(val);
				if (!val) resetState();
			}}
			open={open}
		>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-1 h-4 w-4" />
					Add RFQ
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{extractionData ? "Review Extracted Data" : "Upload RFP Document"}</DialogTitle>
					<DialogDescription>{extractionData ? "Review the extracted data and confirm to create the RFQ." : "Upload a .docx or .pdf file to extract RFQ data."}</DialogDescription>
				</DialogHeader>

				{!extractionData ? (
					<div className="flex flex-col gap-4">
						<FileInput
							accept={{
								"application/pdf": [".pdf"],
								"application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
							}}
							maxFiles={1}
							maxSize={1024 * 1024 * 10}
							onChange={setFiles}
							value={files}
						/>
						<DialogFooter>
							<Button disabled={files.length === 0 || isUploading} onClick={handleUpload}>
								{isUploading ? "Extracting..." : "Upload & Extract"}
							</Button>
						</DialogFooter>
					</div>
				) : (
					<div className="flex flex-col gap-4">
						<ExtractionPreview data={extractionData} isConfirming={isConfirming} onConfirm={handleConfirm} />
						<DialogFooter className="gap-2">
							<Button disabled={isUploading} onClick={handleReExtract} variant="outline">
								<RotateCcw className="mr-1 h-4 w-4" />
								{isUploading ? "Re-extracting..." : "Re-extract"}
							</Button>
						</DialogFooter>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default AddRfqDialog;
