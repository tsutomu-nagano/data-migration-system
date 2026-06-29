"use client"

import { Check, ChevronsUpDown, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { COMMON_META } from "@/lib/migration/seed"
import { commonMetaLabel } from "@/lib/migration/types"

interface CommonMetaSelectorProps {
  value: string | null
  onChange: (value: string | null) => void
}

export function CommonMetaSelector({ value, onChange }: CommonMetaSelectorProps) {
  const [open, setOpen] = useState(false)
  const selected = COMMON_META.find((m) => m.id === value)

  // グループごとにまとめる
  const groups = COMMON_META.reduce<Record<string, typeof COMMON_META>>((acc, meta) => {
    ;(acc[meta.group] ??= []).push(meta)
    return acc
  }, {})

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between font-normal"
            >
              {selected ? (
                <span className="truncate">{commonMetaLabel(selected)}</span>
              ) : (
                <span className="text-muted-foreground">なし（共通メタを参照しない）</span>
              )}
              <ChevronsUpDown data-icon="inline-end" className="opacity-50" />
            </Button>
          }
        />
        <PopoverContent className="w-[var(--anchor-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="共通メタを検索（性別、年齢、産業…）" />
            <CommandList>
              <CommandEmpty>該当する共通メタが見つかりません。</CommandEmpty>
              {Object.entries(groups).map(([group, metas]) => (
                <CommandGroup key={group} heading={group}>
                  {metas.map((meta) => {
                    const label = commonMetaLabel(meta)
                    return (
                      <CommandItem
                        key={meta.id}
                        value={`${label} ${meta.group} ${meta.name}`}
                        onSelect={() => {
                          onChange(meta.id === value ? null : meta.id)
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(value === meta.id ? "opacity-100" : "opacity-0")}
                        />
                        {meta.name}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label="共通メタ参照を解除"
          onClick={() => onChange(null)}
        >
          <X />
        </Button>
      ) : null}
    </div>
  )
}
