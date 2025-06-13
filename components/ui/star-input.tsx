import React from "react";
import { cn } from "@lib/utils";
import { Star } from "lucide-react";

interface StarRatingProps {
	value?: number;
	onChange?: (rating: number) => void;
	className?: string;
}

export const StarRatingInput = React.forwardRef<HTMLDivElement, StarRatingProps>(({ value = 0, onChange, className }, ref) => {
	const [hoveredStar, setHoveredStar] = React.useState<number | null>(null);

	const handleClick = (star: number) => {
		if (onChange) onChange(star);
	};

	return (
		<div
			ref={ref}
			className={cn(
				"flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-border bg-input px-3 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:border-gray-400",
				className
			)}
		>
			{Array.from({ length: 5 }, (_, index) => {
				const star = index + 1;
				const isFilled = hoveredStar ? star <= hoveredStar : star <= value;

				return (
					<button key={star} type="button" onMouseEnter={() => setHoveredStar(star)} onMouseLeave={() => setHoveredStar(null)} onClick={() => handleClick(star)} className="flex items-center justify-center text-xl focus:outline-none">
						<Star className={`h-6 w-6 ${isFilled ? "text-warning" : "text-muted-foreground"}`} fill={isFilled ? "currentColor" : "none"} />
					</button>
				);
			})}
		</div>
	);
});

StarRatingInput.displayName = "StarRatingInput";

export default StarRatingInput;
