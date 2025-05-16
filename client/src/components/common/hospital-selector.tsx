import React from "react";
import { useHospital } from "@/hooks/use-hospital";
import { Building, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function HospitalSelector() {
  const [open, setOpen] = React.useState(false);
  const { hospitals, selectedHospital, setSelectedHospital, isLoading } =
    useHospital();

  const selectedData = hospitals.find((h) => h.id === selectedHospital) || null;
  const truncateName = (name: string) => {
    return name.length > 25 ? `${name.substring(0, 25)}...` : name;
  };
  if (isLoading) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-[220px] h-9 justify-start"
        disabled
      >
        <Building className="mr-2 h-4 w-4" />
        <span className="text-xs">Loading hospitals...</span>
      </Button>
    );
  }

  if (hospitals.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-[220px] h-9 justify-start"
        disabled
      >
        <Building className="mr-2 h-4 w-4" />
        <span className="text-xs">No hospitals available</span>
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[220px] h-9 justify-between"
        >
          <div className="flex items-center">
            <Building className="mr-2 h-4 w-4" />
            <span className="text-xs truncate">
              {selectedData
                ? truncateName(selectedData.name)
                : "Select hospital"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0">
        <Command>
          <CommandInput placeholder="Search hospital..." className="h-9" />
          <CommandEmpty>No hospital found.</CommandEmpty>
          <CommandGroup>
            {hospitals.map((hospital) => (
              <CommandItem
                key={hospital.id}
                value={hospital.id.toString()}
                onSelect={(value) => {
                  setSelectedHospital(Number(value));
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedHospital === hospital.id
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                <span className="text-xs">{hospital.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
