"use client";
import { useRef, useState } from "react";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import { Upload, FileArchive, Loader2, CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

interface BulkDrawingUploadProps {
	rfqId: string;
	items: RfqLineItem[];
}

type BulkUploadResult = {
	success: { itemCode: string; drawingUrl: string }[];
	errors: { fileName: string; reason: string }[];
	skipped: { fileName: string; reason: string }[];
};

const bulkUploadApi = async (rfqId: string, file: File) => {
	const formData = new FormData();
	formData.append("zipFile", file);
	const response = await axios.post(`/api/v1/rfqItem/bulk-drawing/${rfqId}`, formData, {
		headers: { "Content-Type": "multipart/form-data" },
	});
	return response?.data?.data as BulkUploadResult;
};

const BulkDrawingUpload = ({ rfqId, items }: BulkDrawingUploadProps) => {
	const queryClient = useQueryClient();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [result, setResult] = useState<BulkUploadResult | null>(null);
	const [apiError, setApiError] = useState<string | null>(null);

	const { mutate, isPending } = useMutation({
		mutationFn: (file: File) => bulkUploadApi(rfqId, file),
		onSuccess: data => {
			setResult(data);
			setApiError(null);
			queryClient.invalidateQueries({ queryKey: ["rfq", rfqId] });
			if (data.success.length > 0) {
				toast.success(`${data.success.length} drawing(s) uploaded successfully`);
			}
			if (data.errors.length > 0) {
				toast.error(`${data.errors.length} drawing(s) failed`);
			}
		},
		onError: (error: AxiosError<{ message?: string }>) => {
			const message = error.response?.data?.message ?? "Failed to upload ZIP file";
			setApiError(message);
			setResult(null);
			toast.error(message);
		},
	});

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const allowedTypes = ["application/zip", "application/x-zip-compressed", "application/x-zip", "multipart/x-zip"];
		if (!allowedTypes.includes(file.type) && !file.name.endsWith(".zip")) {
			toast.error("Only ZIP files are allowed");
			e.target.value = "";
			return;
		}

		setResult(null);
		setApiError(null);
		mutate(file);
		e.target.value = "";
	};

	const itemCodes = items.map(i => i.item?.itemCode).filter(Boolean);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<FileArchive className="h-5 w-5" />
					Bulk Drawing Upload
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Instructions */}
				<div className="rounded-lg border border-border bg-muted/60 p-4">
					<div className="mb-2 flex items-center gap-2">
						<Info className="h-4 w-4 text-foreground" />
						<span className="text-sm font-semibold text-foreground">How it works</span>
					</div>
					<ul className="list-inside list-disc space-y-1 text-sm text-foreground/80">
						<li>Upload a <strong>.zip</strong> file containing PDF drawings</li>
						<li>Each PDF must be named as <strong>&lt;ItemCode&gt;.pdf</strong> (e.g., <code className="rounded bg-background px-1 py-0.5 text-xs font-semibold">BOLT-001.pdf</code>)</li>
						<li>Only <strong>PDF files</strong> are accepted — PNGs and other formats will be skipped</li>
						<li>One PDF per item — existing drawings will be replaced</li>
						<li>Not all items need a drawing — upload as many as you have</li>
					</ul>
				</div>

				{/* Expected item codes */}
				{itemCodes.length > 0 && (
					<div>
						<p className="mb-2 text-xs font-semibold text-foreground/70">Expected item codes in this RFQ:</p>
						<div className="flex flex-wrap gap-1.5">
							{itemCodes.map(code => (
								<Badge className="text-xs" key={code} variant="outline">
									{code}
								</Badge>
							))}
						</div>
					</div>
				)}

				<Separator />

				{/* Upload button */}
				<div className="flex items-center gap-3">
					<input accept=".zip" className="hidden" onChange={handleFileChange} ref={fileInputRef} type="file" />
					<Button disabled={isPending} onClick={() => fileInputRef.current?.click()} variant="outline">
						{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
						{isPending ? "Uploading & Processing..." : "Upload ZIP File"}
					</Button>
					{isPending && <span className="text-sm text-foreground/60">This may take a moment...</span>}
				</div>

				{/* API-level error */}
				{apiError && (
					<div className="flex items-center gap-2 rounded-lg border border-red-400 bg-red-100 px-4 py-3">
						<XCircle className="h-4 w-4 shrink-0 text-red-700" />
						<span className="text-sm font-medium text-red-900">{apiError}</span>
					</div>
				)}

				{/* Results */}
				{result && (
					<div className="space-y-3">
						{/* Success */}
						{result.success.length > 0 && (
							<div className="rounded-lg border border-green-400 bg-green-100 p-4">
								<div className="mb-2 flex items-center gap-2">
									<CheckCircle2 className="h-4 w-4 text-green-700" />
									<span className="text-sm font-bold text-green-900">
										{result.success.length} drawing(s) uploaded successfully
									</span>
								</div>
								<div className="space-y-1">
									{result.success.map(s => (
										<div className="flex items-center gap-2 text-sm font-medium text-green-800" key={s.itemCode}>
											<Badge className="border-green-500 bg-green-200 text-xs text-green-900" variant="outline">
												{s.itemCode}
											</Badge>
											<span>Drawing uploaded</span>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Errors */}
						{result.errors.length > 0 && (
							<div className="rounded-lg border border-red-400 bg-red-100 p-4">
								<div className="mb-2 flex items-center gap-2">
									<XCircle className="h-4 w-4 text-red-700" />
									<span className="text-sm font-bold text-red-900">
										{result.errors.length} drawing(s) failed
									</span>
								</div>
								<div className="space-y-1">
									{result.errors.map((e, i) => (
										<div className="flex items-center gap-2 text-sm text-red-800" key={i}>
											<code className="rounded bg-red-200 px-1.5 py-0.5 text-xs font-bold text-red-900">{e.fileName}</code>
											<span className="font-medium">{e.reason}</span>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Skipped */}
						{result.skipped.length > 0 && (
							<div className="rounded-lg border border-amber-400 bg-amber-100 p-4">
								<div className="mb-2 flex items-center gap-2">
									<AlertTriangle className="h-4 w-4 text-amber-700" />
									<span className="text-sm font-bold text-amber-900">
										{result.skipped.length} file(s) skipped
									</span>
								</div>
								<div className="space-y-1">
									{result.skipped.map((s, i) => (
										<div className="flex items-center gap-2 text-sm text-amber-800" key={i}>
											<code className="rounded bg-amber-200 px-1.5 py-0.5 text-xs font-bold text-amber-900">{s.fileName}</code>
											<span className="font-medium">{s.reason}</span>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Summary when nothing was uploaded */}
						{result.success.length === 0 && result.errors.length === 0 && result.skipped.length === 0 && (
							<div className="flex items-center gap-2 rounded-lg border px-4 py-3">
								<AlertTriangle className="h-4 w-4 text-foreground" />
								<span className="text-sm font-medium text-foreground">The ZIP file was empty or contained no processable files.</span>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default BulkDrawingUpload;
