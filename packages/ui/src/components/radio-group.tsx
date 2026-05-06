import { cn } from "@reluxury/ui/lib/utils";
import * as React from "react";

const RadioGroupContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

function useRadioGroup() {
  const context = React.useContext(RadioGroupContext);
  if (!context) {
    throw new Error("RadioGroup components must be used within a RadioGroup");
  }
  return context;
}

interface RadioGroupProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  className?: string;
}

function RadioGroup({
  children,
  value: controlledValue,
  onValueChange,
  defaultValue,
  className,
}: RadioGroupProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue ?? ""
  );
  const value = controlledValue ?? uncontrolledValue;
  const handleChange = onValueChange ?? setUncontrolledValue;

  return (
    <RadioGroupContext.Provider value={{ onValueChange: handleChange, value }}>
      <div className={cn("grid gap-2", className)} role="radiogroup">
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

function RadioGroupItem({
  value,
  id,
  className,
}: {
  value: string;
  id?: string;
  className?: string;
}) {
  const { value: selectedValue, onValueChange } = useRadioGroup();
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      id={id}
      onClick={() => onValueChange(value)}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        isSelected && "border-gold",
        className
      )}
    >
      {isSelected && (
        <div className="flex items-center justify-center h-full w-full">
          <div className="h-2 w-2 rounded-full bg-gold" />
        </div>
      )}
    </button>
  );
}

export { RadioGroup, RadioGroupItem };
