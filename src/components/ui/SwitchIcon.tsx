import React from "react";

export interface SwitchIconProps extends React.SVGProps<SVGSVGElement> {
	size?: number | string;
	color?: string;
}

const SwitchIcon: React.FC<SwitchIconProps> = ({
	size = 24,
	color = "currentColor",
	...props
}) => {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 512 512"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			{/* Círculo externo */}
			<circle cx="256" cy="256" r="240" fill={color} />

			{/* Símbolo de power */}
			<path
				d="M256 140 v110"
				stroke="#fff"
				strokeWidth="36"
				strokeLinecap="round"
			/>
			<path
				d="M176 200
           a120 120 0 1 0 160 0"
				stroke="#fff"
				strokeWidth="36"
				strokeLinecap="round"
				fill="none"
			/>
		</svg>
	);
};

export default SwitchIcon;
