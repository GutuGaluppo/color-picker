import React, { useState } from "react";

interface DrawerTabProps {
  isOpen: boolean;
  onClick: () => void;
}

const DRAWER_WIDTH = 320;

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
      style={{
        position: "absolute",
        right: isOpen ? `${DRAWER_WIDTH}px` : "0",
        top: "50%",
        transform: "translateY(-50%)",
        width: "32px",
        height: "120px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        background: isHovered ? "#e8e8d0" : "rgba(245, 245, 220, 0.95)",
        border: "1px solid #2a2a2a",
        borderRight: "none",
        borderTopLeftRadius: "4px",
        borderBottomLeftRadius: "4px",
        zIndex: 10,
        userSelect: "none",
        transition: "right 0.3s ease-in-out, background 0.15s ease",
        WebkitAppRegion: "no-drag",
      } as React.CSSProperties}
    >
      <span style={{ fontSize: "10px", color: "#1a1a1a" }}>
        {isOpen ? "▶" : "◀"}
      </span>
      <span
        style={{
          fontSize: "7px",
          fontFamily: "monospace",
          letterSpacing: "0.05em",
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          fontWeight: "bold",
          color: "#1a1a1a",
        }}
      >
        COLOR WHEEL
      </span>
    </div>
  );
};

export default DrawerTab;
