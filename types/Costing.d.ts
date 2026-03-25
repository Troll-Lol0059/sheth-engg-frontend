type CostingLabourEntry = {
	_id?: string;
	labourProcessType: string | { _id: string; name: string };
	party?: string | { _id: string; acName: string };
	rate: number;
	rateType: "PER_PIECE" | "PER_KG";
	cost: number;
};

type CostingPart = {
	_id?: string;
	partName: string;
	quantity: number;
	supplyType: "MANUAL" | "COMPLETE_SUPPLY";
	shapeType: "ROUND" | "SQUARE" | "FLAT" | "HEX" | "PIPE" | "SHEET";
	diameter: number;
	width: number;
	thickness: number;
	innerDiameter: number;
	length: number;
	density: number;
	weight: number;
	materialRate: number;
	rawMaterialParty?: string | { _id: string; acName: string };
	rawMaterialCost: number;
	labourEntries: CostingLabourEntry[];
	totalLabourCost: number;
	completeSupplyRate: number;
	completeSupplyParty?: string | { _id: string; acName: string };
	completeSupplyDate?: string;
	costPrice: number;
	profitMargin: number;
	profitAmount: number;
	partTotal: number;
};

type Costing = {
	_id: string;
	rfqItem: string | RfqLineItem;
	rfq: string | Rfq;
	parts: CostingPart[];
	totalPartsCost: number;
	packingCost: number;
	shippingCost: number;
	otherCosts: number;
	sellingPrice: number;
	totalCost: number;
	isDeleted: boolean;
	createdAt: string;
	updatedAt: string;
};
