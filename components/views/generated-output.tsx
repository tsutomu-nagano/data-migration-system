"use client"

import { Check, Copy, Download, FileJson } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMigration } from "@/lib/migration/store"
import { commonMetaLabel } from "@/lib/migration/types"

export function GeneratedOutput() {
  const { oldMatters, commonMeta, matterMappings, itemMappings, matterRefs } = useMigration()
  const [copied, setCopied] = useState(false)

  const output = useMemo(() => {
    const enabled = oldMatters.filter((m) => matterMappings[m.id]?.enabled)

    const targetMetadata = enabled.map((m) => ({
      newMatterId: `NEW_${m.id}`,
      name: matterMappings[m.id].newName,
      category: m.category,
      items: m.items
        .filter((i) => itemMappings[i.id])
        .map((i) => {
          const nm = itemMappings[i.id]
          return {
            newItemId: `NEW_${i.id}`,
            name: nm.newName,
            code: nm.code,
            parentId: nm.parentId ? `NEW_${nm.parentId}` : null,
            order: nm.order,
            commonMetaRef: nm.commonMetaId ?? null,
          }
        }),
    }))

    const metadataMapping = {
      matters: enabled.map((m) => ({
        oldMatterId: m.id,
        newMatterId: `NEW_${m.id}`,
      })),
      items: enabled.flatMap((m) =>
        m.items
          .filter((i) => itemMappings[i.id])
          .map((i) => ({
            oldItemId: i.id,
            newItemId: `NEW_${i.id}`,
            period: i.period ?? null,
          })),
      ),
    }

    const commonMetaReferences = Object.values(itemMappings)
      .filter((i) => i.commonMetaId)
      .map((i) => {
        const meta = commonMeta.find((c) => c.id === i.commonMetaId)
        return {
          newItemId: `NEW_${i.oldItemId}`,
          commonMetaId: i.commonMetaId,
          commonMetaLabel: meta ? commonMetaLabel(meta) : null,
        }
      })

    const matterReferences = matterRefs.map((r) => ({
      fromMatterId: `NEW_${r.fromMatterId}`,
      toMatterId: `NEW_${r.toMatterId}`,
    }))

    return {
      generatedAt: "2026-06-29T00:00:00+09:00",
      移行先メタデータ: targetMetadata,
      メタデータマッピング情報: metadataMapping,
      共通メタ参照情報: commonMetaReferences,
      事項間参照情報: matterReferences,
      データ移行用パラメータ: {
        対象事項数: targetMetadata.length,
        対象項目数: metadataMapping.items.length,
        共通メタ参照数: commonMetaReferences.length,
        事項間参照数: matterReferences.length,
      },
    }
  }, [oldMatters, commonMeta, matterMappings, itemMappings, matterRefs])

  const json = JSON.stringify(output, null, 2)
  const summary = output.データ移行用パラメータ

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      toast.success("JSONをコピーしました。")
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("コピーに失敗しました。")
    }
  }

  const handleDownload = () => {
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "migration-parameters.json"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("移行パラメータをダウンロードしました。")
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">生成パラメータ</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          マッピング設計の結果から、移行先メタデータと移行用パラメータを生成します。
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="対象事項数" value={summary.対象事項数} />
        <SummaryCard label="対象項目数" value={summary.対象項目数} />
        <SummaryCard label="共通メタ参照数" value={summary.共通メタ参照数} />
        <SummaryCard label="事項間参照数" value={summary.事項間参照数} />
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileJson className="size-4 text-primary" />
            migration-parameters.json
            <Badge variant="secondary" className="font-mono">
              {json.split("\n").length} 行
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check data-icon="inline-start" />
              ) : (
                <Copy data-icon="inline-start" />
              )}
              コピー
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download data-icon="inline-start" />
              ダウンロード
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[480px]">
            <pre className="p-4 font-mono text-xs leading-relaxed">
              <code>{json}</code>
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 py-4">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="font-mono text-2xl font-semibold tabular-nums">{value}</span>
      </CardContent>
    </Card>
  )
}
