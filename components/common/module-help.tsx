"use client";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Button } from "@components/ui/button";
import { HelpCircle } from "lucide-react";

export interface HelpSection {
	title: string;
	content: string[];
}

interface ModuleHelpProps {
	title: string;
	description: string;
	sections: HelpSection[];
}

const ModuleHelp = ({ title, description, sections }: ModuleHelpProps) => {
	const [open, setOpen] = useState(false);

	return (
		<Sheet onOpenChange={setOpen} open={open}>
			<SheetTrigger asChild>
				<Button className="gap-1.5" size="sm" variant="outline">
					<HelpCircle className="h-4 w-4" />
					Help
				</Button>
			</SheetTrigger>
			<SheetContent className="w-full overflow-y-auto sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>{title}</SheetTitle>
					<p className="text-muted-foreground text-sm">{description}</p>
				</SheetHeader>
				<div className="mt-4">
					<Accordion className="w-full" collapsible type="single">
						{sections.map((section, idx) => (
							<AccordionItem key={idx} value={`section-${idx}`}>
								<AccordionTrigger className="text-sm font-medium">{section.title}</AccordionTrigger>
								<AccordionContent>
									<ul className="space-y-2">
										{section.content.map((line, li) => (
											<li className="text-muted-foreground flex items-start gap-2 text-sm" key={li}>
												<span className="text-primary mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
												<span>{line}</span>
											</li>
										))}
									</ul>
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</div>
			</SheetContent>
		</Sheet>
	);
};

export default ModuleHelp;
