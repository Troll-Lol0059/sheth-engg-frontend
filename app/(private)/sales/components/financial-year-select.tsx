"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { ALL_FINANCIAL_YEARS } from "@lib/financialYear";

type FinancialYearSelectProps = {
	value: string;
	onValueChange: (fy: string) => void;
	financialYears: string[];
	className?: string;
};

const FinancialYearSelect = ({ value, onValueChange, financialYears, className }: FinancialYearSelectProps) => {
	return (
		<Select value={value} onValueChange={onValueChange}>
			<SelectTrigger className={className ?? "h-10 w-full sm:w-[160px]"}>
				<SelectValue placeholder="Financial Year" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value={ALL_FINANCIAL_YEARS}>All Years</SelectItem>
				{financialYears.map(fy => (
					<SelectItem key={fy} value={fy}>
						FY {fy}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};

export default FinancialYearSelect;
