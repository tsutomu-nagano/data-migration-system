"use client"

import { ArrowRight, CircleCheck, CircleDashed, Layers } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useMigration } from "@/lib/migration/store"
import { MATTER_CATEGORIES, type MatterCategory } from "@/lib/migration/types"

interface MattersOverviewProps {
  onOpenMapping: (matterId: string) => void
}

export function MattersOverview({ onOpenMapping }: MattersOverviewProps) {
  const { oldMatters, matterMappings, itemMappings } = useMigration()

  const totalItems = oldMatters.reduce((sum, m) => sum + m.items.length, 0)
  const mappedMatters = oldMatters.filter((m) => matterMappings[m.id]?.enabled).length
  const mappedItems = oldMatters
    .filter((m) => matterMappings[m.id]?.enabled)
    .reduce((sum, m) => sum + m.items.filter((i) => itemMappings[i.id]).length, 0)
  const refCount = useMigration().matterRefs.length

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">事項一覧</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          旧システムの事項・項目を確認し、移行対象として有効化します。有効化した事項は項目マッピングへ進めます。
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="事項マッピング" value={`${mappedMatters} / ${oldMatters.length}`} hint="有効化した事項" />
        <StatCard label="項目マッピング" value={`${mappedItems} / ${totalItems}`} hint="作成済みの新項目" />
        <StatCard label="事項間参照" value={`${refCount}`} hint="定義済みの参照" />
        <StatCard label="メタデータ種別" value={`${MATTER_CATEGORIES.length}`} hint="対象の事項種別" />
      </div>

      <div className="flex flex-col gap-6">
        {MATTER_CATEGORIES.map((category) => (
          <CategorySection
            key={category}
            category={category}
            onOpenMapping={onOpenMapping}
          />
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 py-4">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="font-mono text-2xl font-semibold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </CardContent>
    </Card>
  )
}

function CategorySection({
  category,
  onOpenMapping,
}: {
  category: MatterCategory
  onOpenMapping: (matterId: string) => void
}) {
  const { oldMatters, matterMappings, itemMappings, enableMatterMapping, disableMatterMapping } =
    useMigration()
  const matters = oldMatters.filter((m) => m.category === category)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Layers className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">{category}</h2>
        <Badge variant="secondary" className="font-mono">
          {matters.length}
        </Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {matters.map((matter) => {
          const enabled = matterMappings[matter.id]?.enabled ?? false
          const mapped = matter.items.filter((i) => itemMappings[i.id]).length
          const ratio = matter.items.length ? (mapped / matter.items.length) * 100 : 0
          return (
            <Card key={matter.id} className="gap-0 overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                <div className="flex flex-col gap-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {matter.name}
                    {enabled ? (
                      <Badge className="gap-1">
                        <CircleCheck className="size-3" />
                        移行対象
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <CircleDashed className="size-3" />
                        未設定
                      </Badge>
                    )}
                  </CardTitle>
                  <span className="font-mono text-xs text-muted-foreground">
                    {matter.items.length} 項目
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {enabled ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">項目マッピング</span>
                      <span className="font-mono tabular-nums">
                        {mapped} / {matter.items.length}
                      </span>
                    </div>
                    <Progress value={ratio} />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-pretty">
                    この事項を移行対象に追加すると、新事項と新項目の雛形が自動生成されます。
                  </p>
                )}
                <Separator />
                <div className="flex items-center justify-between gap-2">
                  {enabled ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => disableMatterMapping(matter.id)}
                    >
                      対象から外す
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => enableMatterMapping(matter.id)}
                    >
                      移行対象に追加
                    </Button>
                  )}
                  <Button
                    size="sm"
                    disabled={!enabled}
                    onClick={() => onOpenMapping(matter.id)}
                  >
                    項目マッピング
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
