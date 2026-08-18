type PaymentAdviceRowMatchStatus = "MATCHED" | "SHORT_PAYMENT" | "UNMATCHED";

type PaymentAdviceInvoiceRow = {
	_id: string;
	invoiceNumber: string;
	docDate: string;
	bankPaymentDocNo: string;
	invoiceTotalAmount: number;
	tdsAmount: number;
	retentionAmount: number;
	otherHoldAmount: number;
	previousPaidAmount: number;
	expectedNet: number;
	actualAllocated?: number;
	matchStatus: PaymentAdviceRowMatchStatus;
	shortfallAmount?: number;
	previousPaidReconciliationMismatch?: boolean;
	followUpDraftStatus?: "DRAFTED" | "SENT";
	followUpDraftedAt?: string;
	manuallyResolved?: boolean;
	manuallyResolvedAt?: string;
};

type PaymentAdvice = {
	_id: string;
	email: string;
	utrNo: string;
	amount: number;
	paymentDate: string;
	cmpReferenceNo: string;
	payerCompanyName: string;
	invoiceRows: PaymentAdviceInvoiceRow[];
	rawPdfText: string;
	isDeleted: boolean;
	createdAt: string;
	updatedAt: string;
};

type PaymentAdviceListResult = {
	advices: PaymentAdvice[];
	total: number;
	page: number;
	size: number;
	totalPages: number;
};

type PaymentAgingInvoice = {
	invoiceNumber: string;
	invoiceDate: string;
	daysOverdue: number;
	poNumber?: string;
	companyName?: string;
};

type PaymentAgingResult = {
	invoices: PaymentAgingInvoice[];
	total: number;
	page: number;
	size: number;
	totalPages: number;
	thresholdDays: number;
};

type PaymentAdviceResolveResult = {
	resolvedCount: number;
};
