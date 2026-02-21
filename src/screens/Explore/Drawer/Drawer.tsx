import React from "react";

interface DrawerProps {
	isOpen: boolean;
	children: React.ReactNode;
}

const Drawer: React.FC<DrawerProps> = ({ isOpen, children }) => {
	return (
		<div
			id="color-wheel-drawer"
			role="complementary"
			aria-label="Color wheel panel"
			aria-hidden={!isOpen}
			style={
				{
					flexShrink: 0,
					width: isOpen ? "320px" : "0",
					overflow: "hidden",
					transition: "width 0.3s ease-in-out",
					background: "rgba(245, 245, 220, 0.97)",
					boxShadow: isOpen ? "inset 1px 0 5px rgba(0,0,0,0.1)" : "none",
					WebkitAppRegion: "no-drag",
				} as React.CSSProperties
			}
		>
			<div
				style={{
					width: "320px",
					height: "100%",
					padding: "24px",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{children}
			</div>
		</div>
	);
};

export default Drawer;
