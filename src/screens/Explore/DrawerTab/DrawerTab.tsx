import React, { useState } from "react";
import "./drawer.css";
import pantoneIcon from "../../../components/ui/pantone-circle.png";

interface DrawerTabProps {
	isOpen: boolean;
	onClick: () => void;
}

const DrawerTab: React.FC<DrawerTabProps> = ({ isOpen, onClick }) => {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<div
			role="button"
			aria-label="Toggle color wheel drawer"
			aria-expanded={isOpen}
			aria-controls="color-wheel-drawer"
			onClick={onClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			className="drawer-tab"
			style={
				{
					background: isHovered ? "#e8e8d0" : "rgba(245, 245, 220, 0.95)",
					WebkitAppRegion: "no-drag",
				} as React.CSSProperties
			}
		>
			<span style={{ fontSize: "13px", color: "#1a1a1a" }}>
				{isOpen ? "◀" : "▶"}
			</span>
			<img src={pantoneIcon} alt="Pantone Icon" className="w-5 h-5" />
			{/* <a href="https://www.flaticon.com/free-icons/color-palette" title="color palette icons">Color palette icons created by mynamepong - Flaticon</a> */}

			<span className="drawer-title">COLOR WHEEL</span>
		</div>
	);
};

export default DrawerTab;
