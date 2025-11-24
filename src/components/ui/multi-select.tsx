import React from "react";
import { Checkbox } from "./checkbox";

export function MultiSelect({
  items,
  selected,
  onChange,
}: {
  items: { value: string; label: string }[];
  selected: string[];
  onChange: (newValues: string[]) => void;
}) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((v) => v !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="border rounded p-2 max-h-40 overflow-y-auto">
      {items.map((item) => (
        <label key={item.value} className="flex items-center space-x-2 py-1 cursor-pointer">
          <Checkbox
            checked={selected.includes(item.value)}
            onCheckedChange={() => toggle(item.value)}
          />
          <span>{item.label}</span>
        </label>
      ))}
    </div>
  );
}
