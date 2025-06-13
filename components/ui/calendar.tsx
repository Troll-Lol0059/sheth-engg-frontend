"use client";
import { cn } from "@lib/utils";
import { useState } from "react";
import { Button } from "@components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { differenceInCalendarDays, getYear } from "date-fns";
import { DayPicker, labelNext, labelPrevious, NavProps, useDayPicker, type DayPickerProps } from "react-day-picker";

export type CalendarProps = DayPickerProps & {
	yearRange?: number;
};

const Calendar = ({ className, classNames, numberOfMonths, showOutsideDays = true, yearRange = 16, ...props }: CalendarProps) => {
	const [navView, setNavView] = useState<"days" | "years">("days");
	const [years, setYears] = useState<{ from: number; to: number }>({
		from: getYear(new Date()) - Math.floor(yearRange / 2 - 1),
		to: getYear(new Date()) + Math.ceil(yearRange / 2),
	});

	const { mode, onNextClick, onPrevClick, startMonth, endMonth } = props;

	return (
		<DayPicker
			className={cn("max-w-72 min-w-72 py-3", navView === "years" ? "px-4" : "px-3", className)}
			classNames={{
				day: cn("flex size-8 items-center justify-center text-sm", mode !== "range" && "rounded-xl"),
				day_button: "size-full hover:rounded-xl hover:bg-primary hover:text-primary-foreground",
				disabled: "text-muted-foreground opacity-50",
				month: "flex w-full flex-col gap-2 overflow-hidden",
				months: "relative",
				month_caption: "mx-16 flex h-8 items-center justify-center",
				nav: "flex items-start justify-between gap-2",
				outside: "text-muted-foreground opacity-50",
				selected: "bg-primary text-primary-foreground hover:bg-primary! hover:text-primary-foreground! focus:bg-primary! focus:text-primary-foreground! rounded-xl",
				today: "rounded-xl bg-accent text-accent-foreground",
				week: "mt-2 flex w-full justify-center",
				weekday: "w-8 text-sm font-medium text-muted-foreground",
				weekdays: "flex flex-row justify-center",
				range_start: "rounded-e-none rounded-s-xl!",
				range_end: "rounded-s-none rounded-e-xl!",
				range_middle: "rounded-none!",
				...classNames,
			}}
			components={{
				CaptionLabel: ({ children }) => (
					<Button className="w-full truncate text-sm font-medium" variant="ghost" size="sm" onClick={() => setNavView(prev => (prev === "days" ? "years" : "days"))}>
						{navView === "days" ? children : `${years.from} - ${years.to}`}
					</Button>
				),
				MonthGrid: ({ className, children, ...props }) => {
					const { goToMonth } = useDayPicker();
					if (navView === "years") {
						return (
							<div className={cn("grid grid-cols-4", className)} {...props}>
								{Array.from({ length: years.to - years.from + 1 }, (_, index) => {
									const isBefore = differenceInCalendarDays(new Date(years.from + index, 12, 31), startMonth!) < 0;
									const isAfter = differenceInCalendarDays(new Date(years.from + index, 0, 0), endMonth!) > 0;
									const isDisabled = isBefore || isAfter;
									return (
										<Button
											className={cn(
												"hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground tabular-nums",
												years.from + index === getYear(new Date()) && "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground font-medium"
											)}
											disabled={navView === "years" && isDisabled}
											key={index}
											onClick={() => {
												setNavView("days");
												goToMonth(new Date(years.from + index, new Date().getMonth()));
											}}
											size="sm"
											variant="ghost"
										>
											{years.from + index}
										</Button>
									);
								})}
							</div>
						);
					}
					return (
						<table className={className} {...props}>
							{children}
						</table>
					);
				},
				Nav: ({ className }: NavProps) => {
					const { nextMonth, previousMonth, goToMonth } = useDayPicker();
					const isPreviousDisabled = (() => {
						if (navView === "years") {
							return (startMonth && differenceInCalendarDays(new Date(years.from - 1, 0, 1), startMonth) < 0) || (endMonth && differenceInCalendarDays(new Date(years.from - 1, 0, 1), endMonth) > 0);
						}
						return !previousMonth;
					})();
					const isNextDisabled = (() => {
						if (navView === "years") {
							return (startMonth && differenceInCalendarDays(new Date(years.to + 1, 0, 1), startMonth) < 0) || (endMonth && differenceInCalendarDays(new Date(years.to + 1, 0, 1), endMonth) > 0);
						}
						return !nextMonth;
					})();
					const handlePreviousClick = () => {
						if (previousMonth) {
							if (navView === "years") {
								setYears(prev => ({
									from: prev.from - (prev.to - prev.from + 1),
									to: prev.to - (prev.to - prev.from + 1),
								}));
								onPrevClick?.(new Date(years.from - (years.to - years.from), 0, 1));
								return;
							}
							goToMonth(previousMonth);
							onPrevClick?.(previousMonth);
						}
					};
					const handleNextClick = () => {
						if (nextMonth) {
							if (navView === "years") {
								setYears(prev => ({
									from: prev.from + (prev.to - prev.from + 1),
									to: prev.to + (prev.to - prev.from + 1),
								}));
								onNextClick?.(new Date(years.from + (years.to - years.from), 0, 1));
								return;
							}
							goToMonth(nextMonth);
							onNextClick?.(nextMonth);
						}
					};
					return (
						<nav className={cn("flex items-center", className)}>
							<Button
								aria-label={navView === "years" ? `Go to previous ${years.to - years.from + 1} years` : labelPrevious(previousMonth)}
								className="absolute left-0 size-8"
								disabled={isPreviousDisabled}
								onClick={handlePreviousClick}
								size="icon"
								tabIndex={isPreviousDisabled ? undefined : -1}
								type="button"
								variant="ghost"
							>
								<ChevronLeft />
							</Button>

							<Button
								aria-label={navView === "years" ? `Go to next ${years.to - years.from + 1} years` : labelNext(nextMonth)}
								className="absolute right-0 size-8"
								disabled={isNextDisabled}
								onClick={handleNextClick}
								tabIndex={isNextDisabled ? undefined : -1}
								type="button"
								variant="ghost"
							>
								<ChevronRight />
							</Button>
						</nav>
					);
				},
			}}
			numberOfMonths={navView === "years" ? 1 : numberOfMonths}
			showOutsideDays={showOutsideDays}
			{...props}
		/>
	);
};
Calendar.displayName = "Calendar";

export { Calendar };
