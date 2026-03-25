import type { HelpSection } from "@components/common/module-help";

// ── RFQ Module ──

export const rfqPendingHelp: HelpSection[] = [
	{
		title: "What are Pending RFQs?",
		content: [
			"Pending RFQs are quotation requests that have not yet been quoted.",
			"They appear here until you complete costing and mark them as quoted.",
		],
	},
	{
		title: "Creating a New RFQ",
		content: [
			"Click the \"Add RFQ\" button in the top-right corner.",
			"Upload the RFQ document (PDF) — the system will auto-extract items using AI.",
			"Review the extracted data: PR number, company name, location, owner, and line items.",
			"Edit any incorrectly extracted fields before confirming.",
			"Click \"Confirm & Create\" to save the RFQ with all its line items.",
		],
	},
	{
		title: "Searching & Filtering",
		content: [
			"Use the search bar to filter by PR number, company name, or item details.",
			"Click column headers to sort ascending or descending.",
			"Use the \"Columns\" dropdown to show or hide specific columns.",
			"Click \"Reset\" to clear all filters and sorting.",
		],
	},
	{
		title: "Viewing an RFQ",
		content: [
			"Click the eye icon or the row to open the RFQ detail view.",
			"The detail view shows all line items, costing, and technical specs.",
		],
	},
];

export const rfqAllHelp: HelpSection[] = [
	{
		title: "All RFQs Overview",
		content: [
			"This page shows every RFQ in the system regardless of status.",
			"Use it for a complete overview of all quotation activity.",
			"RFQs are sorted by creation date (newest first) by default.",
		],
	},
	{
		title: "RFQ Statuses",
		content: [
			"Pending — Not yet quoted, costing is in progress.",
			"Quoted — Costing complete, offer has been submitted.",
			"Revised — A previously quoted RFQ that has been updated.",
			"Regret — RFQ was declined or not quoted.",
		],
	},
	{
		title: "Searching & Sorting",
		content: [
			"Use the search bar to quickly find any RFQ by PR number or company.",
			"Click column headers to sort by any field.",
			"Toggle column visibility with the Columns button.",
		],
	},
];

export const rfqQuotedHelp: HelpSection[] = [
	{
		title: "Quoted RFQs",
		content: [
			"Shows all RFQs where costing has been completed and a quotation was sent.",
			"Sorted by quoted date (most recent first).",
			"You can click into any RFQ to review the quoted prices and details.",
		],
	},
	{
		title: "Revising a Quoted RFQ",
		content: [
			"Open the RFQ and update the costing or line item details.",
			"The system will automatically track it as a revision.",
			"The revised RFQ will appear under both Quoted and Revised tabs.",
		],
	},
];

export const rfqRevisedHelp: HelpSection[] = [
	{
		title: "Revised RFQs",
		content: [
			"Shows RFQs that were originally quoted but later updated.",
			"Sorted by revision date (newest first).",
			"Use this to track all price revisions and re-quotations.",
		],
	},
];

export const rfqRegretHelp: HelpSection[] = [
	{
		title: "Regret RFQs",
		content: [
			"Shows RFQs that were not quoted or declined.",
			"Sorted by regret date (newest first).",
			"Marking an RFQ as regret removes it from the pending queue.",
		],
	},
];

