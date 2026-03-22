"use client";
import { useState, KeyboardEvent } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { pageSizes } from "@data";
import { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationControlsProps<T> {
	table: Table<T>;
	totalElementsCount: number;
	footerHeading: string;
}

export const TablePaginationControls = <T,>({ table, totalElementsCount, footerHeading }: TablePaginationControlsProps<T>) => {
	const currentPage = table.getState().pagination.pageIndex + 1;
	const totalPages = table.getPageCount() || 1;
	const [pageInput, setPageInput] = useState<string>(String(currentPage));

	const handlePageJump = () => {
		const pageNumber = Number(pageInput);
		if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
			table.setPageIndex(pageNumber - 1);
			setPageInput(String(pageNumber));
		} else {
			setPageInput(String(currentPage));
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handlePageJump();
		}
	};

	const handleBlur = () => {
		const pageNumber = Number(pageInput);
		if (pageNumber >= 1 && pageNumber <= totalPages) {
			if (pageNumber !== currentPage) {
				table.setPageIndex(pageNumber - 1);
				setPageInput(String(pageNumber));
			}
		} else {
			setPageInput(String(currentPage));
		}
	};

	return (
		<div className="flex w-full flex-col gap-3 p-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
			<div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
				<span className="text-xs whitespace-nowrap sm:text-sm">{`Page ${currentPage} of ${totalPages}`}</span>
				<span className="hidden text-xs sm:inline sm:text-sm">|</span>
				<div className="flex items-center gap-1">
					<span className="hidden text-xs sm:inline sm:text-sm">Go to:</span>
					<span className="text-xs sm:hidden">Go:</span>
					<Input
						type="number"
						min={1}
						max={totalPages}
						value={pageInput}
						onChange={e => setPageInput(e.target.value)}
						onKeyDown={handleKeyDown}
						onBlur={handleBlur}
						className="h-8 w-14 sm:w-16 [&>input]:p-0 [&>input]:text-center [&>input]:text-xs sm:[&>input]:text-sm"
					/>
				</div>
				<span className="hidden text-xs sm:inline sm:text-sm">|</span>
				<select
					value={table.getState().pagination.pageSize}
					onChange={e => {
						table.setPageSize(Number(e.target.value));
					}}
					className="border-input bg-card ring-offset-background focus-visible:ring-ring h-8 w-14 rounded border px-1.5 text-xs focus-visible:ring-2 focus-visible:outline-none sm:w-16 sm:px-2 sm:text-sm"
				>
					{pageSizes.map(pageSize => (
						<option key={pageSize.value} value={pageSize.value}>
							{pageSize.value}
						</option>
					))}
				</select>
			</div>

			<div className="text-muted-foreground flex-1 text-center text-xs sm:text-left sm:text-sm">
				<span className="hidden md:inline">
					{table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected |{" "}
				</span>
				<span className="hidden sm:inline">Total {footerHeading}: </span>
				<span className="sm:hidden">Total: </span>
				{totalElementsCount}
			</div>

			<div className="flex items-center justify-center gap-2">
				<Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} variant="ghost" >
					<ChevronLeft className="h-4 w-4" aria-label="prev" />
					<span className="hidden sm:inline">Prev</span>
				</Button>
				<Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} variant="ghost" >
					<span className="hidden sm:inline">Next</span>
					<ChevronRight className="h-4 w-4" aria-label="next" />
				</Button>
			</div>
		</div>
	);
};
