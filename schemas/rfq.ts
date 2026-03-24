import { z } from "zod";

// ── RFQ Info Card (Edit RFQ header) ──
export const RfqInfoSchema = z.object({
	prNumber: z.string().min(1, "PR Number is required"),
	companyName: z.string().min(1, "Company name is required"),
	location: z.string().min(1, "Location is required"),
	ownerName: z.string().optional().default(""),
	startDate: z.string().min(1, "Start date is required"),
	dueDate: z.string().min(1, "Due date is required"),
	status: z.enum(["PREVIEW", "ACCEPTING_RESPONSE", "PENDING_SELECTION", "AWARDED", "COMPLETED"]),
	deliveryWeeks: z.coerce.number().min(0).max(52).optional(),
});

// ── Extraction Preview (Confirm & Create RFQ) ──
const ParsedItemSchema = z.object({
	serialNumber: z.string().optional().default(""),
	itemCode: z.string().min(1, "Item code is required"),
	itemName: z.string().min(1, "Item name is required"),
	itemDesc: z.string().optional(),
	itemType: z.string().optional(),
	quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
	drawingNumber: z.string().optional().default(""),
	technical: z
		.object({
			material: z.string().optional().default(""),
			diameter: z.string().optional().default(""),
			length: z.string().optional().default(""),
			weight: z.string().optional().default(""),
			grade: z.string().optional().default(""),
		})
		.optional(),
});

export const ExtractionConfirmSchema = z.object({
	prNumber: z.string().min(1, "PR Number is required"),
	companyName: z.string().min(1, "Company name is required"),
	location: z.string().min(1, "Location is required"),
	supplyType: z.string().optional().default(""),
	ownerName: z.string().optional().default(""),
	dueDate: z.string().optional().default(""),
	items: z.array(ParsedItemSchema).min(1, "At least one item is required"),
});

// ── Item Master (Edit item name/type) ──
export const ItemMasterSchema = z.object({
	itemName: z.string().min(1, "Item name is required"),
	itemType: z.enum(["UNIT", "SET", "ASSEMBLY"], { required_error: "Item type is required" }),
});

// ── Line Item Tech Specs ──
const HardnessEntrySchema = z.object({
	hardnessType: z.string().min(1, "Hardness type is required"),
	value: z.string().min(1, "Value is required"),
	measurement: z.string().min(1, "Measurement is required"),
});

export const LineItemSchema = z.object({
	quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
	drawingNumber: z.string().optional().default(""),
	itemTechSpecs: z.object({
		material: z.string().optional().default(""),
		diameter: z.string().optional().default(""),
		length: z.string().optional().default(""),
		weight: z.string().optional().default(""),
		grade: z.string().optional().default(""),
		remarks: z.string().optional().default(""),
		hardness: z.array(HardnessEntrySchema).default([]),
	}),
});

// ── BOM Entry (SET/ASSEMBLY parts) ──
const BomHardnessSchema = z.object({
	hardnessType: z.string().min(1, "Type is required"),
	value: z.string().min(1, "Value is required"),
	measurement: z.string().min(1, "Measurement is required"),
});

const BomEntrySchema = z.object({
	partName: z.string().min(1, "Part name is required"),
	partDescription: z.string().optional().default(""),
	material: z.string().optional().default(""),
	quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
	diameter: z.string().optional().default(""),
	length: z.string().optional().default(""),
	weight: z.string().optional().default(""),
	density: z.string().optional().default("7.85"),
	grade: z.string().optional().default(""),
	make: z.string().optional().default(""),
	remarks: z.string().optional().default(""),
	hardness: z.array(BomHardnessSchema).default([]),
});

export const BomSchema = z.object({
	bom: z.array(BomEntrySchema).min(1, "At least one BOM entry is required"),
});

// ── Costing Dialog ──
const LabourEntrySchema = z.object({
	labourProcessType: z.string().min(1, "Process type is required"),
	party: z.string().optional().default(""),
	rate: z.coerce.number().min(0),
	rateType: z.enum(["PER_PIECE", "PER_KG"]),
});

const CostingPartSchema = z.object({
	partName: z.string().min(1, "Part name is required"),
	quantity: z.coerce.number().min(1),
	supplyType: z.enum(["MANUAL", "COMPLETE_SUPPLY"]),
	// Manual fields
	diameter: z.coerce.number().min(0).default(0),
	length: z.coerce.number().min(0).default(0),
	density: z.coerce.number().min(0).default(7.85),
	materialRate: z.coerce.number().min(0).default(0),
	rawMaterialParty: z.string().optional().default(""),
	labourEntries: z.array(LabourEntrySchema).default([]),
	// Complete supply fields
	completeSupplyRate: z.coerce.number().min(0).default(0),
	completeSupplyParty: z.string().optional().default(""),
	completeSupplyDate: z.string().optional().default(""),
	// Common
	profitMargin: z.coerce.number().min(0).default(0),
});

export const CostingSchema = z.object({
	parts: z.array(CostingPartSchema).min(1, "At least one part is required"),
	packingCost: z.coerce.number().min(0).default(0),
	shippingCost: z.coerce.number().min(0).default(0),
	otherCosts: z.coerce.number().min(0).default(0),
});

// Export inferred types
export type RfqInfoFormValues = z.infer<typeof RfqInfoSchema>;
export type ExtractionConfirmFormValues = z.infer<typeof ExtractionConfirmSchema>;
export type ItemMasterFormValues = z.infer<typeof ItemMasterSchema>;
export type LineItemFormValues = z.infer<typeof LineItemSchema>;
export type BomFormValues = z.infer<typeof BomSchema>;
export type CostingFormValues = z.infer<typeof CostingSchema>;
