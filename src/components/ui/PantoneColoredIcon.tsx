import React from "react";

interface PantoneColoredIconProps {
  size?: number;
  className?: string;
}

const PantoneColoredIcon: React.FC<PantoneColoredIconProps> = ({
  size = 24,
  className = "",
}) => {
  return (
    <img
      src="/src/components/ui/compressed/pantone-colored.svg"
      alt="Pantone colored icon"
      width={size}
      height={size}
      className={className}
    />
  );
};

export default PantoneColoredIcon;
