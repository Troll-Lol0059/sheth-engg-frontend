"use client";
import { useRef, useState } from "react";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@components/ui/dialog";
import { Download, Loader2, Truck, Upload } from "lucide-react";

type BulkImportResult = {
	totalRows: number;
	matched: number;
	updated: number;
	notFound: number;
	skipped: number;
	rowErrors: string[];
};

const BulkTransportImportDialog = () => {
	const queryClient = useQueryClient();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [open, setOpen] = useState(false);
	const [result, setResult] = useState<BulkImportResult | null>(null);
	const [isDownloading, setIsDownloading] = useState(false);

	const handleDownloadTemplate = async () => {
		setIsDownloading(true);
		try {
			const response = await axios.get("/api/v1/sales/transport-details/template", { responseType: "blob" });
			const url = URL.createObjectURL(response.data as Blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "transport-details-template.csv";
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);
		} catch {
			toast.error("Failed to download template");
		} finally {
			setIsDownloading(false);
		}
	};

	const importMutation = useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("file", file);
			const response = await axios.post("/api/v1/sales/transport-details/bulk-import", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			return response?.data?.data as BulkImportResult;
		},
		onSuccess: data => {
			toast.success(`Updated ${data.updated} of ${data.matched} matched row(s)`);
			setResult(data);
			queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
		},
		onError: (error: AxiosError<ErrorData>) => {
			toast.error(error.response?.data?.message ?? "Failed to import transport details");
		},
	});

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			importMutation.mutate(file);
			e.target.value = "";
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="w-full text-xs lg:w-auto" variant="outline">
					<Truck size={16} />
					Bulk Import Transport Details
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[80vh] max-w-xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Bulk Import Transport Details</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4 text-sm">
					<p className="text-muted-foreground">
						Download the template, fill in the Transporter Name, Transporter GSTIN and Consignment Number columns for the rows you have
						data for, then upload it back. Rows are matched by Invoice Number alone — one row updates every line item on that invoice;
						a blank cell leaves the existing value untouched.
					</p>
					<div className="flex flex-col gap-2 sm:flex-row">
						<Button onClick={handleDownloadTemplate} disabled={isDownloading} variant="outline" className="w-full sm:w-auto">
							{isDownloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
							Download Template
						</Button>
						<input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileChange} className="hidden" />
						<Button onClick={() => fileInputRef.current?.click()} disabled={importMutation.isPending} className="w-full sm:w-auto">
							{importMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
							Upload Filled Template
						</Button>
					</div>

					{result && (
						<div className="flex flex-col gap-3 rounded-md border p-3">
							<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
								<div>
									<p className="text-muted-foreground">Total rows</p>
									<p className="font-medium">{result.totalRows}</p>
								</div>
								<div>
									<p className="text-muted-foreground">Matched</p>
									<p className="font-medium">{result.matched}</p>
								</div>
								<div>
									<p className="text-muted-foreground">Updated</p>
									<p className="font-medium">{result.updated}</p>
								</div>
								<div>
									<p className="text-muted-foreground">Not found</p>
									<p className="font-medium">{result.notFound}</p>
								</div>
							</div>
							{result.rowErrors?.length > 0 && (
								<div>
									<p className="mb-1 font-medium text-destructive">Skipped rows ({result.rowErrors.length})</p>
									<ul className="list-inside list-disc space-y-1 text-muted-foreground">
										{result.rowErrors.map((e, i) => (
											<li key={i}>{e}</li>
										))}
									</ul>
								</div>
							)}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default BulkTransportImportDialog;
