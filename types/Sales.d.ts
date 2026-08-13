type SalesRecord = {
	_id: string;
	invoiceNumber: string;
	invoiceDate: string;
	dispatchDate: string;
	poReference: string;
	poNumber?: string;
	companyName: string;
	gstin?: string;
	consignmentNumber?: string;
	transporterId?: number;
	transporterName?: string;
	transporterGstin?: string;
	ewayBillNumber?: string;
	serialNumber: number;
	itemCode: string;
	itemName: string;
	materialRemarks?: string;
	drawingNumber?: string;
	uom?: string;
	quantity: number;
	rate: number;
	basicValue: number;
	sgstAmount: number;
	cgstAmount: number;
	igstAmount: number;
	netAmount: number;
	status: string;
	isDeleted: boolean;
	createdAt: string;
	updatedAt: string;
};

type SalesOverview = {
	totalValue: number;
	totalQuantity: number;
	totalInvoices: number;
	totalCompanies: number;
};

type SalesTrendPoint = {
	year: number;
	month: number;
	totalValue: number;
	totalQuantity: number;
	invoiceCount: number;
};

type SalesTopCustomer = {
	companyName: string;
	totalValue: number;
	totalQuantity: number;
};

type SalesTopItem = {
	itemCode: string;
	itemName: string;
	totalValue: number;
	totalQuantity: number;
};

type SalesStats = {
	overview: SalesOverview;
	trend: SalesTrendPoint[];
	topCustomers: SalesTopCustomer[];
	topItems: SalesTopItem[];
};

type PoFulfillmentLineItem = {
	itemCode: string;
	itemDescription: string;
	orderedQty: number;
	dispatchedQty: number;
	pendingQty: number;
	fulfillmentPct: number;
};

type PoFulfillmentEntry = {
	poNumber: string;
	jobNumber: string;
	companyName: string;
	poDate: string;
	status: "FULLY_DISPATCHED" | "PARTIALLY_DISPATCHED" | "NOT_DISPATCHED";
	pendingQty: number;
	items: PoFulfillmentLineItem[];
};

type PoFulfillmentSummary = {
	fullyDispatched: number;
	partiallyDispatched: number;
	notDispatched: number;
};

type PoFulfillmentResult = {
	summary: PoFulfillmentSummary;
	pos: PoFulfillmentEntry[];
};
