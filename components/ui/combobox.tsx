"use client";
import React from "react";
import { cn } from "@lib/utils";
import { Button } from "./button";
import { Separator } from "./separator";
import { Badge, BadgeProps } from "./badge";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Check, ChevronDown, Square, SquareCheckBig, X } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef, ReactNode, useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";

export interface Option {
	uuid: string;
	label: string;
	value: string;
	icon?: ReactNode;
}

interface CommonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
	className?: string;
	emptyLabel?: string;
	endContent?: ReactNode;
	label?: string;
	options: Option[];
	placeholder?: string;
	startContent?: ReactNode;
	isSearchRequired?: boolean;
	isSelectAllRequired?: boolean;
}

interface SingleSelectProps extends CommonProps {
	maxItems?: never;
	onChange?: (value: string) => void;
	multiple?: false;
	value?: string;
	variant?: never;
}

interface MultiSelectProps extends CommonProps {
	maxItems?: number;
	onChange?: (value: string[]) => void;
	multiple: true;
	value?: string[];
	variant?: BadgeProps["variant"];
}

export type ComboboxProps = SingleSelectProps | MultiSelectProps;

export const Combobox = forwardRef<HTMLButtonElement, ComboboxProps>(
	({ className, emptyLabel, endContent, label, maxItems = 1, multiple, onChange, options, placeholder, startContent, value, variant, isSearchRequired = false, isSelectAllRequired = false, ...props }, ref) => {
		const [isPopoverOpen, setIsPopoverOpen] = useState(false);
		const [selectedValue, setSelectedValue] = useState(multiple ? value || [] : value || "");

		const toggleOption = (value: string) => {
			if (multiple && typeof selectedValue === "object") {
				const newSelectedValue = selectedValue.includes(value) ? selectedValue.filter(currentValue => currentValue !== value) : [...selectedValue, value];
				setSelectedValue(newSelectedValue);
				if (onChange) {
					onChange(newSelectedValue);
				}
			} else if (!multiple && typeof selectedValue === "string") {
				const newSelectedValue = selectedValue !== value ? value : "";
				setSelectedValue(newSelectedValue);
				if (onChange) {
					onChange(newSelectedValue);
				}
				setIsPopoverOpen(false);
			}
		};

		const handleClear = () => {
			setSelectedValue(multiple ? [] : "");
			if (onChange) {
				if (multiple) {
					onChange([]);
				} else {
					onChange("");
				}
			}
		};

		const handleTogglePopover = () => {
			setIsPopoverOpen(prevPopoverOpen => !prevPopoverOpen);
		};

		const clearExtraOptions = () => {
			if (multiple && typeof selectedValue === "object") {
				const newSelectedValue = selectedValue.slice(0, maxItems);
				setSelectedValue(newSelectedValue);
				if (onChange) {
					onChange(newSelectedValue);
				}
			}
		};

		const toggleAll = () => {
			if (multiple && typeof selectedValue === "object") {
				if (selectedValue.length === options.length) {
					handleClear();
				} else {
					const allValues = options.map(option => option?.value);
					setSelectedValue(allValues);
					if (onChange) {
						onChange(allValues);
					}
				}
			}
		};

		return (
			<div className="w-full">
				<Popover modal={true} onOpenChange={setIsPopoverOpen} open={isPopoverOpen}>
					<PopoverTrigger asChild>
						<Button
							aria-expanded={isPopoverOpen}
							className={cn(
								"border-border bg-input hover:bg-input w-full justify-between border px-3 py-2 text-sm font-normal disabled:pointer-events-auto disabled:cursor-not-allowed",
								multiple && "h-auto min-h-12",
								selectedValue.length === 0 && "text-muted-foreground",
								className
							)}
							onClick={handleTogglePopover}
							ref={ref}
							role="combobox"
							size="lg"
							variant="ghost"
							{...props}
						>
							{startContent}
							{multiple && typeof selectedValue === "object" ? (
								selectedValue.length > 0 ? (
									<div className="flex w-full items-center justify-between">
										<div className="flex flex-wrap items-center gap-1 overflow-x-hidden">
											{selectedValue.slice(0, maxItems).map(value => {
												const option = options.find(option => option?.value === value);
												return (
													<Badge className="xs:max-w-32 max-w-20" key={option?.uuid} variant={variant}>
														<span className="truncate">{option?.label}</span>
														<X
															className="cursor-pointer"
															onClick={event => {
																event.stopPropagation();
																toggleOption(value);
															}}
															size={16}
														/>
													</Badge>
												);
											})}
											{selectedValue.length > maxItems && (
												<Badge className="xs:max-w-32 max-w-20" variant={variant}>
													<span className="truncate">{`+ ${selectedValue.length - maxItems} more`}</span>
													<X
														className="cursor-pointer"
														onClick={event => {
															event.stopPropagation();
															clearExtraOptions();
														}}
														size={16}
													/>
												</Badge>
											)}
										</div>
										<div className="flex items-center justify-between gap-2">
											<X
												onClick={event => {
													event.stopPropagation();
													handleClear();
												}}
											/>
											<Separator orientation="vertical" className="flex h-full min-h-6" />
										</div>
									</div>
								) : (
									<div className="flex w-full items-center justify-between overflow-x-hidden">
										<span className="truncate">{placeholder}</span>
									</div>
								)
							) : (
								<div className="flex w-full items-center gap-1 overflow-x-hidden">
									{selectedValue ? (
										<>
											<span className="shrink-0">{options.find(option => option?.value === selectedValue)?.icon}</span>
											<span className="truncate">{options.find(option => option?.value === selectedValue)?.label}</span>
										</>
									) : (
										<span className="truncate">{placeholder}</span>
									)}
								</div>
							)}
							{endContent ?? <ChevronDown />}
						</Button>
					</PopoverTrigger>
					<PopoverContent align="start" className="w-full p-0" onEscapeKeyDown={() => setIsPopoverOpen(false)}>
						<Command>
							{isSearchRequired && <CommandInput placeholder="Search..." />}
							<CommandList>
								<CommandEmpty>{emptyLabel ? emptyLabel : "No results found!"}</CommandEmpty>
								{multiple && typeof selectedValue === "object" ? (
									<CommandGroup heading={label}>
										{isSelectAllRequired && (
											<CommandItem key="all" onSelect={toggleAll} className="cursor-pointer">
												{selectedValue.length === options.length ? <SquareCheckBig size={16} /> : <Square size={16} />}
												<span>Select All</span>
											</CommandItem>
										)}
										{options?.map(option => {
											const isSelected = selectedValue.includes(option?.value);
											return (
												<CommandItem className="cursor-pointer" key={option?.uuid} onSelect={() => toggleOption(option?.value)}>
													{isSelected ? <SquareCheckBig size={16} /> : <Square size={16} />}
													{option.icon}
													<span>{option?.label}</span>
												</CommandItem>
											);
										})}
									</CommandGroup>
								) : (
									<CommandGroup heading={label}>
										{options?.map(option => {
											const isSelected = selectedValue === option?.value;
											return (
												<CommandItem key={option?.uuid} onSelect={() => toggleOption(option?.value)} value={option?.label}>
													<Check className={cn("h-4 w-4", isSelected ? "visible" : "invisible")} />
													{option.icon}
													<span>{option?.label}</span>
												</CommandItem>
											);
										})}
									</CommandGroup>
								)}
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
			</div>
		);
	}
);

Combobox.displayName = "Combobox";
