"use client"

import { Database, Link2, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { useMigration } from "@/lib/migration/store"
import { commonMetaLabel } from "@/lib/migration/types"

export function CommonMetaView() {
  const { commonMeta, itemMappings, oldMatters } = useMigration()
  const [query, setQuery] = useState("")

  // 各共通メタを参照している新項目を集計
  const referencesByMeta = useMemo(() => {
    const map: Record<string, { newName: string; matterName: string }[]> = {}
    for (const item of Object.values(itemMappings)) {
      if (!item.commonMetaId) continue
      const matter = oldMatters.find((m) => m.items.some((i) => i.id === item.oldItemId))
      ;(map[item.commonMetaId] ??= []).push({
        newName: item.newName,
        matterName: matter?.name ?? "—",
      })
    }
    return map
  }, [itemMappings, oldMatters])

  const filtered = commonMeta.filter((m) => {
    const q = query.trim()
    if (!q) return true
    return commonMetaLabel(m).includes(q) || m.group.includes(q) || m.name.includes(q)
  })

  const groups = filtered.reduce<Record<string, typeof commonMeta>>((acc, m) => {
    ;(acc[m.group] ??= []).push(m)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">共通メタ</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          複数の統計で共通利用される概念です。直接マッピングはせず、新項目から任意で参照します。
        </p>
      </header>

      <InputGroup className="max-w-sm">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="共通メタを検索（性別、年齢、産業…）"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </InputGroup>

      <div className="flex flex-col gap-6">
        {Object.entries(groups).map(([group, metas]) => (
          <section key={group} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Database className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">{group}</h2>
              <Badge variant="secondary" className="font-mono">
                {metas.length}
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {metas.map((meta) => {
                const refs = referencesByMeta[meta.id] ?? []
                return (
                  <Card key={meta.id} className="gap-0 py-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
                      <CardTitle className="text-sm">{meta.name}</CardTitle>
                      <Badge
                        variant={refs.length ? "default" : "outline"}
                        className="gap-1 font-mono"
                      >
                        <Link2 className="size-3" />
                        {refs.length}
                      </Badge>
                    </CardHeader>
                    {refs.length ? (
                      <CardContent className="flex flex-col gap-1 border-t py-3">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          参照している新項目
                        </span>
                        {refs.map((r, idx) => (
                          <span key={idx} className="text-xs">
                            {r.newName}
                            <span className="text-muted-foreground"> （{r.matterName}）</span>
                          </span>
                        ))}
                      </CardContent>
                    ) : null}
                  </Card>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
