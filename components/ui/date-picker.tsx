"use client";
import { cn } from "@lib/utils";
import { format } from "date-fns";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { DayPicker, Matcher } from "react-day-picker";
import { CalendarDays, ChevronDown } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ComponentProps, ComponentRef, forwardRef, ReactNode, useState } from "react";
 
export type CalendarProps = ComponentProps<typeof DayPicker>;
 
export interface DatePickerProps extends Omit<CalendarProps, "classNames" | "disabled" | "mode" | "onSelect" | "selected"> {
    disabled?: boolean;
    disabledRange?: Matcher | Matcher[];
    endContent?: ReactNode;
    onChange?: (date?: Date) => void;
    placeholder?: string;
    required?: boolean;
    startContent?: ReactNode;
    value?: Date;
}
 
const DatePicker = forwardRef<ComponentRef<typeof PopoverPrimitive.Content>, DatePickerProps>(({ className, disabledRange, disabled, endContent, onChange, placeholder, required, startContent, value, ...props }, ref) => {
    const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
    const [selectedValue, setSelectedValue] = useState<Date | undefined>(value);
 
    const defaultDisabledRange = (date: Date) => {
        return date > new Date() || date < new Date("1900-01-01");
    };
 
    const onSelect = (date?: Date) => {
        setSelectedValue(date);
        if (onChange) {
            onChange(date);
        }
        setIsCalendarOpen(false);
    };
    return (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
                <Button
                    className={cn("w-full justify-between border border-border bg-input px-3 py-2 text-sm font-normal hover:bg-input disabled:pointer-events-auto disabled:cursor-not-allowed", !selectedValue && "text-muted-foreground", className)}
                    disabled={disabled}
                    size="lg"
                    variant={"outline"}
                >
                    {startContent ?? <CalendarDays size={16} />}
                    <span className="w-full truncate text-left">{selectedValue ? format(new Date(selectedValue), "PPP") : placeholder}</span>
                    {endContent ?? <ChevronDown size={16} />}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="center" className="w-auto p-0" onOpenAutoFocus={event => event.preventDefault()} ref={ref}>
                <Calendar disabled={disabledRange ?? defaultDisabledRange} mode="single" onSelect={onSelect} required={required ?? true} selected={selectedValue ? new Date(selectedValue) : undefined} {...props} />
            </PopoverContent>
        </Popover>
    );
});
 
DatePicker.displayName = "DatePicker";
 
export { DatePicker };