export const rfqViewHelp: HelpSection[] = [
	{
		title: "RFQ Detail View",
		content: [
			"This page shows the complete details of a single RFQ.",
			"The top card shows RFQ info: PR number, company, dates, delivery weeks, and status.",
			"Below are three tabs: Line Items, Costing Summary, and Technical Summary.",
		],
	},
	{
		title: "Editing RFQ Info",
		content: [
			"Click the edit icon on the RFQ info card to modify dates, delivery weeks, or status.",
			"Status options: Preview, Accepting Response, Pending Selection, Awarded, Completed.",
			"Changes are saved immediately when you click Save.",
		],
	},
	{
		title: "Line Items Tab",
		content: [
			"Shows all items in this RFQ as expandable cards.",
			"Click any item card to expand and see full details.",
			"Edit item name, item type, quantity, drawing number, and technical specs.",
			"For SET/ASSEMBLY items, you can manage the BOM (Bill of Materials).",
			"Upload technical drawings per item using the upload button.",
			"Use bulk drawing upload to attach drawings to multiple items at once.",
		],
	},
	{
		title: "Managing BOM (Bill of Materials)",
		content: [
			"BOM is available for SET and ASSEMBLY type items.",
			"Click \"Edit BOM\" to add, remove, or modify sub-parts.",
			"Each BOM entry has: part name, material, quantity, dimensions, grade, hardness, and remarks.",
			"BOM data flows into the costing and technical offer automatically.",
		],
	},
	{
		title: "Costing Summary Tab",
		content: [
			"Shows all line items with their costing status.",
			"Click \"Add Costing\" or \"Edit Costing\" on any item to open the costing dialog.",
			"Download the costing sheet as PDF or Excel using the buttons at the top.",
			"The summary shows cost price, selling price, and total cost per item.",
		],
	},
	{
		title: "Adding / Editing Costing",
		content: [
			"The costing dialog has two modes: Manual Costing and Complete Supply.",
			"Manual Costing: Enter raw material dimensions, shape, density, and rate. The system calculates weight and cost automatically.",
			"Add labour entries with process type, vendor, rate (per piece or per kg).",
			"Complete Supply: Enter the vendor rate per piece and select the supplier.",
			"Set profit margin percentage — profit amount is calculated automatically.",
			"Add packing, shipping, and other costs at the bottom.",
			"Upload proof documents for raw material, labour entries, or complete supply as supporting evidence.",
			"Use \"Clone from Previous\" to copy costing from a similar item quoted before.",
		],
	},
	{
		title: "Shape-Based Weight Calculation",
		content: [
			"Round Bar: Uses diameter and length.",
			"Square Bar: Uses width and length.",
			"Flat / Rectangle: Uses width, thickness, and length.",
			"Hex Bar: Uses diameter (across flats) and length.",
			"Pipe / Tube: Uses outer diameter, inner diameter, and length.",
			"Sheet / Plate: Uses width, length, and thickness.",
			"Select a material preset (Steel, SS304, Aluminium, etc.) to auto-fill density.",
		],
	},
	{
		title: "Rate History",
		content: [
			"Click the clock icon next to any supplier field to see the last 5 rates.",
			"Shows the rate, item code, PR number, and date for each historical entry.",
			"Helps you make informed pricing decisions based on past quotations.",
		],
	},
	{
		title: "Proof Documents",
		content: [
			"Each costing section (raw material, labour, complete supply) has an optional proof document upload.",
			"Click the \"Proof\" button to upload a supporting document (PDF, image, Excel, or Word).",
			"Once uploaded, a link appears to view/download the proof.",
			"Click the X icon next to the link to remove the proof document.",
		],
	},
	{
		title: "Technical Summary Tab",
		content: [
			"Shows all line items with their technical specifications.",
			"Edit material, grade, hardness, drawing number, and remarks per item.",
			"For SET/ASSEMBLY items, BOM details are shown with sub-part specs.",
			"Download the technical offer as PDF or Excel.",
			"Download the commercial offer as PDF or Excel.",
		],
	},
	{
		title: "Downloading Offers",
		content: [
			"Use the download buttons at the top of the Costing Summary or Technical Summary tabs.",
			"Costing Sheet: Internal document showing cost breakdown (PDF or Excel).",
			"Technical Offer: Document sent to client with technical specifications.",
			"Commercial Offer: Document sent to client with pricing details.",
			"Downloaded files are named with the PR number (e.g., \"Commercial Offer - PR-2024-001.pdf\").",
		],
	},
	{
		title: "Marking as Quoted",
		content: [
			"Once costing and offers are ready, click \"Mark as Quoted\" at the top.",
			"This moves the RFQ from Pending to Quoted status.",
			"The quoted date is recorded automatically.",
		],
	},
	{
		title: "Item History",
		content: [
			"Click the history icon on any line item to see its change history.",
			"Shows all past revisions with dates and what changed.",
		],
	},
];

// ── Master Module ──

export const rawMaterialTypesHelp: HelpSection[] = [
	{
		title: "What are Raw Material Types?",
		content: [
			"Raw material types define the categories of materials used in manufacturing.",
			"Examples: Mild Steel, Stainless Steel 304, Aluminium 6061, Brass, etc.",
			"These types are used when selecting materials in the Party Master and Costing modules.",
		],
	},
	{
		title: "Adding a Raw Material Type",
		content: [
			"Click \"Add\" in the top-right corner.",
			"Enter the name and optional description.",
			"Click Save to create the new material type.",
		],
	},
	{
		title: "Editing & Deleting",
		content: [
			"Click the actions menu (three dots) on any row to edit or delete.",
			"Editing updates the name/description across the system.",
			"Deleting removes the material type — use with caution if already referenced.",
		],
	},
];

export const labourProcessTypesHelp: HelpSection[] = [
	{
		title: "What are Labour Process Types?",
		content: [
			"Labour process types define the types of manufacturing operations.",
			"Examples: Turning, Milling, Grinding, Heat Treatment, Drilling, etc.",
			"These appear as options when adding labour entries in the Costing dialog.",
		],
	},
	{
		title: "Adding a Labour Process Type",
		content: [
			"Click \"Add\" in the top-right corner.",
			"Enter the process name and optional description.",
			"Click Save to create it.",
		],
	},
	{
		title: "Editing & Deleting",
		content: [
			"Click the actions menu on any row to edit or delete.",
			"Renaming a process type updates it everywhere it is referenced.",
		],
	},
];

