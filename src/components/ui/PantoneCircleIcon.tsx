import React from "react";

interface PantoneCircleIconProps {
  size?: number;
  className?: string;
}

const PantoneCircleIcon: React.FC<PantoneCircleIconProps> = ({
  size = 24,
  className = "",
}) => {
  return (
    <img
      src="/src/components/ui/compressed/pantone-circle.svg"
      alt="Pantone circle icon"
      width={size}
      height={size}
      className={className}
    />
  );
};

export default PantoneCircleIcon;
