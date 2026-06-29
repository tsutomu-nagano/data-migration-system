"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { COMMON_META, OLD_MATTERS, STAT_TABLES } from "./seed"
import type {
  CommonMeta,
  ItemMappingPart,
  ItemMappingRule,
  MatterReference,
  MigrationDecision,
  NewItemMapping,
  NewMatterMapping,
  OldMatter,
  StatTable,
  TableReadiness,
} from "./types"

interface MigrationState {
  oldMatters: OldMatter[]
  commonMeta: CommonMeta[]
  statTables: StatTable[]
  matterMappings: Record<string, NewMatterMapping>
  itemMappings: Record<string, NewItemMapping>
  itemMappingRules: Record<string, ItemMappingRule>
  matterRefs: MatterReference[]
  tableDecisions: Record<string, MigrationDecision>
}

interface MigrationContextValue extends MigrationState {
  enableMatterMapping: (oldMatterId: string) => void
  disableMatterMapping: (oldMatterId: string) => void
  updateMatterMapping: (oldMatterId: string, patch: Partial<NewMatterMapping>) => void
  updateItemMapping: (oldItemId: string, patch: Partial<NewItemMapping>) => void
  setItemMappingMode: (oldItemId: string, mode: ItemMappingRule["mode"]) => void
  addItemMappingPart: (oldItemId: string, part?: Partial<ItemMappingPart>) => void
  updateItemMappingPart: (oldItemId: string, partId: string, patch: Partial<ItemMappingPart>) => void
  removeItemMappingPart: (oldItemId: string, partId: string) => void
  addMatterRef: (fromMatterId: string, toMatterId: string) => void
  removeMatterRef: (id: string) => void
  setTableDecision: (tableId: string, decision: MigrationDecision) => void
  /** 統計表ごとの移行可否を自動評価（手動上書きを加味した結論を含む） */
  getTableReadiness: (tableId: string) => TableReadiness
  resetAll: () => void
}

const MigrationContext = createContext<MigrationContextValue | null>(null)

