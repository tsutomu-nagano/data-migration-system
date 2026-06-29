"use client"

import {
  Database,
  FileJson,
  GitCompareArrows,
  LayoutGrid,
  ListChecks,
  RotateCcw,
  Workflow,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMigration } from "@/lib/migration/store"
import type { ViewKey } from "@/lib/migration/views"

const NAV_ITEMS: { key: ViewKey; label: string; icon: typeof LayoutGrid; desc: string }[] = [
  { key: "overview", label: "事項一覧", icon: LayoutGrid, desc: "移行対象の選択" },
  { key: "mapping", label: "項目マッピング", icon: GitCompareArrows, desc: "新項目の作成" },
  { key: "common-meta", label: "共通メタ", icon: Database, desc: "共通概念の参照" },
  { key: "references", label: "事項間参照", icon: Workflow, desc: "参照関係の定義" },
  { key: "data-migration", label: "統計データ移行", icon: ListChecks, desc: "移行対象表の選択" },
  { key: "output", label: "生成パラメータ", icon: FileJson, desc: "移行用パラメータ" },
]

interface AppSidebarProps {
  view: ViewKey
  onNavigate: (view: ViewKey) => void
}

export function AppSidebar({ view, onNavigate }: AppSidebarProps) {
  const { resetAll } = useMigration()

  return (
    <aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col gap-6 bg-sidebar p-4 text-sidebar-foreground">
      <div className="flex flex-col gap-1 px-2 pt-2">
        <span className="text-xs font-medium text-sidebar-foreground/60">統計データ移行</span>
        <span className="text-balance text-base font-semibold leading-tight">
          メタデータ移行支援システム
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = view === item.key
          const Icon = item.icon
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{item.label}</span>
                <span
                  className={cn(
                    "text-[11px]",
                    active ? "text-sidebar-primary-foreground/75" : "text-sidebar-foreground/50",
                  )}
                >
                  {item.desc}
                </span>
              </div>
            </button>
          )
        })}
      </nav>

      <Button
        variant="ghost"
        className="justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        onClick={() => {
          resetAll()
          toast.success("マッピング設計をリセットしました。")
        }}
      >
        <RotateCcw data-icon="inline-start" />
        設計をリセット
      </Button>
    </aside>
  )
}
