"use client"

import {
  AlertCircle,
  Calculator,
  CalendarDays,
  CircleCheck,
  CircleDashed,
  Database,
  MapPin,
  Ruler,
  Tags,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useMigration } from "@/lib/migration/store"
import type { MatterCategory, MigrationDecision, ReadinessStatus } from "@/lib/migration/types"

const STATUS_LABELS: Record<ReadinessStatus, string> = {
  ready: "移行可能",
  partial: "マッピング未完了",
  blocked: "参照メタデータ不足",
}

const MATTER_CATEGORY_ICONS: Record<MatterCategory, LucideIcon> = {
  分類事項: Tags,
  地域事項: MapPin,
  時間軸事項: CalendarDays,
  集計事項: Calculator,
  単位事項: Ruler,
}

export function StatDataMigration() {
  const {
    statTables,
    oldMatters,
    tableDecisions,
    setTableDecision,
    getTableReadiness,
  } = useMigration()

  const matterById = useMemo(() => new Map(oldMatters.map((matter) => [matter.id, matter])), [oldMatters])
  const readinessByTableId = useMemo(
    () => new Map(statTables.map((table) => [table.id, getTableReadiness(table.id)])),
    [statTables, getTableReadiness],
  )

  const summary = useMemo(() => {
    const totalCellCount = statTables.reduce((sum, table) => sum + table.cellCount, 0)
    const targetTables = statTables.filter((table) => readinessByTableId.get(table.id)?.willMigrate)
    const readyCount = statTables.filter((table) => readinessByTableId.get(table.id)?.status === "ready").length
    const blockedCount = statTables.length - readyCount
    const excludedCount = statTables.filter((table) => {
      const readiness = readinessByTableId.get(table.id)
      return readiness?.status === "ready" && !readiness.willMigrate
    }).length
    const targetCellCount = targetTables.reduce((sum, table) => sum + table.cellCount, 0)

    return {
      targetCount: targetTables.length,
      readyCount,
      blockedCount,
      excludedCount,
      totalCellCount,
      targetCellCount,
    }
  }, [statTables, readinessByTableId])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">統計データ移行</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          統計データが参照する事項と項目マッピングの状態を確認し、移行対象に含める統計表を選択します。
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <SummaryCard label="移行対象" value={summary.targetCount.toLocaleString("ja-JP")} />
        <SummaryCard label="移行可能" value={summary.readyCount.toLocaleString("ja-JP")} />
        <SummaryCard label="移行不可" value={summary.blockedCount.toLocaleString("ja-JP")} />
        <SummaryCard label="除外" value={summary.excludedCount.toLocaleString("ja-JP")} />
        <SummaryCard label="総セル数" value={summary.totalCellCount.toLocaleString("ja-JP")} />
        <SummaryCard label="対象セル数" value={summary.targetCellCount.toLocaleString("ja-JP")} />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">統計データ一覧</h2>
          <Badge variant="secondary" className="font-mono">
            {statTables.length}
          </Badge>
        </div>

        <div className="grid gap-3">
          {statTables.map((table) => {
            const readiness = readinessByTableId.get(table.id) ?? getTableReadiness(table.id)
            const decision = tableDecisions[table.id] ?? "auto"
            const selectable = readiness.status === "ready"
            const referencedMatters = table.matterIds
              .map((matterId) => matterById.get(matterId))
              .filter((matter) => matter !== undefined)

            return (
              <Card key={table.id} className="gap-0 overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                      {table.name}
                      <StatusBadge status={readiness.status} />
                      {readiness.willMigrate && (
                        <Badge className="gap-1">
                          <CircleCheck className="size-3" />
                          移行対象
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
                      <span>表番号: {table.tableNo}</span>
                      <span>セル数: {table.cellCount.toLocaleString("ja-JP")}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-muted-foreground">参照事項</span>
                    <div className="grid gap-2 md:grid-cols-2">
                      {referencedMatters.map((matter) => {
                        const missing = readiness.missingMatterIds.includes(matter.id)
                        const unmapped = readiness.unmappedMatterIds.includes(matter.id)
                        const MatterIcon = MATTER_CATEGORY_ICONS[matter.category]
                        return (
                          <div
                            key={matter.id}
                            className={cn(
                              "flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm",
                              missing || unmapped ? "border-destructive/30 bg-destructive/5" : "bg-muted/30",
                            )}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <MatterIcon className="size-4 shrink-0 text-primary" />
                              <span className="min-w-0 truncate">
                                {matter.category}: {matter.name}
                              </span>
                            </span>
                            {missing ? (
                              <Badge variant="destructive">未移行</Badge>
                            ) : unmapped ? (
                              <Badge variant="outline" className="text-muted-foreground">
                                未完了
                              </Badge>
                            ) : (
                              <Badge variant="secondary">完了</Badge>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {readiness.status !== "ready" && (
                    <div className="flex flex-col gap-1 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                      <div className="flex items-center gap-2 font-medium text-destructive">
                        <AlertCircle className="size-4" />
                        移行不可
                      </div>
                      <div className="space-y-1 text-muted-foreground">
                        {readiness.missingMatterIds.map((matterId) => (
                          <p key={matterId}>
                            参照している事項「{matterById.get(matterId)?.name ?? matterId}」が移行対象ではありません。
                          </p>
                        ))}
                        {readiness.unmappedMatterIds.map((matterId) => (
                          <p key={matterId}>
                            事項「{matterById.get(matterId)?.name ?? matterId}」の項目マッピングが未完了です。
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                      選択状態: {decisionLabel(decision)}
                    </div>
                    {selectable ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant={decision === "include" || decision === "auto" ? "default" : "outline"}
                          onClick={() => setTableDecision(table.id, "include")}
                        >
                          移行する
                        </Button>
                        <Button
                          size="sm"
                          variant={decision === "exclude" ? "default" : "outline"}
                          onClick={() => setTableDecision(table.id, "exclude")}
                        >
                          移行しない
                        </Button>
                        {decision !== "auto" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setTableDecision(table.id, "auto")}
                          >
                            自動判定に戻す
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <XCircle className="size-3" />
                        移行不可
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 py-4">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="font-mono text-2xl font-semibold tabular-nums">{value}</span>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: ReadinessStatus }) {
  if (status === "ready") {
    return (
      <Badge className="gap-1">
        <CircleCheck className="size-3" />
        {STATUS_LABELS[status]}
      </Badge>
    )
  }

  if (status === "partial") {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <CircleDashed className="size-3" />
        {STATUS_LABELS[status]}
      </Badge>
    )
  }

  return (
    <Badge variant="destructive" className="gap-1">
      <AlertCircle className="size-3" />
      {STATUS_LABELS[status]}
    </Badge>
  )
}

function decisionLabel(decision: MigrationDecision) {
  if (decision === "include") return "移行する"
  if (decision === "exclude") return "移行しない"
  return "自動判定"
}
