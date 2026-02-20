import React from "react";

interface PantoneIconProps {
  variant?: "default" | "circle" | "colored";
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
        return "/src/components/ui/compressed/pantone-circle.svg";
      case "colored":
        return "/src/components/ui/compressed/pantone-colored.svg";
      default:
        return "/src/components/ui/compressed/color-picker.svg";
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
