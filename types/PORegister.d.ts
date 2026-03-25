type POLineItem = {
	_id?: string;
	serialNumber: number;
	itemCode: string;
	itemDescription: string;
	drawingNumber: string;
	quantity: number;
	rate: number;
	basicValue: number;
	igst: number;
	roundOff: number;
	netAmount: number;
};

type PORegister = {
	_id: string;
	poNumber: string;
	jobNumber: string;
	poDate: string;
	deliveryDate?: string;
	prNumber?: string;
	companyName: string;
	client?: string | { _id: string; companyName: string };
	items: POLineItem[];
	totalBasicValue: number;
	totalTax: number;
	totalRoundOff: number;
	totalNetAmount: number;
	isDeleted: boolean;
	createdAt: string;
	updatedAt: string;
};

type POStats = {
	totalPOs: number;
	totalValue: number;
	totalCompanies: number;
	byCompany: { _id: string; count: number; totalValue: number }[];
	byYear: { _id: number; count: number; totalValue: number }[];
};
