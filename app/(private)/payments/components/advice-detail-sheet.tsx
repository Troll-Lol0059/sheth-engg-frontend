"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@components/ui/tooltip";
import { AlertTriangle, Loader2 } from "lucide-react";

const formatCurrency = (value?: number) => (value === undefined ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value));

const formatDate = (date?: string) => {
	if (!date) return "—";
	return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const matchStatusVariant = (status: PaymentAdviceRowMatchStatus): "success" | "warning" | "destructive" => {
	if (status === "MATCHED") return "success";
	if (status === "SHORT_PAYMENT") return "destructive";
	return "warning";
};

type AdviceDetailSheetProps = {
	adviceId: string | null;
	onClose: () => void;
};

const AdviceDetailSheet = ({ adviceId, onClose }: AdviceDetailSheetProps) => {
	const queryClient = useQueryClient();

	const { data: advice, isFetching } = useQuery<PaymentAdvice | null>({
		queryKey: ["payment-advice-detail", adviceId],
		queryFn: async () => {
			if (!adviceId) return null;
			const response = await axios.get(`/api/v1/payment/advices/${adviceId}`);
			return response?.data?.data as PaymentAdvice;
		},
		enabled: !!adviceId,
	});

	const resolveMutation = useMutation({
		mutationFn: async (invoiceNumber: string) => {
			const response = await axios.patch(`/api/v1/payment/advices/${adviceId}/resolve`, { invoiceNumber });
			return response?.data?.data as PaymentAdviceResolveResult;
		},
		onSuccess: () => {
			toast.success("Row marked as resolved");
			queryClient.invalidateQueries({ queryKey: ["payment-advice-detail", adviceId] });
			queryClient.invalidateQueries({ queryKey: ["payment-advices"] });
		},
		onError: (error: AxiosError<ErrorData>) => {
			toast.error(error.response?.data?.message ?? "Failed to mark row as resolved");
		},
	});

	return (
		<Sheet onOpenChange={open => !open && onClose()} open={!!adviceId}>
			<SheetContent className="w-full overflow-y-auto sm:max-w-4xl">
				<SheetHeader>
					<SheetTitle>Payment Advice{advice ? ` — UTR ${advice.utrNo}` : ""}</SheetTitle>
				</SheetHeader>

				{isFetching || !advice ? (
					<div className="flex h-40 items-center justify-center">
						<Loader2 className="text-primary animate-spin" size={28} />
					</div>
				) : (
					<div className="flex flex-col gap-5 px-4 pb-6">
						<div className="grid grid-cols-2 gap-3 rounded-md border p-4 text-sm sm:grid-cols-4">
							<div>
								<p className="text-muted-foreground">Payment Date</p>
								<p className="font-medium">{formatDate(advice.paymentDate)}</p>
							</div>
							<div>
								<p className="text-muted-foreground">Payer Company</p>
								<p className="font-medium">{advice.payerCompanyName || "—"}</p>
							</div>
							<div>
								<p className="text-muted-foreground">Amount</p>
								<p className="font-medium">{formatCurrency(advice.amount)}</p>
							</div>
							<div>
								<p className="text-muted-foreground">CMP Reference No.</p>
								<p className="font-medium">{advice.cmpReferenceNo}</p>
							</div>
						</div>

						<TooltipProvider>
							<div className="overflow-x-auto rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Invoice No.</TableHead>
											<TableHead>Invoice Total</TableHead>
											<TableHead>TDS</TableHead>
											<TableHead>Retention</TableHead>
											<TableHead>Other Hold</TableHead>
											<TableHead>Previous Paid</TableHead>
											<TableHead>Expected Net</TableHead>
											<TableHead>Actual Allocated</TableHead>
											<TableHead>Shortfall</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{advice.invoiceRows.map(row => {
											const canResolve = (row.matchStatus === "UNMATCHED" || row.matchStatus === "SHORT_PAYMENT") && !row.manuallyResolved;
											return (
												<TableRow key={row._id}>
													<TableCell>
														<div className="flex items-center gap-1.5">
															{row.invoiceNumber}
															{row.previousPaidReconciliationMismatch && (
																<Tooltip>
																	<TooltipTrigger asChild>
																		<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
																	</TooltipTrigger>
																	<TooltipContent>Previous paid amount on the PDF didn&apos;t match recorded receipts — verify manually.</TooltipContent>
																</Tooltip>
															)}
														</div>
													</TableCell>
													<TableCell>{formatCurrency(row.invoiceTotalAmount)}</TableCell>
													<TableCell>{formatCurrency(row.tdsAmount)}</TableCell>
													<TableCell>{formatCurrency(row.retentionAmount)}</TableCell>
													<TableCell>{formatCurrency(row.otherHoldAmount)}</TableCell>
													<TableCell>{formatCurrency(row.previousPaidAmount)}</TableCell>
													<TableCell>{formatCurrency(row.expectedNet)}</TableCell>
													<TableCell>{formatCurrency(row.actualAllocated)}</TableCell>
													<TableCell>{row.shortfallAmount ? formatCurrency(row.shortfallAmount) : "—"}</TableCell>
													<TableCell>
														<div className="flex flex-col gap-1">
															<Badge variant={matchStatusVariant(row.matchStatus)}>{row.matchStatus.replace("_", " ")}</Badge>
															{row.manuallyResolved && (
																<Badge className="w-fit" variant="secondary">
																	Resolved
																</Badge>
															)}
														</div>
													</TableCell>
													<TableCell>
														{canResolve && (
															<Button disabled={resolveMutation.isPending} onClick={() => resolveMutation.mutate(row.invoiceNumber)} size="sm" variant="outline">
																Mark Resolved
															</Button>
														)}
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>
						</TooltipProvider>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
};

export default AdviceDetailSheet;
