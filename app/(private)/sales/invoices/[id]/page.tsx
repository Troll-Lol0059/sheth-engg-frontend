import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Badge } from "@components/ui/badge";
import { notFound } from "next/navigation";
import EditTransportDetailsDialog from "./components/edit-transport-details-dialog";
import EditInvoiceTransportDetailsDialog from "./components/edit-invoice-transport-details-dialog";

const formatCurrency = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

const formatDate = (date?: string) => {
	if (!date) return "—";
	return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

type InvoiceDetailPageProps = {
	params: Promise<{ id: string }>;
};

const InvoiceDetailPage = async ({ params }: InvoiceDetailPageProps) => {
	const { id } = await params;
	const detail = await fetchInvoiceDetail(id);

	if (!detail) {
		notFound();
	}

	const { header, items } = detail;

	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex items-start justify-between">
				<div>
					<Link href="/sales" className="text-muted-foreground mb-2 flex items-center gap-1 text-sm hover:underline">
						<ArrowLeft size={14} />
						Back to Sales
					</Link>
					<h1 className="text-2xl font-bold">Invoice {header.invoiceNumber}</h1>
				</div>
				<EditInvoiceTransportDetailsDialog
					id={id}
					invoiceNumber={header.invoiceNumber}
					defaultValues={{
						transporterName: header.transporterName ?? "",
						transporterGstin: header.transporterGstin ?? "",
						consignmentNumber: items[0]?.consignmentNumber ?? "",
					}}
				/>
			</div>

			<div className="grid grid-cols-2 gap-3 rounded-md border p-4 text-sm sm:grid-cols-3">
				<div>
					<p className="text-muted-foreground">Dispatch Date</p>
					<p className="font-medium">{formatDate(header.dispatchDate)}</p>
				</div>
				<div>
					<p className="text-muted-foreground">Financial Year</p>
					<p className="font-medium">FY {header.financialYear}</p>
				</div>
				<div>
					<p className="text-muted-foreground">PO Number</p>
					<p className="max-w-[220px] truncate font-medium" title={header.poReference}>
						{header.poNumber || header.poReference || "—"}
					</p>
				</div>
				<div>
					<p className="text-muted-foreground">Company</p>
					<p className="font-medium">{header.companyName}</p>
				</div>
				<div>
					<p className="text-muted-foreground">Transporter</p>
					<p className="font-medium">{header.transporterName || "—"}</p>
				</div>
				<div>
					<p className="text-muted-foreground">Total Net Amount</p>
					<p className="font-medium">{formatCurrency(header.totalNetAmount)}</p>
				</div>
			</div>

			<div className="overflow-x-auto rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Sr.</TableHead>
							<TableHead>Item Code</TableHead>
							<TableHead>Item Name</TableHead>
							<TableHead>Drawing No.</TableHead>
							<TableHead>Qty</TableHead>
							<TableHead>Rate</TableHead>
							<TableHead>Net Amount</TableHead>
							<TableHead>Consignment No.</TableHead>
							<TableHead>E-way Bill No.</TableHead>
							<TableHead>Barcode</TableHead>
							<TableHead>Transporter</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.map(item => (
							<TableRow key={item._id}>
								<TableCell>{item.serialNumber}</TableCell>
								<TableCell>{item.itemCode}</TableCell>
								<TableCell className="max-w-[220px]">
									<span className="block truncate" title={item.itemName}>
										{item.itemName}
									</span>
								</TableCell>
								<TableCell className="max-w-[160px]">
									<span className="block truncate" title={item.drawingNumber}>
										{item.drawingNumber || "—"}
									</span>
								</TableCell>
								<TableCell>
									{item.quantity} {item.uom}
								</TableCell>
								<TableCell>{formatCurrency(item.rate)}</TableCell>
								<TableCell className="font-medium">{formatCurrency(item.netAmount)}</TableCell>
								<TableCell>{item.consignmentNumber || "—"}</TableCell>
								<TableCell>{item.ewayBillNumber || "—"}</TableCell>
								<TableCell>{item.barcode || "—"}</TableCell>
								<TableCell>{item.transporterName || "—"}</TableCell>
								<TableCell>
									<EditTransportDetailsDialog sale={item} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<div className="flex items-center gap-2">
				<Badge variant="secondary">Dispatched</Badge>
				<span className="text-muted-foreground text-sm">{items.length} line item(s)</span>
			</div>
		</div>
	);
};

export default InvoiceDetailPage;

const fetchInvoiceDetail = async (id: string): Promise<SalesInvoiceDetail | null> => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	const headers = { cookie: `accessToken=${token}; refreshToken=${refreshToken}` };

	try {
		const response = await axios.get(`/api/v1/sales/invoices/${id}`, { headers });
		return (response?.data?.data ?? null) as SalesInvoiceDetail | null;
	} catch {
		return null;
	}
};
