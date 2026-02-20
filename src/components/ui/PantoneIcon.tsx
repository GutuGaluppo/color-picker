import React from "react";

interface PantoneIconProps {
  variant?: "default" | "circle" | "color-picker" | "pantone-1";
  size?: number;
  className?: string;
}

const PantoneIcon: React.FC<PantoneIconProps> = ({
  variant = "default",
  size = 24,
  className = "",
}) => {
  const getIconPath = () => {
    switch (variant) {
      case "circle":
        return "/src/components/ui/compressed/pantone circle.svg";
      case "color-picker":
        return "/src/components/ui/compressed/color-picker.svg";
      case "pantone-1":
        return "/src/components/ui/compressed/pantone (1).svg";
      default:
        return "/src/components/ui/compressed/pantone.svg";
    }
  };

  return (
    <img
      src={getIconPath()}
      alt={`Pantone ${variant} icon`}
      width={size}
      height={size}
      className={className}
    />
  );
};

export default PantoneIcon;
