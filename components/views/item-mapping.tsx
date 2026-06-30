"use client"

import {
  ArrowRight,
  CalendarClock,
  Calculator,
  GitBranch,
  ListTree,
  MapPin,
  MousePointerClick,
  Plus,
  Ruler,
  Tags,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Background,
  type Connection,
  Controls,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react"
import { CommonMetaSelector } from "@/components/common-meta-selector"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import type { ItemMappingPart, MatterCategory } from "@/lib/migration/types"

interface ItemMappingProps {
  selectedMatterId: string | null
  onSelectMatter: (matterId: string) => void
}

const MATTER_CATEGORY_ICONS: Record<MatterCategory, LucideIcon> = {
  分類事項: Tags,
  地域事項: MapPin,
  時間軸事項: CalendarClock,
  集計事項: Calculator,
  単位事項: Ruler,
}

export function ItemMapping({ selectedMatterId, onSelectMatter }: ItemMappingProps) {
  const {
    oldMatters,
    matterMappings,
    itemMappings,
    itemMappingRules,
    updateItemMapping,
    setItemMappingMode,
    addItemMappingPart,
    updateItemMappingPart,
    removeItemMappingPart,
  } = useMigration()
  const enabledMatters = oldMatters.filter((m) => matterMappings[m.id]?.enabled)

  const matter = oldMatters.find((m) => m.id === selectedMatterId) ?? null
  const [activeItemId, setActiveItemId] = useState<string | null>(null)

  const matterById = useMemo(() => new Map(oldMatters.map((m) => [m.id, m])), [oldMatters])

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
  const activeRule = activeOld ? itemMappingRules[activeOld.id] : null
  const splitCount = matter?.items.filter((item) => itemMappingRules[item.id]?.mode === "split").length ?? 0

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">項目マッピング</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            旧項目と移行先の構成を横に並べて確認します。旧項目を複数の事項・項目へ分解する場合は、分割マッピングとして構成要素を追加します。
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
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
          {matter ? (
            <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
              <SummaryPill label="旧項目" value={matter.items.length} />
              <SummaryPill label="1:1" value={matter.items.length - splitCount} />
              <SummaryPill label="分割" value={splitCount} />
            </div>
          ) : null}
        </div>
      </header>

      {matter ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <Card className="gap-0 py-0">
            <CardHeader className="flex flex-row items-center justify-between gap-2 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ListTree className="size-4 text-primary" />
                新旧対応フロー
              </CardTitle>
              <Badge variant="secondary" className="font-mono">
                {matter.items.length}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <ItemMappingFlow
                matter={matter}
                activeItemId={activeItemId}
                itemMappings={itemMappings}
                itemMappingRules={itemMappingRules}
                matterById={matterById}
                onSelectItem={setActiveItemId}
                setItemMappingMode={setItemMappingMode}
                updateItemMapping={updateItemMapping}
                updateItemMappingPart={updateItemMappingPart}
              />
            </CardContent>
          </Card>

          {activeOld && activeNew && activeRule ? (
            <Card className="h-fit gap-0 py-0">
              <CardHeader className="border-b py-3">
                <CardTitle className="text-sm">選択項目の詳細編集</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3">
                  <span className="text-xs font-medium text-muted-foreground">移行元</span>
                  <OldItemSummary item={activeOld} compact />
                </div>

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

                <Field>
                  <FieldLabel>対応方式</FieldLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={activeRule.mode === "direct" ? "default" : "outline"}
                      onClick={() => setItemMappingMode(activeOld.id, "direct")}
                    >
                      <ArrowRight data-icon="inline-start" />
                      1:1
                    </Button>
                    <Button
                      type="button"
                      variant={activeRule.mode === "split" ? "default" : "outline"}
                      onClick={() => setItemMappingMode(activeOld.id, "split")}
                    >
                      <GitBranch data-icon="inline-start" />
                      分割
                    </Button>
                  </div>
                </Field>

                {activeRule.mode === "direct" ? (
                  <DirectMappingEditor
                    oldItemId={activeOld.id}
                    activeNew={activeNew}
                    items={matter.items}
                    itemMappings={itemMappings}
                    updateItemMapping={updateItemMapping}
                  />
                ) : (
                  <SplitMappingEditor
                    oldItemId={activeOld.id}
                    parts={activeRule.parts}
                    enabledMatters={enabledMatters}
                    itemMappings={itemMappings}
                    matterById={matterById}
                    addItemMappingPart={addItemMappingPart}
                    updateItemMappingPart={updateItemMappingPart}
                    removeItemMappingPart={removeItemMappingPart}
                  />
                )}
              </CardContent>
            </Card>
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

function ItemMappingFlow({
  matter,
  activeItemId,
  itemMappings,
  itemMappingRules,
  matterById,
  onSelectItem,
  setItemMappingMode,
  updateItemMapping,
  updateItemMappingPart,
}: {
  matter: { id: string; items: Array<{ id: string; name: string; code: string; parentId: string | null; order: number; period?: string }> }
  activeItemId: string | null
  itemMappings: Record<string, { oldItemId: string; newName: string; code: string; parentId: string | null; order: number; commonMetaId: string | null }>
  itemMappingRules: Record<string, { mode: "direct" | "split"; parts: ItemMappingPart[] }>
  matterById: Map<string, { category: MatterCategory; name: string }>
  onSelectItem: (itemId: string) => void
  setItemMappingMode: (oldItemId: string, mode: "direct" | "split") => void
  updateItemMapping: (oldItemId: string, patch: {
    newName?: string
    code?: string
    parentId?: string | null
    order?: number
    commonMetaId?: string | null
  }) => void
  updateItemMappingPart: (oldItemId: string, partId: string, patch: Partial<ItemMappingPart>) => void
}) {
  const itemById = useMemo(() => new Map(matter.items.map((item) => [item.id, item])), [matter.items])

  const itemIdByMappedValue = useMemo(() => {
    const next = new Map<string, string>()
    for (const item of matter.items) {
      const mapping = itemMappings[item.id]
      next.set(mappingKey(mapping?.newName ?? item.name, mapping?.code ?? item.code), item.id)
    }
    return next
  }, [itemMappings, matter.items])

  const applyConnection = useCallback((edge: Edge | null, connection: Connection) => {
    if (!connection.source || !connection.target) return
    const oldItemId = oldItemIdFromNodeId(connection.source)
    const targetItemId = targetItemIdFromNodeId(connection.target)
    const targetItem = targetItemId ? itemById.get(targetItemId) : null
    if (!oldItemId || !targetItem) return

    onSelectItem(oldItemId)

    const patch = {
      targetMatterId: matter.id,
      targetItemId: targetItem.id,
      name: itemMappings[targetItem.id]?.newName ?? targetItem.name,
      code: itemMappings[targetItem.id]?.code ?? targetItem.code,
    }

    const partId = edge ? splitPartIdFromEdgeId(edge.id) : null
    if (partId) {
      updateItemMappingPart(oldItemId, partId, patch)
      return
    }

    setItemMappingMode(oldItemId, "direct")
    updateItemMapping(oldItemId, {
      newName: patch.name,
      code: patch.code,
      parentId: itemMappings[targetItem.id]?.parentId ?? targetItem.parentId,
      order: itemMappings[targetItem.id]?.order ?? targetItem.order,
    })
  }, [
    itemById,
    itemMappings,
    matter.id,
    onSelectItem,
    setItemMappingMode,
    updateItemMapping,
    updateItemMappingPart,
  ])

  const { nodes, edges } = useMemo(() => {
    const nextNodes: Node[] = []
    const nextEdges: Edge[] = []
    const rowHeight = 118
    const targetX = 560

    matter.items.forEach((item, itemIndex) => {
      const mapping = itemMappings[item.id]
      const active = item.id === activeItemId
      const rowY = itemIndex * rowHeight

      nextNodes.push({
        id: `old-${item.id}`,
        type: "input",
        sourcePosition: Position.Right,
        position: { x: 20, y: rowY },
        data: {
          label: (
            <FlowItemNode
              title={item.name}
              code={item.code}
              meta={`表示順 ${item.order}${item.period ? ` / ${item.period}` : ""}`}
              selected={active}
              tone="source"
            />
          ),
        },
        className: "item-flow-node",
      })

      nextNodes.push({
        id: `target-${item.id}`,
        type: "output",
        targetPosition: Position.Left,
        position: { x: targetX, y: rowY },
        data: {
          label: (
            <FlowItemNode
              title={mapping?.newName ?? item.name}
              code={mapping?.code ?? item.code}
              meta="移行先候補"
              selected={active}
              tone="target"
            />
          ),
        },
        className: "item-flow-node",
      })
    })

    matter.items.forEach((item, itemIndex) => {
      const rule = itemMappingRules[item.id]
      const rowY = itemIndex * rowHeight
      const active = item.id === activeItemId

      if (rule?.mode !== "split") {
        const mapping = itemMappings[item.id]
        const targetItemId = itemIdByMappedValue.get(mappingKey(mapping?.newName ?? item.name, mapping?.code ?? item.code))
        const targetNodeId = targetItemId ? `target-${targetItemId}` : `custom-${item.id}`
        if (!targetItemId) {
          nextNodes.push({
            id: targetNodeId,
            type: "output",
            targetPosition: Position.Left,
            position: { x: targetX, y: rowY + 38 },
            data: {
              label: (
                <FlowItemNode
                  title={mapping?.newName ?? "名称未設定"}
                  code={mapping?.code ?? ""}
                  meta="手入力"
                  selected={active}
                  tone="empty"
                />
              ),
            },
            className: "item-flow-node",
          })
        }
        nextEdges.push(edgeFor(`direct-${item.id}`, `old-${item.id}`, targetNodeId, active))
        return
      }

      if (rule.parts.length === 0) {
        nextNodes.push({
          id: `empty-${item.id}`,
          type: "output",
          targetPosition: Position.Left,
          position: { x: targetX, y: rowY + 38 },
          data: {
            label: (
              <FlowItemNode
                title="移行先未設定"
                code=""
                meta="分割先を追加してください"
                selected={active}
                tone="empty"
              />
            ),
          },
          className: "item-flow-node",
        })
        nextEdges.push(edgeFor(`split-empty-${item.id}`, `old-${item.id}`, `empty-${item.id}`, active, true))
        return
      }

      rule.parts.forEach((part, partIndex) => {
        const targetMatter = matterById.get(part.targetMatterId)
        const targetItemId = part.targetMatterId === matter.id && part.targetItemId
          ? part.targetItemId
          : itemIdByMappedValue.get(mappingKey(part.name, part.code))
        let targetNodeId = targetItemId ? `target-${targetItemId}` : `part-${item.id}-${part.id}`

        if (!targetItemId) {
          targetNodeId = `part-${item.id}-${part.id}`
          nextNodes.push({
            id: targetNodeId,
            type: "output",
            targetPosition: Position.Left,
            position: { x: targetX, y: rowY + 46 + partIndex * 74 },
            data: {
              label: (
                <FlowItemNode
                  title={part.name || "名称未設定"}
                  code={part.code}
                  meta={targetMatter ? `${targetMatter.category} / ${targetMatter.name}` : "事項未設定"}
                  selected={active}
                  tone="split"
                />
              ),
            },
            className: "item-flow-node",
          })
        }

        nextEdges.push(edgeFor(`split|${item.id}|${part.id}`, `old-${item.id}`, targetNodeId, active, true))
      })
    })

    return { nodes: nextNodes, edges: nextEdges }
  }, [activeItemId, itemIdByMappedValue, itemMappingRules, itemMappings, matter.id, matter.items, matterById])

  return (
    <div className="h-[680px] min-h-[460px] overflow-hidden rounded-b-md bg-muted/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        minZoom={0.35}
        maxZoom={1.35}
        nodesDraggable={false}
        nodesConnectable
        edgesReconnectable
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        onConnect={(connection) => applyConnection(null, connection)}
        onReconnect={applyConnection}
        onNodeClick={(_, node) => {
          const match = /^old-(.+)$/.exec(node.id) ?? /^part-(.+?)-/.exec(node.id) ?? /^empty-(.+)$/.exec(node.id)
          if (match?.[1]) onSelectItem(match[1])
        }}
      >
        <Background gap={18} size={1} />
        <MiniMap pannable zoomable nodeStrokeWidth={3} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}

function edgeFor(id: string, source: string, target: string, active: boolean, split?: boolean): Edge {
  return {
    id,
    source,
    target,
    animated: active,
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed },
    style: {
      strokeWidth: active ? 3 : 2,
      stroke: active ? "var(--primary)" : split ? "var(--chart-2)" : "var(--border)",
    },
  }
}

function mappingKey(name: string, code: string): string {
  return `${name}\u0000${code}`
}

function oldItemIdFromNodeId(nodeId: string): string | null {
  return /^old-(.+)$/.exec(nodeId)?.[1] ?? null
}

function targetItemIdFromNodeId(nodeId: string): string | null {
  return /^target-(.+)$/.exec(nodeId)?.[1] ?? null
}

function splitPartIdFromEdgeId(edgeId: string): string | null {
  return /^split\|.+\|(.+)$/.exec(edgeId)?.[1] ?? null
}

function FlowItemNode({
  title,
  code,
  meta,
  selected,
  tone,
}: {
  title: string
  code: string
  meta: string
  selected: boolean
  tone: "source" | "target" | "split" | "empty"
}) {
  return (
    <div
      className={cn(
        "flex w-[260px] flex-col gap-2 rounded-md border bg-card px-3 py-2 text-left shadow-sm",
        selected && "border-primary ring-2 ring-primary/20",
        tone === "split" && "border-accent bg-accent/30",
        tone === "empty" && "border-dashed bg-background/70 text-muted-foreground",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
        {code ? (
          <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
            {code}
          </Badge>
        ) : null}
      </div>
      <span className="truncate text-xs text-muted-foreground">{meta}</span>
    </div>
  )
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-lg font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function OldItemSummary({
  item,
  compact,
}: {
  item: { name: string; code: string; order: number; period?: string }
  compact?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className={cn("min-w-0 truncate font-medium", compact ? "text-sm" : "text-base")}>{item.name}</span>
        <Badge variant="outline" className="font-mono">
          {item.code}
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-mono">表示順 {item.order}</span>
        {item.period ? (
          <span className="flex items-center gap-1">
            <CalendarClock className="size-3" />
            {item.period}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function MappingPreview({
  mode,
  parts,
  matterById,
}: {
  mode: "direct" | "split"
  parts: ItemMappingPart[]
  matterById: Map<string, { category: MatterCategory; name: string }>
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center gap-2">
        <Badge variant={mode === "split" ? "default" : "secondary"} className="gap-1">
          {mode === "split" ? <GitBranch className="size-3" /> : <ArrowRight className="size-3" />}
          {mode === "split" ? "分割" : "1:1"}
        </Badge>
        <span className="text-xs text-muted-foreground">移行先構成</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {parts.length ? (
          parts.map((part) => {
            const targetMatter = matterById.get(part.targetMatterId)
            const Icon = targetMatter ? MATTER_CATEGORY_ICONS[targetMatter.category] : ListTree
            return (
              <div key={part.id} className="flex min-w-0 items-center gap-2 rounded-md bg-background px-2 py-1.5 ring-1 ring-border">
                <Icon className="size-4 shrink-0 text-primary" />
                <span className="min-w-0 truncate text-sm">
                  {targetMatter ? `${targetMatter.category}: ` : "未設定: "}
                  <span className="font-medium">{part.name || "名称未設定"}</span>
                </span>
                {part.code ? <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">{part.code}</span> : null}
              </div>
            )
          })
        ) : (
          <div className="rounded-md border border-dashed px-2 py-2 text-xs text-muted-foreground">
            移行先構成が未設定です。
          </div>
        )}
      </div>
    </div>
  )
}

function DirectMappingEditor({
  oldItemId,
  activeNew,
  items,
  itemMappings,
  updateItemMapping,
}: {
  oldItemId: string
  activeNew: { newName: string; code: string; parentId: string | null; order: number; commonMetaId: string | null }
  items: { id: string; name: string }[]
  itemMappings: Record<string, { newName: string }>
  updateItemMapping: (oldItemId: string, patch: {
    newName?: string
    code?: string
    parentId?: string | null
    order?: number
    commonMetaId?: string | null
  }) => void
}) {
  return (
    <FieldGroup className="gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="new-name">新項目名</FieldLabel>
          <Input
            id="new-name"
            value={activeNew.newName}
            onChange={(e) => updateItemMapping(oldItemId, { newName: e.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="new-code">コード</FieldLabel>
          <Input
            id="new-code"
            className="font-mono"
            value={activeNew.code}
            onChange={(e) => updateItemMapping(oldItemId, { code: e.target.value })}
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
            onChange={(e) => updateItemMapping(oldItemId, { order: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="new-parent">親項目</FieldLabel>
          <Select
            value={activeNew.parentId ?? "__none__"}
            onValueChange={(v) => updateItemMapping(oldItemId, { parentId: !v || v === "__none__" ? null : v })}
          >
            <SelectTrigger id="new-parent">
              <SelectValue placeholder="親項目を選択">
                {(value: string) => {
                  if (!value || value === "__none__") return "なし（最上位）"
                  const p = items.find((i) => i.id === value)
                  return p ? (itemMappings[p.id]?.newName ?? p.name) : "なし（最上位）"
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="__none__">なし（最上位）</SelectItem>
                {items
                  .filter((i) => i.id !== oldItemId)
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
          onChange={(v) => updateItemMapping(oldItemId, { commonMetaId: v })}
        />
      </Field>
    </FieldGroup>
  )
}

function SplitMappingEditor({
  oldItemId,
  parts,
  enabledMatters,
  itemMappings,
  matterById,
  addItemMappingPart,
  updateItemMappingPart,
  removeItemMappingPart,
}: {
  oldItemId: string
  parts: ItemMappingPart[]
  enabledMatters: { id: string; category: MatterCategory; name: string; items: { id: string; name: string; code: string }[] }[]
  itemMappings: Record<string, { newName: string; code: string }>
  matterById: Map<string, { category: MatterCategory; name: string }>
  addItemMappingPart: (oldItemId: string, part?: Partial<ItemMappingPart>) => void
  updateItemMappingPart: (oldItemId: string, partId: string, patch: Partial<ItemMappingPart>) => void
  removeItemMappingPart: (oldItemId: string, partId: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">分割後の移行先構成</span>
          <span className="text-xs text-muted-foreground">例: 集計事項「従業者数」 + 分類事項「性別／男」</span>
        </div>
        <Button size="sm" type="button" onClick={() => addItemMappingPart(oldItemId)}>
          <Plus data-icon="inline-start" />
          追加
        </Button>
      </div>

      {parts.length === 0 ? (
        <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          分割先を追加してください。
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {parts.map((part, index) => {
          const targetMatter = matterById.get(part.targetMatterId)
          const targetMatterItems = enabledMatters.find((m) => m.id === part.targetMatterId)?.items ?? []
          return (
            <div key={part.id} className="flex flex-col gap-3 rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary" className="font-mono">#{index + 1}</Badge>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeItemMappingPart(oldItemId, part.id)}
                >
                  <Trash2 data-icon="inline-start" />
                  削除
                </Button>
              </div>
              <Field>
                <FieldLabel>分解先の事項</FieldLabel>
                <Select
                  value={part.targetMatterId || "__none__"}
                  onValueChange={(value) => {
                    const selectedValue = value ?? "__none__"
                    const nextMatterId = selectedValue === "__none__" ? "" : selectedValue
                    updateItemMappingPart(oldItemId, part.id, {
                      targetMatterId: nextMatterId,
                      targetItemId: null,
                      name: "",
                      code: "",
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="事項を選択">
                      {(value: string) => {
                        if (!value || value === "__none__") return "事項を選択"
                        const matter = matterById.get(value)
                        return matter ? `${matter.category}／${matter.name}` : "事項を選択"
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="__none__">事項を選択</SelectItem>
                      {enabledMatters.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.category}／{m.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>分解先の項目</FieldLabel>
                <Select
                  value={part.targetItemId ?? "__custom__"}
                  onValueChange={(value) => {
                    const selectedValue = value ?? "__custom__"
                    if (selectedValue === "__custom__") {
                      updateItemMappingPart(oldItemId, part.id, { targetItemId: null, name: "", code: "" })
                      return
                    }
                    const item = targetMatterItems.find((i) => i.id === selectedValue)
                    updateItemMappingPart(oldItemId, part.id, {
                      targetItemId: selectedValue,
                      name: itemMappings[selectedValue]?.newName ?? item?.name ?? "",
                      code: itemMappings[selectedValue]?.code ?? item?.code ?? "",
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="項目を選択">
                      {(value: string) => {
                        if (!targetMatter) return "先に事項を選択"
                        if (!value || value === "__custom__") return "手入力"
                        const item = targetMatterItems.find((i) => i.id === value)
                        return item ? (itemMappings[item.id]?.newName ?? item.name) : "手入力"
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="__custom__">手入力</SelectItem>
                      {targetMatterItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {itemMappings[item.id]?.newName ?? item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel>名称</FieldLabel>
                  <Input
                    value={part.name}
                    onChange={(e) => updateItemMappingPart(oldItemId, part.id, { name: e.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel>コード</FieldLabel>
                  <Input
                    className="font-mono"
                    value={part.code}
                    onChange={(e) => updateItemMappingPart(oldItemId, part.id, { code: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function directPartsFromMapping(targetMatterId: string, mapping?: { oldItemId: string; newName: string; code: string }): ItemMappingPart[] {
  if (!mapping) return []
  return [
    {
      id: `${mapping.oldItemId}_direct_preview`,
      targetMatterId,
      targetItemId: mapping.oldItemId,
      name: mapping.newName,
      code: mapping.code,
    },
  ]
}
