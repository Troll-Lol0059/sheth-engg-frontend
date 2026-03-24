type Hardness = {
	_id?: string;
	hardnessType: string;
	value: string;
	measurement: string;
};

type RfqItemTechSpecs = {
	_id: string;
	material: string;
	diameter: string;
	length: string;
	weight: string;
	grade: string;
	hardness?: Hardness[];
};

type RfqItemCommercialSpecs = {
	_id: string;
	currency: string;
	rawMaterialCost: number;
	laborCost: number;
	profitMargin: number;
	totalCost: number;
	packingCost: number;
	shippingCost: number;
	sellingPrice: number;
	otherCosts: number;
};

type BomHardness = {
	_id?: string;
	hardnessType: string;
	value: string;
	measurement: string;
};

type BomEntry = {
	_id?: string;
	partName: string;
	partDescription?: string;
	material?: string;
	quantity: number;
	diameter?: string;
	length?: string;
	weight?: string;
	grade?: string;
	make?: string;
	remarks?: string;
	hardness?: BomHardness[];
};

type RfqItemMaster = {
	_id: string;
	itemCode: string;
	itemName: string;
	itemDesc: string;
	itemType: string;
	size: string;
	bom?: BomEntry[];
};

type RfqLineItem = {
	_id: string;
	serialNumber?: string;
	item: RfqItemMaster;
	quantity: number;
	drawingNumber: string;
	drawingUrl: string;
	itemTechSpecs: RfqItemTechSpecs;
	commercialSpecs: RfqItemCommercialSpecs;
	isDeleted: boolean;
};

type Rfq = {
	_id: string;
	prNumber: string;
	startDate: string;
	dueDate: string;
	ownerName: string;
	companyName: string;
	location: string;
	isQuoted: boolean;
	quotedOn?: string;
	quotationNumber?: number;
	isRevised: boolean;
	revisionDate?: string;
	isRegret: boolean;
	regretDate?: string;
	status: "PENDING_SELECTION" | "AWARDED" | "COMPLETED" | "PREVIEW" | "ACCEPTING_RESPONSE";
	deliveryWeeks?: number;
	items: RfqLineItem[] | string[];
	quotedItemCount?: number;
	isDeleted: boolean;
	createdAt: string;
	updatedAt: string;
};

type ParsedItem = {
	serialNumber?: string;
	itemCode: string;
	itemName: string;
	itemDesc?: string;
	itemType?: string;
	quantity: number;
	drawingNumber?: string;
	technical?: {
		material?: string;
		diameter?: string;
		length?: string;
		weight?: string;
		grade?: string;
	};
};

type ExtractionResponse = {
	statusCode: number;
	data: {
		extraction: {
			layer: string;
			status: string;
			confidence: number;
			errors: string[];
		};
		extractedData: {
			prNumber: string;
			supplyType: string;
			location: string;
			companyName: string;
			items: ParsedItem[];
			rawText: string;
		};
		rawText: string;
		fileUrl?: string;
		originalFilename?: string;
	};
	message: string;
	success: boolean;
};

type ConfirmPayload = {
	prNumber: string;
	supplyType: string;
	location: string;
	companyName: string;
	dueDate: string;
	ownerName: string;
	items: ParsedItem[];
};