export const hardnessTypesHelp: HelpSection[] = [
	{
		title: "What are Hardness Types?",
		content: [
			"Hardness types define the different hardness scales used for material specifications.",
			"Examples: HRC (Rockwell C), HRB (Rockwell B), BHN (Brinell), HV (Vickers).",
			"These are used when specifying hardness requirements in technical specs and BOM.",
		],
	},
	{
		title: "Managing Hardness Types",
		content: [
			"Click \"Add\" to create a new hardness type.",
			"Use the actions menu to edit or delete existing types.",
		],
	},
];

export const hardnessMeasurementsHelp: HelpSection[] = [
	{
		title: "What are Hardness Measurements?",
		content: [
			"Hardness measurements define the units and scales for hardness values.",
			"Used alongside hardness types to fully specify a material's hardness requirement.",
			"Example: A spec might read \"HRC: 58-62\" where HRC is the type and the range is the measurement.",
		],
	},
	{
		title: "Managing Measurements",
		content: [
			"Click \"Add\" to create a new measurement definition.",
			"Use the actions menu on each row to edit or delete.",
		],
	},
];

// ── Party Master ──

export const partyHelp: HelpSection[] = [
	{
		title: "What is Party Master?",
		content: [
			"Party Master manages all your vendors, suppliers, and job workers.",
			"Each party has a type: Raw Material Dealer, Labour Job Worker, or Complete Supply.",
			"Party records are used throughout the system for supplier selection in costing.",
		],
	},
	{
		title: "Adding a Party",
		content: [
			"Click \"Add Party\" in the top-right corner.",
			"Fill in the party details: account name, contact person, mobile, email, address.",
			"Select the party type (Raw Material, Labour, or Complete Supply).",
			"Optionally select a sub-type if applicable.",
			"Add tax details: GSTIN, PAN, TAN as needed.",
			"Click Save to create the party record.",
		],
	},
	{
		title: "Importing from Excel",
		content: [
			"Click \"Import Excel\" to bulk import party records.",
			"Upload an Excel file with the required columns.",
			"Review the import results — successful and failed rows are shown separately.",
			"Fix any errors and re-import the failed rows if needed.",
		],
	},
	{
		title: "Editing & Deleting Parties",
		content: [
			"Click the actions menu (three dots) on any row.",
			"Select Edit to modify party details.",
			"Select Delete to remove the party — this is permanent.",
		],
	},
	{
		title: "Searching & Filtering",
		content: [
			"Use the search bar to filter by account name, contact person, or email.",
			"Sort by any column by clicking the column header.",
			"Toggle column visibility using the Columns dropdown.",
		],
	},
];

export const vendorComparisonHelp: HelpSection[] = [
	{
		title: "Vendor Comparison",
		content: [
			"Compare rates across different vendors for the same materials.",
			"Helps you identify the best-priced supplier for each material type.",
			"Data is pulled from rate history — past costing entries for each vendor.",
		],
	},
	{
		title: "Using the Comparison",
		content: [
			"Select the comparison type (material, labour, or supply).",
			"The table shows each vendor's rates side by side.",
			"Use this to negotiate better rates or select optimal suppliers.",
		],
	},
];

// ── PO Register ──

export const poRegisterHelp: HelpSection[] = [
	{
		title: "What is PO Register?",
		content: [
			"The PO Register tracks all Purchase Orders received from clients.",
			"Import POs from Excel files to maintain a centralized record.",
			"View statistics: total POs, total value, and breakdowns by company and year.",
		],
	},
	{
		title: "Importing POs",
		content: [
			"Click the import button to upload an Excel file with PO data.",
			"The system reads columns and creates PO records automatically.",
			"Review imported data for accuracy after import.",
		],
	},
	{
		title: "Viewing PO Details",
		content: [
			"Click any PO row to open its detail page.",
			"The detail page shows all line items, quantities, rates, and amounts.",
			"View delivery schedules and status information.",
		],
	},
	{
		title: "PO Statistics",
		content: [
			"The top section shows key metrics: total POs, total value, number of companies.",
			"Breakdown by company shows which clients have the most orders.",
			"Breakdown by year shows ordering trends over time.",
		],
	},
	{
		title: "Searching & Filtering",
		content: [
			"Use the search bar to find POs by number, company, or item details.",
			"Filter by client using the client dropdown.",
			"Sort by any column for quick navigation.",
		],
	},
];

