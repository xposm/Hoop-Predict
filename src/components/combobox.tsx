"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import Papa from "papaparse"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"


export function ComboboxDemo() {
  const [teams, setTeams] = React.useState<{ label: string; value: string }[]>([])
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

    React.useEffect(() => {
    fetch("/final_team_selection.csv")
      .then((response) => response.text())
      .then((csvText) => {
        const result = Papa.parse(csvText, { header: true })
        console.log("Parsed CSV:", result.data)
        setTeams(result.data as { label: string; value: string }[])
      })
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[500px] justify-between"
        >
          {value
            ? teams.find((team) => team.value === value)?.label
            : "Select team..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-1">
        <Command>
          <CommandInput placeholder="Search teams..." className="h-9" />
          <CommandList>
            <CommandEmpty>No team found.</CommandEmpty>
            <CommandGroup>
              {teams.map((team) => (
                <CommandItem
                  key={team.value}
                  value={team.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  {team.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === team.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
