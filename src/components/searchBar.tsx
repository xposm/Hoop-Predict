"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import Papa from "papaparse";
import {
  Command,
  CommandEmpty,
  CommandList,
  CommandItem,
  CommandGroup,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSelect: (value: string) => void;
}

export function SearchBar({ onSelect }: SearchBarProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [teams, setTeams] = React.useState<{ label: string; value: string }[]>([]);
  const [teamMap, setTeamMap] = React.useState<Map<string, { label: string; value: string }>>(new Map());
  const [loading, setLoading] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Load CSV data and create efficient lookup map
  React.useEffect(() => {
    fetch("./final_team_selection.csv")
      .then((response) => response.text())
      .then((csvText) => {
        const result = Papa.parse(csvText, { header: true });
        const teamData = result.data as { label: string; value: string }[];
        
        // Create Map for O(1) lookups using the pre-processed value column
        const map = new Map<string, { label: string; value: string }>();
        teamData.forEach(team => {
          map.set(team.value, team); // value is already lowercase
        });
        
        setTeams(teamData);
        setTeamMap(map);
        setLoading(false);
        console.log("Parsed CSV and created team map:", map);
      })
      .catch((error) => {
        console.error('Error loading team data:', error);
        setTeams([]);
        setTeamMap(new Map());
        setLoading(false);
      });
  }, []);

  // Direct lookup instead of filtering - much more efficient!
  const matchingTeams = React.useMemo(() => {
    if (!search) return teams;
    
    const searchTerm = search.toLowerCase();
    return teams.filter(team => team.value.includes(searchTerm));
  }, [search, teams]);

  // Close popover when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        inputRef.current && 
        !inputRef.current.contains(target) &&
        !document.querySelector('[data-radix-popper-content-wrapper]')?.contains(target)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearch(newValue);
    setOpen(newValue.length > 0 || selectedValue !== "");
  };

  const handleInputFocus = () => {
    setOpen(search.length > 0 || selectedValue !== "");
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      <Popover open={open}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder={loading ? "Loading teams..." : "Search teams..."}
              value={search}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              disabled={loading}
              className="pl-12 h-12 text-lg rounded-full border shadow-lg text-foreground bg-background focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1"
            />
          </div>
        </PopoverTrigger>
        {open && (search.length > 0 || selectedValue !== "") && !loading && (
          <PopoverContent 
            className="p-0 mt-2 rounded-lg border shadow-lg z-10"
            align="start"
            style={{ width: 'var(--radix-popover-trigger-width)' }}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command>
              <CommandList className="max-h-72">
                <CommandEmpty>No teams found.</CommandEmpty>
                <CommandGroup>
                  {matchingTeams.map((team) => (
                    <CommandItem
                      key={team.value}
                      value={team.value}
                      onSelect={(currentValue) => {
                        // Direct Map lookup - O(1) instead of O(n)!
                        const selectedTeam = teamMap.get(currentValue);
                        if (selectedTeam) {
                          setSelectedValue(currentValue === selectedValue ? "" : currentValue);
                          setSearch(selectedTeam.label);
                          // Return the properly capitalized label for Python script
                          onSelect(selectedTeam.label);
                          setOpen(false);
                        }
                      }}
                      className="cursor-pointer py-3 px-4 text-base"
                    >
                      {team.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}