export const poDetailHelp: HelpSection[] = [
	{
		title: "PO Detail View",
		content: [
			"Shows complete information for a single Purchase Order.",
			"Includes PO number, date, client, delivery details, and all line items.",
			"Each line item shows: item description, quantity, unit, rate, and amount.",
		],
	},
];

// ── Client Master ──

export const clientMasterHelp: HelpSection[] = [
	{
		title: "What is Client Master?",
		content: [
			"Client Master manages your client company records.",
			"Clients are the companies that send you RFQs and Purchase Orders.",
			"Client data is used in PO Register for associating orders with companies.",
		],
	},
	{
		title: "Adding a Client",
		content: [
			"Click the add button to create a new client record.",
			"Enter the company name, contact details, and address.",
			"Save to add the client to the system.",
		],
	},
	{
		title: "Editing & Deleting",
		content: [
			"Use the actions menu on any row to edit or delete a client.",
			"Editing updates the client details across all linked POs.",
		],
	},
];

// ── Staff Management ──

export const staffHelp: HelpSection[] = [
	{
		title: "What is Staff Management?",
		content: [
			"Staff Management lets admins create and manage user accounts.",
			"Each staff member gets login credentials and a role that controls access.",
			"Only Owner and Admin roles can access this module.",
		],
	},
	{
		title: "Staff Roles",
		content: [
			"Owner — Full access to everything. Cannot be edited or deleted by others.",
			"Admin — Full access including staff management.",
			"Office Staff — Access to operational features (RFQ, costing, etc.).",
			"Field Staff — Limited access for field-related tasks.",
		],
	},
	{
		title: "Creating a Staff Member",
		content: [
			"Click \"Add Staff\" in the top-right corner.",
			"Enter username (must be unique, letters/numbers/underscores only).",
			"Enter email address (must be unique).",
			"Fill in first name, last name, and optionally middle name and phone.",
			"Select a role from the dropdown.",
			"Set a password (min 8 chars, must include uppercase, lowercase, and a number).",
			"Click Create to add the staff member.",
		],
	},
	{
		title: "Editing Staff Details",
		content: [
			"Click the actions menu (three dots) on any staff row.",
			"Select Edit to update name, email, phone, or role.",
			"Username cannot be changed after creation.",
			"The Owner account cannot be edited.",
		],
	},
	{
		title: "Resetting a Password",
		content: [
			"Click the actions menu and select \"Reset Password\".",
			"Enter the new password in the dialog.",
			"The same password requirements apply (8+ chars, mixed case, number).",
			"The staff member will need to use the new password on their next login.",
		],
	},
	{
		title: "Deleting a Staff Member",
		content: [
			"Click the actions menu and select Delete.",
			"Confirm the deletion in the dialog — this cannot be undone.",
			"The Owner account cannot be deleted.",
			"Deleted staff members lose access immediately.",
		],
	},
];

// ── Profile ──

export const profileHelp: HelpSection[] = [
	{
		title: "Your Profile",
		content: [
			"View and update your personal details: name, email, and phone number.",
			"Your username and role are shown but cannot be changed here.",
		],
	},
	{
		title: "Changing Your Password",
		content: [
			"Use the Change Password section to update your login password.",
			"Enter your current password for verification.",
			"Enter and confirm your new password.",
			"Password must be at least 8 characters with uppercase, lowercase, and a number.",
		],
	},
];

// ── Settings / Company Profile ──

export const companyProfileHelp: HelpSection[] = [
	{
		title: "What is Company Profile?",
		content: [
			"Company Profile stores your company's details used across the system.",
			"This information appears on generated PDFs and Excel documents (offers, costing sheets).",
			"Includes company name, tagline, address, phone, GSTIN, vendor code, and contact person.",
		],
	},
	{
		title: "Editing Company Details",
		content: [
			"Update any field and click Save to apply changes.",
			"Company Name: Appears on all generated documents as the letterhead.",
			"Tagline: Shown below the company name on documents.",
			"GSTIN: Displayed on commercial and technical offers.",
			"Vendor Code: Shown on offer documents for client reference.",
			"Address & Phone: Appear in the letterhead area of documents.",
		],
	},
	{
		title: "Contact Person",
		content: [
			"Contact Person Name: Appears in the signature section of offers.",
			"Contact Person Phone: Shown below the name in the signature area.",
			"If no contact person is set, the RFQ owner name is used instead.",
		],
	},
	{
		title: "Company Logo",
		content: [
			"Upload your company logo using the logo upload section.",
			"The logo appears on the top-right of all generated PDF and Excel documents.",
			"Supported formats: PNG, JPG. Recommended size: 200x100 pixels or similar.",
			"The logo is stored in the cloud and automatically included in future documents.",
		],
	},
];
