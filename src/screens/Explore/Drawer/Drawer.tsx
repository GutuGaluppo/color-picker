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
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: "320px",
        background: "rgba(245, 245, 220, 0.97)",
        borderLeft: "2px solid #2a2a2a",
        boxShadow: "-4px 0 8px rgba(0, 0, 0, 0.1)",
        padding: "24px",
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s ease-in-out",
        zIndex: 5,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflowY: "auto",
        WebkitAppRegion: "no-drag",
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

export default Drawer;
