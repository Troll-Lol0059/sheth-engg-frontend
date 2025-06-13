import { useMemo } from "react";

type Year = {
	label: string;
	value: number;
};

function generateYears(startYear: number, endYear?: number): number[] {
	const currentYear = new Date().getFullYear();
	const endYearr = endYear ?? currentYear + 10;
	const years: number[] = [];

	for (let year = startYear; year <= endYearr; year++) {
		years.push(year);
	}
	return years;
}

function mapYearsToData(startYear: number, endYear?: number): Year[] {
	const years = generateYears(startYear, endYear);

	return years.map(year => ({
		label: year.toString(),
		value: year,
	}));
}

export function useYears(startYear: number, endYear?: number): Year[] {
	const years = useMemo(() => mapYearsToData(startYear, endYear), [startYear, endYear]);
	return years;
}
