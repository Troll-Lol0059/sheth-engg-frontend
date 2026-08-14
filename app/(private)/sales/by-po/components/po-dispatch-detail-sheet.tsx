"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "@config/axios";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Badge } from "@components/ui/badge";
import { Loader2 } from "lucide-react";
import { ALL_FINANCIAL_YEARS } from "@lib/financialYear";

const formatDate = (date?: string) => {
	if (!date) return "—";
	return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

type PoDispatchDetailSheetProps = {
	poNumber: string | null;
	financialYear: string;
	onClose: () => void;
};

const PoDispatchDetailSheet = ({ poNumber, financialYear, onClose }: PoDispatchDetailSheetProps) => {
	const { data, isFetching } = useQuery<PoDispatchDetail | null>({
		queryKey: ["sales-po-dispatch-detail", poNumber, financialYear],
		queryFn: async () => {
			if (!poNumber) return null;
			const fyParam = financialYear && financialYear !== ALL_FINANCIAL_YEARS ? `?financialYear=${financialYear}` : "";
			const response = await axios.get(`/api/v1/sales/by-po/${poNumber}${fyParam}`);
			return response?.data?.data as PoDispatchDetail;
		},
		enabled: !!poNumber,
	});

	return (
		<Sheet open={!!poNumber} onOpenChange={open => !open && onClose()}>
			<SheetContent className="w-full overflow-y-auto sm:max-w-4xl">
				<SheetHeader>
					<SheetTitle>PO {poNumber}</SheetTitle>
				</SheetHeader>

				{isFetching || !data ? (
					<div className="flex h-40 items-center justify-center">
						<Loader2 className="text-primary animate-spin" size={28} />
					</div>
				) : (
					<div className="flex flex-col gap-5 px-4 pb-6">
						<div className="grid grid-cols-2 gap-3 rounded-md border p-4 text-sm sm:grid-cols-4">
							<div>
								<p className="text-muted-foreground">Job Number</p>
								<p className="font-medium">{data.jobNumber || "—"}</p>
							</div>
							<div>
								<p className="text-muted-foreground">Company</p>
								<p className="font-medium">{data.companyName}</p>
							</div>
							<div>
								<p className="text-muted-foreground">PO Date</p>
								<p className="font-medium">{formatDate(data.poDate)}</p>
							</div>
							<div>
								<p className="text-muted-foreground">PO Register</p>
								{data.poFoundInRegister ? <Badge variant="secondary">Found</Badge> : <Badge variant="destructive">Not found — ordered qty unknown</Badge>}
							</div>
						</div>

						{data.items.map(item => (
							<div key={item.itemCode} className="rounded-md border">
								<div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
									<div>
										<p className="font-medium">{item.itemDescription || item.itemCode}</p>
										<p className="text-muted-foreground text-xs">Item Code: {item.itemCode}</p>
									</div>
									<div className="flex gap-4 text-sm">
										<div>
											<p className="text-muted-foreground">Ordered</p>
											<p className="font-medium">{item.orderedQty !== undefined ? item.orderedQty : "—"}</p>
										</div>
										<div>
											<p className="text-muted-foreground">Dispatched</p>
											<p className="font-medium">{item.dispatchedQty}</p>
										</div>
										<div>
											<p className="text-muted-foreground">Pending</p>
											<p className="font-medium">{item.pendingQty !== undefined ? item.pendingQty : "—"}</p>
										</div>
									</div>
								</div>

								{item.dispatchEvents.length > 0 ? (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Invoice No.</TableHead>
												<TableHead>Dispatch Date</TableHead>
												<TableHead>Qty</TableHead>
												<TableHead>Consignment No.</TableHead>
												<TableHead>Transporter</TableHead>
												<TableHead>E-way Bill No.</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{item.dispatchEvents.map((event, idx) => (
												<TableRow key={`${event.invoiceNumber}-${idx}`}>
													<TableCell>{event.invoiceNumber}</TableCell>
													<TableCell>{formatDate(event.dispatchDate)}</TableCell>
													<TableCell>
														{event.quantity} {event.uom}
													</TableCell>
													<TableCell>{event.consignmentNumber || "—"}</TableCell>
													<TableCell>{event.transporterName || "—"}</TableCell>
													<TableCell>{event.ewayBillNumber || "—"}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								) : (
									<p className="text-muted-foreground p-3 text-sm">Not dispatched yet.</p>
								)}
							</div>
						))}
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
};

export default PoDispatchDetailSheet;
