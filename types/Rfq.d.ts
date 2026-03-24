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
	remarks?: string;
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
	density?: string;
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
	activeTechnicalOffer?: string;
	quotedItemCount?: number;
	isDeleted: boolean;
	createdAt: string;
	updatedAt: string;
};

// ── Technical Offer (versioned) ──

type TechOfferChangeRequest = {
	_id: string;
	itemCode: string;
	field: string;
	currentValue: string;
	requestedValue: string;
	notes: string;
	resolved: boolean;
};

type TechOfferSnapshotHardness = {
	hardnessType: string;
	value: string;
	measurement: string;
};

type TechOfferSnapshotBom = {
	partName: string;
	material: string;
	grade: string;
	quantity: number;
	hardness: TechOfferSnapshotHardness[];
	remarks: string;
};

type TechOfferSnapshotItem = {
	serialNumber: string;
	itemCode: string;
	itemName: string;
	itemDesc: string;
	itemType: string;
	quantity: number;
	drawingNumber: string;
	material: string;
	grade: string;
	hardness: TechOfferSnapshotHardness[];
	remarks: string;
	bom: TechOfferSnapshotBom[];
};

type TechOfferSnapshot = {
	prNumber: string;
	companyName: string;
	location: string;
	ownerName: string;
	deliveryWeeks: number;
	items: TechOfferSnapshotItem[];
};

type TechOfferStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "REVISION_REQUESTED" | "APPROVED" | "SUPERSEDED";

type TechnicalOffer = {
	_id: string;
	rfq: string;
	version: number;
	status: TechOfferStatus;
	snapshot: TechOfferSnapshot;
	pdfUrl: string;
	excelUrl: string;
	changeRequests: TechOfferChangeRequest[];
	reviewRemarks: string;
	generatedBy?: { _id: string; name: string; email: string };
	submittedAt?: string;
	reviewedAt?: string;
	approvedBy?: string;
	approvedAt?: string;
	createdAt: string;
	updatedAt: string;
};

// ── Commercial Offer (versioned) ──

type CommercialOfferChangeRequest = {
	_id: string;
	itemCode: string;
	field: string;
	currentValue: string;
	requestedValue: string;
	notes: string;
	resolved: boolean;
};

type CommercialOfferSnapshotItem = {
	serialNumber: string;
	itemCode: string;
	itemName: string;
	material: string;
	quantity: number;
	sellingPrice: number;
	hsnCode: string;
	gstPercent: number;
	totalBeforeGst: number;
	gstAmount: number;
	totalWithGst: number;
};

type CommercialOfferSnapshot = {
	prNumber: string;
	companyName: string;
	location: string;
	ownerName: string;
	deliveryWeeks: number;
	items: CommercialOfferSnapshotItem[];
	grandTotalBeforeGst: number;
	grandGstAmount: number;
	grandTotalWithGst: number;
};

type CommercialOfferStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "REVISION_REQUESTED" | "APPROVED" | "SUPERSEDED";

type CommercialOffer = {
	_id: string;
	rfq: string;
	version: number;
	status: CommercialOfferStatus;
	snapshot: CommercialOfferSnapshot;
	pdfUrl: string;
	excelUrl: string;
	changeRequests: CommercialOfferChangeRequest[];
	reviewRemarks: string;
	generatedBy?: { _id: string; name: string; email: string };
	submittedAt?: string;
	reviewedAt?: string;
	approvedBy?: string;
	approvedAt?: string;
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
