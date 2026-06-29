"use client"

import { ArrowRight, Plus, Trash2, Workflow } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMigration } from "@/lib/migration/store"

export function MatterReferences() {
  const { oldMatters, matterMappings, matterRefs, addMatterRef, removeMatterRef } = useMigration()
  const enabledMatters = oldMatters.filter((m) => matterMappings[m.id]?.enabled)

  const [fromId, setFromId] = useState("")
  const [toId, setToId] = useState("")

  const matterName = (id: string) => {
    const m = oldMatters.find((x) => x.id === id)
    return m ? `${m.category}／${matterMappings[id]?.newName ?? m.name}` : id
  }

  const handleAdd = () => {
    if (!fromId || !toId) {
      toast.error("参照元と参照先の両方を選択してください。")
      return
    }
    if (fromId === toId) {
      toast.error("同一の事項同士は参照できません。")
      return
    }
    if (matterRefs.some((r) => r.fromMatterId === fromId && r.toMatterId === toId)) {
      toast.error("同じ参照が既に存在します。")
      return
    }
    addMatterRef(fromId, toId)
    toast.success("事項間参照を追加しました。")
    setFromId("")
    setToId("")
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">事項間参照</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          事項同士の参照関係を定義します。定義した参照関係も移行対象となります。
        </p>
      </header>

      {enabledMatters.length < 2 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Workflow />
            </EmptyMedia>
            <EmptyTitle>移行対象の事項が不足しています</EmptyTitle>
            <EmptyDescription>
              事項間参照を定義するには、2つ以上の事項を移行対象に追加してください。
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">参照関係を追加</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
                <div className="flex flex-1 flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">参照元の事項</span>
                  <Select value={fromId} onValueChange={(v) => setFromId(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="事項を選択">
                        {(value: string) => (value ? matterName(value) : "事項を選択")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {enabledMatters.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.category}／{matterMappings[m.id]?.newName ?? m.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-center pb-2 sm:pb-2.5">
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">参照先の事項</span>
                  <Select value={toId} onValueChange={(v) => setToId(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="事項を選択">
                        {(value: string) => (value ? matterName(value) : "事項を選択")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {enabledMatters.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.category}／{matterMappings[m.id]?.newName ?? m.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAdd}>
                  <Plus data-icon="inline-start" />
                  追加
                </Button>
              </div>
            </CardContent>
          </Card>

          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">定義済みの参照</h2>
              <Badge variant="secondary" className="font-mono">
                {matterRefs.length}
              </Badge>
            </div>
            {matterRefs.length === 0 ? (
              <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                参照関係はまだ定義されていません。
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {matterRefs.map((ref) => (
                  <div
                    key={ref.id}
                    className="flex items-center justify-between gap-3 rounded-md border bg-card px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="outline">{matterName(ref.fromMatterId)}</Badge>
                      <ArrowRight className="size-4 text-muted-foreground" />
                      <Badge variant="outline">{matterName(ref.toMatterId)}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="参照を削除"
                      onClick={() => {
                        removeMatterRef(ref.id)
                        toast.success("参照を削除しました。")
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
