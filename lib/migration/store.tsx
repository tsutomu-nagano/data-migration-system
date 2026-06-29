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
  matterRefs: MatterReference[]
  tableDecisions: Record<string, MigrationDecision>
}

interface MigrationContextValue extends MigrationState {
  enableMatterMapping: (oldMatterId: string) => void
  disableMatterMapping: (oldMatterId: string) => void
  updateMatterMapping: (oldMatterId: string, patch: Partial<NewMatterMapping>) => void
  updateItemMapping: (oldItemId: string, patch: Partial<NewItemMapping>) => void
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
    },
    [],
  )

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
        const allMapped = matter.items.every((i) => itemMappings[i.id])
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
    [matterMappings, itemMappings, tableDecisions],
  )

  const resetAll = useCallback(() => {
    setMatterMappings({})
    setItemMappings({})
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
      matterRefs,
      tableDecisions,
      enableMatterMapping,
      disableMatterMapping,
      updateMatterMapping,
      updateItemMapping,
      addMatterRef,
      removeMatterRef,
      setTableDecision,
      getTableReadiness,
      resetAll,
    }),
    [
      matterMappings,
      itemMappings,
      matterRefs,
      tableDecisions,
      enableMatterMapping,
      disableMatterMapping,
      updateMatterMapping,
      updateItemMapping,
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
