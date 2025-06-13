"use client";
import { cn } from "@lib/utils";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent = forwardRef<ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>, ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>>(({ className, ...props }, ref) => (
	<CollapsiblePrimitive.CollapsibleContent className={cn("overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down", className)} ref={ref} {...props} />
));
CollapsibleContent.displayName = CollapsiblePrimitive.CollapsibleContent.displayName;

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
