"use client";
import { cn } from "@lib/utils";
import { Circle } from "lucide-react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

const RadioGroup = forwardRef<ElementRef<typeof RadioGroupPrimitive.Root>, ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>>(({ className, ...props }, ref) => {
	return (
		<RadioGroupPrimitive.Root
			className={cn(
				"flex min-h-12 flex-wrap items-center justify-center gap-2 rounded-xl border border-border bg-input px-3 py-2 ring-offset-background has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus]:ring-2 has-[:focus]:ring-ring has-[:focus]:ring-offset-2",
				className
			)}
			{...props}
			ref={ref}
		/>
	);
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = forwardRef<ElementRef<typeof RadioGroupPrimitive.Item>, ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>>(({ className, ...props }, ref) => {
	return (
		<RadioGroupPrimitive.Item
			ref={ref}
			className={cn(
				"aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
				className
			)}
			{...props}
		>
			<RadioGroupPrimitive.Indicator className="flex items-center justify-center">
				<Circle className="h-2.5 w-2.5 fill-current text-current" />
			</RadioGroupPrimitive.Indicator>
		</RadioGroupPrimitive.Item>
	);
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
