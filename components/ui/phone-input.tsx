"use client";
import { cn } from "@lib/utils";
import { ScrollArea } from "./scroll-area";
import { Button } from "@components/ui/button";
import flags from "react-phone-number-input/flags";
import * as RPNInput from "react-phone-number-input";
import { Input, InputProps } from "@components/ui/input";
import { Check, ChevronsUpDown, Phone } from "lucide-react";
import { ComponentRef, forwardRef, InputHTMLAttributes } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@components/ui/command";
 
type PhoneInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "value"> &
    Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
        onChange?: (value: RPNInput.Value) => void;
    };
 
const PhoneInput = forwardRef<ComponentRef<typeof RPNInput.default>, PhoneInputProps>(({ className, onChange, ...props }, ref) => {
    return <RPNInput.default className={cn("flex", className)} countrySelectComponent={CountrySelect} flagComponent={FlagComponent} inputComponent={InputComponent} onChange={value => onChange?.(value as RPNInput.Value)} ref={ref} {...props} />;
});
 
PhoneInput.displayName = "PhoneInput";
 
type CountrySelectOption = { label: string; value: RPNInput.Country };
 
type CountrySelectProps = {
    disabled?: boolean;
    value: RPNInput.Country;
    onChange: (value: RPNInput.Country) => void;
    options: CountrySelectOption[];
};
 
const CountrySelect = ({ disabled, value, onChange, options }: CountrySelectProps) => {
    const handleSelect = (country: RPNInput.Country) => {
        onChange(country);
    };
 
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button className={cn("flex gap-1 rounded-e-none border-e-0 bg-input px-3 focus:z-10")} disabled={disabled} size="lg" type="button" variant="outline">
                    <FlagComponent country={value} countryName={value} />
                    <ChevronsUpDown className={cn("-mr-2", disabled && "hidden")} size={16} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
                <Command>
                    <CommandList>
                        <ScrollArea className="max-h-72 overflow-auto">
                            <CommandInput placeholder="Search..." />
                            <CommandEmpty>{"No results found!"}</CommandEmpty>
                            <CommandGroup>
                                {options
                                    .filter(x => x.value)
                                    .map(option => {
                                        const isSelected = value === option?.value;
                                        return (
                                            <CommandItem className="gap-2" key={option?.value} onSelect={() => handleSelect(option?.value)}>
                                                <FlagComponent country={option?.value} countryName={option?.label} />
                                                <span className="flex-1 text-sm">{option?.label}</span>
                                                <span className="text-sm">{`+${RPNInput.getCountryCallingCode(option?.value)}`}</span>
                                                <Check className={cn(isSelected ? "visible" : "invisible")} size={16} />
                                            </CommandItem>
                                        );
                                    })}
                            </CommandGroup>
                        </ScrollArea>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
 
const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
    const CountryFlag = flags[country];
    if (CountryFlag) {
        return (
            <span className="flex h-4 w-6 overflow-hidden">
                <CountryFlag title={countryName} />
            </span>
        );
    } else {
        return (
            <span className="flex h-4 w-6 overflow-hidden">
                <Phone size={16} />
            </span>
        );
    }
};
FlagComponent.displayName = "FlagComponent";
 
const InputComponent = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => <Input className={cn("rounded-s-none border-s-0", className)} {...props} ref={ref} />);
 
InputComponent.displayName = "InputComponent";
 
export { PhoneInput };