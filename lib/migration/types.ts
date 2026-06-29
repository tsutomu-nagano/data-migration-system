// 統計データ移行支援システム - 型定義

/** 事項種別（メタデータ種別） */
export type MatterCategory =
  | "分類事項"
  | "地域事項"
  | "時間軸事項"
  | "集計事項"
  | "単位事項"

export const MATTER_CATEGORIES: MatterCategory[] = [
  "分類事項",
  "地域事項",
  "時間軸事項",
  "集計事項",
  "単位事項",
]

/** 旧システムの項目 */
export interface OldItem {
  id: string
  name: string
  code: string
  /** 親項目ID（階層構造） */
  parentId: string | null
  order: number
  /** 地域事項のみ: 基準時点（例: 2020年） */
  period?: string
}

/** 旧システムの事項 */
export interface OldMatter {
  id: string
  category: MatterCategory
  name: string
  items: OldItem[]
}

/** 共通メタ（性別・年齢など複数統計で共通利用される概念） */
export interface CommonMeta {
  id: string
  /** 共通メタのグループ名（例: 性別） */
  group: string
  /** グループ内の値（例: 男） */
  name: string
}

/** 新システムの事項（旧事項から新規作成） */
export interface NewMatterMapping {
  oldMatterId: string
  newName: string
  /** 移行対象として有効化されているか */
  enabled: boolean
}

/** 新システムの項目（旧項目から新規作成） */
export interface NewItemMapping {
  oldItemId: string
  newName: string
  code: string
  parentId: string | null
  order: number
  /** 共通メタ参照（任意） */
  commonMetaId: string | null
}

/** 旧項目をどのように移行先へ対応させるか */
export type ItemMappingMode = "direct" | "split"

/** 旧項目を分解した移行先構成要素 */
export interface ItemMappingPart {
  id: string
  /** 分解先の事項ID */
  targetMatterId: string
  /** 既存の新項目に紐づく場合の旧項目ID */
  targetItemId: string | null
  name: string
  code: string
}

/** 旧項目ごとの対応ルール。direct は従来の 1:1、split は 1:N 分解。 */
export interface ItemMappingRule {
  oldItemId: string
  mode: ItemMappingMode
  parts: ItemMappingPart[]
}

/** 事項間参照 */
export interface MatterReference {
  id: string
  fromMatterId: string
  toMatterId: string
}

/** 統計表（統計データそのもの。複数の事項を参照するクロス表） */
export interface StatTable {
  id: string
  /** 統計表名 */
  name: string
  /** 政府統計コードや表番号など */
  tableNo: string
  /** この表が参照する事項ID（性別×学歴×集計事項×地域 等） */
  matterIds: string[]
  /** 観測値セル数（規模の目安） */
  cellCount: number
}

/** 統計表の移行判定（ユーザーによる手動上書き） */
export type MigrationDecision = "auto" | "include" | "exclude"

/** 統計表の移行可否ステータス（自動評価） */
export type ReadinessStatus = "ready" | "partial" | "blocked"

/** 統計表の移行可否評価結果 */
export interface TableReadiness {
  tableId: string
  /** 自動評価ステータス */
  status: ReadinessStatus
  /** 移行対象に含まれていない参照事項ID */
  missingMatterIds: string[]
  /** 参照事項のうち項目マッピングが未完了の事項ID */
  unmappedMatterIds: string[]
  /** 最終的に移行するか（手動上書きを加味した結論） */
  willMigrate: boolean
}

/** 共通メタ表示用ラベル（例: 性別／男） */
export function commonMetaLabel(meta: CommonMeta): string {
  return `${meta.group}／${meta.name}`
}
