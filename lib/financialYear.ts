/** Indian financial year runs April 1 - March 31, e.g. "2025-26". */
export const getCurrentFinancialYear = (): string => {
	const now = new Date();
	const month = now.getMonth(); // 0-indexed, 3 = Apr
	const startYear = month >= 3 ? now.getFullYear() : now.getFullYear() - 1;
	const endYearShort = String((startYear + 1) % 100).padStart(2, "0");
	return `${startYear}-${endYearShort}`;
};

export const ALL_FINANCIAL_YEARS = "ALL";
