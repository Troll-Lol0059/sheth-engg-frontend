type CostingLabourEntry = {
	_id?: string;
	labourProcessType: string | { _id: string; name: string };
	party?: string | { _id: string; acName: string };
	rate: number;
	rateType: "PER_PIECE" | "PER_KG";
	cost: number;
};

type Costing = {
	_id: string;
	rfqItem: string | RfqLineItem;
	rfq: string | Rfq;
	diameter: number;
	length: number;
	density: number;
	weight: number;
	materialRate: number;
	rawMaterialParty?: string | { _id: string; acName: string };
	rawMaterialCost: number;
	labourEntries: CostingLabourEntry[];
	totalLabourCost: number;
	costPrice: number;
	profitMargin: number;
	profitAmount: number;
	packingCost: number;
	shippingCost: number;
	otherCosts: number;
	sellingPrice: number;
	totalCost: number;
	isDeleted: boolean;
	createdAt: string;
	updatedAt: string;
};
