import React from "react";

interface ColorPickerIconProps {
  size?: number;
  className?: string;
}

const ColorPickerIcon: React.FC<ColorPickerIconProps> = ({
  size = 24,
  className = "",
}) => {
  return (
    <img
      src="/src/components/ui/compressed/color-picker.svg"
      alt="Color picker icon"
      width={size}
      height={size}
      className={className}
    />
  );
};

export default ColorPickerIcon;
