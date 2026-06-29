"use client"

import { ArrowDown, ArrowRight, CalendarClock, MousePointerClick } from "lucide-react"
import { useEffect, useState } from "react"
import { CommonMetaSelector } from "@/components/common-meta-selector"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useMigration } from "@/lib/migration/store"

interface ItemMappingProps {
  selectedMatterId: string | null
  onSelectMatter: (matterId: string) => void
}

export function ItemMapping({ selectedMatterId, onSelectMatter }: ItemMappingProps) {
  const { oldMatters, matterMappings, itemMappings, updateItemMapping } = useMigration()
  const enabledMatters = oldMatters.filter((m) => matterMappings[m.id]?.enabled)

  const matter = oldMatters.find((m) => m.id === selectedMatterId) ?? null
  const [activeItemId, setActiveItemId] = useState<string | null>(null)

  // 事項が切り替わったら先頭項目を選択
  useEffect(() => {
    if (matter && matter.items.length) {
      setActiveItemId((cur) =>
        cur && matter.items.some((i) => i.id === cur) ? cur : matter.items[0].id,
      )
    } else {
      setActiveItemId(null)
    }
  }, [matter])

  if (enabledMatters.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MousePointerClick />
          </EmptyMedia>
          <EmptyTitle>移行対象の事項がありません</EmptyTitle>
          <EmptyDescription>
            「事項一覧」画面で事項を移行対象に追加すると、ここで項目マッピングを編集できます。
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const activeOld = matter?.items.find((i) => i.id === activeItemId) ?? null
  const activeNew = activeOld ? itemMappings[activeOld.id] : null

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">項目マッピング</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            旧項目を基に新項目を作成します。各項目は任意で共通メタを参照できます。
          </p>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">対象の事項</span>
          <Select
            value={selectedMatterId ?? ""}
            onValueChange={(v) => onSelectMatter(v ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="事項を選択">
                {(value: string) => {
                  const m = enabledMatters.find((x) => x.id === value)
                  return m ? `${m.category}／${m.name}` : "事項を選択"
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {enabledMatters.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.category}／{m.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </header>

      {matter ? (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* 旧項目リスト */}
          <Card className="h-fit gap-0 py-0">
            <CardHeader className="flex flex-row items-center justify-between gap-2 border-b py-3">
              <CardTitle className="text-sm">旧項目</CardTitle>
              <Badge variant="secondary" className="font-mono">
                {matter.items.length}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col p-1.5">
              {matter.items.map((item) => {
                const nm = itemMappings[item.id]
                const active = item.id === activeItemId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveItemId(item.id)}
                    className={cn(
                      "flex flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left transition-colors",
                      active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                    )}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span
                        className={cn(
                          "font-mono text-xs",
                          active ? "text-primary-foreground/70" : "text-muted-foreground",
                        )}
                      >
                        {item.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.period ? (
                        <span
                          className={cn(
                            "flex items-center gap-0.5 text-[11px]",
                            active ? "text-primary-foreground/80" : "text-muted-foreground",
                          )}
                        >
                          <CalendarClock className="size-3" />
                          {item.period}
                        </span>
                      ) : null}
                      {nm?.commonMetaId ? (
                        <span
                          className={cn(
                            "text-[11px]",
                            active ? "text-primary-foreground/80" : "text-accent-foreground",
                          )}
                        >
                          共通メタ参照あり
                        </span>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {/* マッピングエディタ */}
          {activeOld && activeNew ? (
            <div className="flex flex-col gap-4">
              {activeOld.period ? (
                <div className="flex items-start gap-2 rounded-md border border-accent bg-accent/40 px-3 py-2 text-xs text-accent-foreground">
                  <CalendarClock className="mt-0.5 size-4 shrink-0" />
                  <span className="text-pretty">
                    地域事項は時点の概念を持ちます。同一名称でも基準時点（
                    <span className="font-medium">{activeOld.period}</span>
                    ）により地域コードが異なるため、時点を含めてマッピングしてください。
                  </span>
                </div>
              ) : null}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">旧項目（移行元・変更不可）</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                    <ReadonlyField label="項目名" value={activeOld.name} />
                    <ReadonlyField label="コード" value={activeOld.code} mono />
                    <ReadonlyField label="表示順" value={String(activeOld.order)} mono />
                    <ReadonlyField label="時点" value={activeOld.period ?? "—"} />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <span className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
                  <ArrowDown className="size-3.5" />
                  新規作成
                </span>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <span className="size-2 rounded-full bg-primary" />
                    新項目（新規作成）
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup className="gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="new-name">項目名</FieldLabel>
                        <Input
                          id="new-name"
                          value={activeNew.newName}
                          onChange={(e) =>
                            updateItemMapping(activeOld.id, { newName: e.target.value })
                          }
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="new-code">コード</FieldLabel>
                        <Input
                          id="new-code"
                          className="font-mono"
                          value={activeNew.code}
                          onChange={(e) =>
                            updateItemMapping(activeOld.id, { code: e.target.value })
                          }
                        />
                      </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="new-order">表示順</FieldLabel>
                        <Input
                          id="new-order"
                          type="number"
                          className="font-mono"
                          value={activeNew.order}
                          onChange={(e) =>
                            updateItemMapping(activeOld.id, {
                              order: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="new-parent">親項目</FieldLabel>
                        <Select
                          value={activeNew.parentId ?? "__none__"}
                          onValueChange={(v) =>
                            updateItemMapping(activeOld.id, {
                              parentId: !v || v === "__none__" ? null : v,
                            })
                          }
                        >
                          <SelectTrigger id="new-parent">
                            <SelectValue placeholder="親項目を選択">
                              {(value: string) => {
                                if (!value || value === "__none__") return "なし（最上位）"
                                const p = matter.items.find((i) => i.id === value)
                                return p ? (itemMappings[p.id]?.newName ?? p.name) : "なし（最上位）"
                              }}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="__none__">なし（最上位）</SelectItem>
                              {matter.items
                                .filter((i) => i.id !== activeOld.id)
                                .map((i) => (
                                  <SelectItem key={i.id} value={i.id}>
                                    {itemMappings[i.id]?.newName ?? i.name}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>

                    <Separator />

                    <Field>
                      <FieldLabel>共通メタ参照（任意）</FieldLabel>
                      <CommonMetaSelector
                        value={activeNew.commonMetaId}
                        onChange={(v) =>
                          updateItemMapping(activeOld.id, { commonMetaId: v })
                        }
                      />
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ArrowRight />
            </EmptyMedia>
            <EmptyTitle>事項を選択してください</EmptyTitle>
            <EmptyDescription>上部のセレクタから編集する事項を選びます。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}

function ReadonlyField({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm", mono && "font-mono")}>{value}</span>
    </div>
  )
}