export function MigrationProvider({ children }: { children: ReactNode }) {
  const [matterMappings, setMatterMappings] = useState<Record<string, NewMatterMapping>>({})
  const [itemMappings, setItemMappings] = useState<Record<string, NewItemMapping>>({})
  const [itemMappingRules, setItemMappingRules] = useState<Record<string, ItemMappingRule>>({})
  const [matterRefs, setMatterRefs] = useState<MatterReference[]>([])
  const [tableDecisions, setTableDecisions] = useState<Record<string, MigrationDecision>>({})

  const enableMatterMapping = useCallback((oldMatterId: string) => {
    const matter = OLD_MATTERS.find((m) => m.id === oldMatterId)
    if (!matter) return
    setMatterMappings((prev) => ({
      ...prev,
      [oldMatterId]: { oldMatterId, newName: matter.name, enabled: true },
    }))
    setItemMappings((prev) => {
      const next = { ...prev }
      for (const item of matter.items) {
        if (!next[item.id]) {
          next[item.id] = {
            oldItemId: item.id,
            newName: item.name,
            code: item.code,
            parentId: item.parentId,
            order: item.order,
            commonMetaId: null,
          }
        }
      }
      return next
    })
    setItemMappingRules((prev) => {
      const next = { ...prev }
      for (const item of matter.items) {
        if (!next[item.id]) {
          next[item.id] = {
            oldItemId: item.id,
            mode: "direct",
            parts: [
              {
                id: `${item.id}_direct`,
                targetMatterId: oldMatterId,
                targetItemId: item.id,
                name: item.name,
                code: item.code,
              },
            ],
          }
        }
      }
      return next
    })
  }, [])

  const disableMatterMapping = useCallback((oldMatterId: string) => {
    setMatterMappings((prev) => {
      const next = { ...prev }
      delete next[oldMatterId]
      return next
    })
  }, [])

  const updateMatterMapping = useCallback(
    (oldMatterId: string, patch: Partial<NewMatterMapping>) => {
      setMatterMappings((prev) => {
        const cur = prev[oldMatterId]
        if (!cur) return prev
        return { ...prev, [oldMatterId]: { ...cur, ...patch } }
      })
    },
    [],
  )

  const updateItemMapping = useCallback(
    (oldItemId: string, patch: Partial<NewItemMapping>) => {
      setItemMappings((prev) => {
        const cur = prev[oldItemId]
        if (!cur) return prev
        return { ...prev, [oldItemId]: { ...cur, ...patch } }
      })
      setItemMappingRules((prev) => {
        const cur = prev[oldItemId]
        if (!cur || cur.mode !== "direct") return prev
        return {
          ...prev,
          [oldItemId]: {
            ...cur,
            parts: cur.parts.map((part) =>
              part.targetItemId === oldItemId
                ? {
                    ...part,
                    name: patch.newName ?? part.name,
                    code: patch.code ?? part.code,
                  }
                : part,
            ),
          },
        }
      })
    },
    [],
  )

  const setItemMappingMode = useCallback((oldItemId: string, mode: ItemMappingRule["mode"]) => {
    setItemMappingRules((prev) => {
      const current = prev[oldItemId]
      const item = OLD_MATTERS.flatMap((m) => m.items).find((i) => i.id === oldItemId)
      const matter = OLD_MATTERS.find((m) => m.items.some((i) => i.id === oldItemId))
      if (!item || !matter) return prev

      const directPart: ItemMappingPart = {
        id: `${oldItemId}_direct`,
        targetMatterId: matter.id,
        targetItemId: oldItemId,
        name: itemMappings[oldItemId]?.newName ?? item.name,
        code: itemMappings[oldItemId]?.code ?? item.code,
      }

      return {
        ...prev,
        [oldItemId]: {
          oldItemId,
          mode,
          parts: mode === "direct" ? [directPart] : current?.parts ?? [directPart],
        },
      }
    })
  }, [itemMappings])

  const addItemMappingPart = useCallback((oldItemId: string, part: Partial<ItemMappingPart> = {}) => {
    setItemMappingRules((prev) => {
      const current = prev[oldItemId] ?? { oldItemId, mode: "split", parts: [] }
      const nextPart: ItemMappingPart = {
        id: `part_${Date.now()}`,
        targetMatterId: part.targetMatterId ?? "",
        targetItemId: part.targetItemId ?? null,
        name: part.name ?? "",
        code: part.code ?? "",
      }
      return {
        ...prev,
        [oldItemId]: { ...current, mode: "split", parts: [...current.parts, nextPart] },
      }
    })
  }, [])

  const updateItemMappingPart = useCallback(
    (oldItemId: string, partId: string, patch: Partial<ItemMappingPart>) => {
      setItemMappingRules((prev) => {
        const current = prev[oldItemId]
        if (!current) return prev
        return {
          ...prev,
          [oldItemId]: {
            ...current,
            parts: current.parts.map((part) =>
              part.id === partId ? { ...part, ...patch } : part,
            ),
          },
        }
      })
    },
    [],
  )

  const removeItemMappingPart = useCallback((oldItemId: string, partId: string) => {
    setItemMappingRules((prev) => {
      const current = prev[oldItemId]
      if (!current) return prev
      return {
        ...prev,
        [oldItemId]: { ...current, parts: current.parts.filter((part) => part.id !== partId) },
      }
    })
  }, [])

  const addMatterRef = useCallback((fromMatterId: string, toMatterId: string) => {
    if (fromMatterId === toMatterId) return
    setMatterRefs((prev) => {
      if (prev.some((r) => r.fromMatterId === fromMatterId && r.toMatterId === toMatterId)) {
        return prev
      }
      return [...prev, { id: `ref_${Date.now()}`, fromMatterId, toMatterId }]
    })
  }, [])

  const removeMatterRef = useCallback((id: string) => {
    setMatterRefs((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const setTableDecision = useCallback((tableId: string, decision: MigrationDecision) => {
    setTableDecisions((prev) => ({ ...prev, [tableId]: decision }))
  }, [])

  const getTableReadiness = useCallback(
    (tableId: string): TableReadiness => {
      const table = STAT_TABLES.find((t) => t.id === tableId)
      if (!table) {
        return {
          tableId,
          status: "blocked",
          missingMatterIds: [],
          unmappedMatterIds: [],
          willMigrate: false,
        }
      }

      const missingMatterIds: string[] = []
      const unmappedMatterIds: string[] = []

      for (const matterId of table.matterIds) {
        const matter = OLD_MATTERS.find((m) => m.id === matterId)
        if (!matter) continue
        // 移行対象として有効化されていない参照事項
        if (!matterMappings[matterId]?.enabled) {
          missingMatterIds.push(matterId)
          continue
        }
        // 有効だが項目マッピングが未完了（全項目が揃っていない）
        const allMapped = matter.items.every((i) => {
          const mapping = itemMappings[i.id]
          const rule = itemMappingRules[i.id]
          if (!mapping || !rule) return false
          if (rule.mode === "direct") return rule.parts.length > 0
          return rule.parts.length > 0 && rule.parts.every((part) => part.targetMatterId && part.name)
        })
        if (!allMapped) unmappedMatterIds.push(matterId)
      }

      let status: TableReadiness["status"]
      if (missingMatterIds.length > 0) status = "blocked"
      else if (unmappedMatterIds.length > 0) status = "partial"
      else status = "ready"

      // 手動上書きを加味した最終結論
      const decision = tableDecisions[tableId] ?? "auto"
      let willMigrate: boolean
      if (decision === "exclude") willMigrate = false
      else willMigrate = status === "ready"

      return { tableId, status, missingMatterIds, unmappedMatterIds, willMigrate }
    },
    [matterMappings, itemMappings, itemMappingRules, tableDecisions],
  )

  const resetAll = useCallback(() => {
    setMatterMappings({})
    setItemMappings({})
    setItemMappingRules({})
    setMatterRefs([])
    setTableDecisions({})
  }, [])

  const value = useMemo<MigrationContextValue>(
    () => ({
      oldMatters: OLD_MATTERS,
      commonMeta: COMMON_META,
      statTables: STAT_TABLES,
      matterMappings,
      itemMappings,
      itemMappingRules,
      matterRefs,
      tableDecisions,
      enableMatterMapping,
      disableMatterMapping,
      updateMatterMapping,
      updateItemMapping,
      setItemMappingMode,
      addItemMappingPart,
      updateItemMappingPart,
      removeItemMappingPart,
      addMatterRef,
      removeMatterRef,
      setTableDecision,
      getTableReadiness,
      resetAll,
    }),
    [
      matterMappings,
      itemMappings,
      itemMappingRules,
      matterRefs,
      tableDecisions,
      enableMatterMapping,
      disableMatterMapping,
      updateMatterMapping,
      updateItemMapping,
      setItemMappingMode,
      addItemMappingPart,
      updateItemMappingPart,
      removeItemMappingPart,
      addMatterRef,
      removeMatterRef,
      setTableDecision,
      getTableReadiness,
      resetAll,
    ],
  )

  return <MigrationContext.Provider value={value}>{children}</MigrationContext.Provider>
}

export function useMigration() {
  const ctx = useContext(MigrationContext)
  if (!ctx) throw new Error("useMigration must be used within MigrationProvider")
  return ctx
}
