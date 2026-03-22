type PageSize = {
	uuid: string;
	label: string;
	value: number;
};

export const pageSizes: PageSize[] = [
	{ uuid: "9eae10e5-e0a9-4d85-bdcd-ce468fc64f15", label: "10", value: 10 },
	{ uuid: "9eae10e5-e0b7-4a2b-9570-888d5d38820e", label: "20", value: 20 },
	{ uuid: "9eae10e5-e0bb-4830-aad1-f7d14c0adef6", label: "50", value: 50 },
	{ uuid: "9eae10e5-e0bf-4035-8580-b3288941057e", label: "100", value: 100 },
];

export const cardPageSizes: PageSize[] = [
	{ uuid: "9eae10e5-e0c3-4d85-bdcd-ce468fc64f16", label: "4", value: 4 },
	{ uuid: "9eae10e5-e0c7-4a2b-9570-888d5d38821f", label: "8", value: 8 },
	{ uuid: "9eae10e5-e0cb-4830-aad1-f7d14c0adef7", label: "12", value: 12 },
	{ uuid: "9eae10e5-e0cf-4035-8580-b3288941058f", label: "16", value: 16 },
];
