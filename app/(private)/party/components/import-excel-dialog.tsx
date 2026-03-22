"use client";
import { useState, useRef } from "react";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@components/ui/dialog";
import { Upload, Loader2, CheckCircle, XCircle } from "lucide-react";

interface ImportResult {
	totalRows: number;
	successCount: number;
	errorCount: number;
	errors: { row: number; message: string }[];
}

const ImportExcelDialog = () => {
	const [open, setOpen] = useState(false);
	const [file, setFile] = useState<File | null>(null);
	const [result, setResult] = useState<ImportResult | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();

	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			if (!file) throw new Error("No file selected");
			const formData = new FormData();
			formData.append("file", file);
			const response = await axios.post("/api/v1/party/import-excel", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			return response?.data?.data as ImportResult;
		},
		onSuccess: (data) => {
			setResult(data);
			queryClient.invalidateQueries({ queryKey: ["parties-all"] });
			if (data.errorCount === 0) {
				toast.success(`Successfully imported ${data.successCount} parties`);
			} else {
				toast.warning(`Imported ${data.successCount} of ${data.totalRows} rows with ${data.errorCount} errors`);
			}
		},
		onError: (error: AxiosError) => {
			const errorData = error?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to import Excel file");
		},
	});

	const resetState = () => {
		setFile(null);
		setResult(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!file) {
			toast.error("Please select a file to upload");
			return;
		}
		mutate();
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
				<Button variant="outline">
					<Upload className="mr-1 h-4 w-4" />
					Import Excel
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Import Parties from Excel</DialogTitle>
					<DialogDescription>Upload an Excel file (.xlsx, .xls) to import party records in bulk.</DialogDescription>
				</DialogHeader>

				{!result ? (
					<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
						<div className="rounded-lg border border-dashed p-4">
							<p className="mb-3 text-sm text-muted-foreground">
								The Excel file should have column headers matching the party field names: acName, cpName, mobile, phone, email, add1, add2, add3, pin, cin, vat, cst, pan, tan, range, tin, ecc, stregn, state, statecd, gstin, partyType, partySubType.
							</p>
							<input accept=".xlsx,.xls" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium" onChange={e => setFile(e.target.files?.[0] ?? null)} ref={fileInputRef} type="file" />
						</div>
						<DialogFooter>
							<Button disabled={!file || isPending} type="submit">
								{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{isPending ? "Importing..." : "Upload & Import"}
							</Button>
						</DialogFooter>
					</form>
				) : (
					<div className="flex flex-col gap-4">
						<div className="grid grid-cols-3 gap-4">
							<div className="flex flex-col items-center rounded-lg border p-3">
								<span className="text-2xl font-bold">{result.totalRows}</span>
								<span className="text-sm text-muted-foreground">Total Rows</span>
							</div>
							<div className="flex flex-col items-center rounded-lg border p-3">
								<span className="text-2xl font-bold text-green-600">{result.successCount}</span>
								<span className="text-sm text-muted-foreground">Successful</span>
							</div>
							<div className="flex flex-col items-center rounded-lg border p-3">
								<span className="text-2xl font-bold text-red-600">{result.errorCount}</span>
								<span className="text-sm text-muted-foreground">Errors</span>
							</div>
						</div>

						{result.errors.length > 0 && (
							<div className="flex flex-col gap-2">
								<h4 className="text-sm font-medium">Error Details</h4>
								<div className="max-h-48 overflow-y-auto rounded-lg border">
									{result.errors.map((err, idx) => (
										<div className="flex items-start gap-2 border-b p-2 last:border-b-0" key={idx}>
											<XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
											<span className="text-sm">
												<span className="font-medium">Row {err.row}:</span> {err.message}
											</span>
										</div>
									))}
								</div>
							</div>
						)}

						{result.errorCount === 0 && (
							<div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
								<CheckCircle className="h-5 w-5 text-green-600" />
								<span className="text-sm text-green-700">All rows imported successfully!</span>
							</div>
						)}

						<DialogFooter>
							<Button onClick={() => { resetState(); setOpen(false); }} variant="outline">
								Close
							</Button>
							<Button onClick={resetState}>Import Another</Button>
						</DialogFooter>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default ImportExcelDialog;
