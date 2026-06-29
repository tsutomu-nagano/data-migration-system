import type { CommonMeta, OldMatter, StatTable } from "./types"

/** 旧システムのメタデータ（移行元・変更不可） */
export const OLD_MATTERS: OldMatter[] = [
  {
    id: "m_sex",
    category: "分類事項",
    name: "性別",
    items: [
      { id: "i_sex_total", name: "総数", code: "0", parentId: null, order: 1 },
      { id: "i_sex_male", name: "男", code: "1", parentId: null, order: 2 },
      { id: "i_sex_female", name: "女", code: "2", parentId: null, order: 3 },
    ],
  },
  {
    id: "m_industry",
    category: "分類事項",
    name: "産業分類",
    items: [
      { id: "i_ind_agri", name: "農業，林業", code: "A", parentId: null, order: 1 },
      { id: "i_ind_manu", name: "製造業", code: "E", parentId: null, order: 2 },
      { id: "i_ind_service", name: "サービス業", code: "R", parentId: null, order: 3 },
    ],
  },
  {
    id: "m_region",
    category: "地域事項",
    name: "市区町村",
    items: [
      { id: "i_reg_saitama20", name: "さいたま市", code: "11100", parentId: null, order: 1, period: "2020年" },
      { id: "i_reg_saitama25", name: "さいたま市", code: "11101", parentId: null, order: 2, period: "2025年" },
      { id: "i_reg_yokohama20", name: "横浜市", code: "14100", parentId: null, order: 3, period: "2020年" },
      { id: "i_reg_yokohama25", name: "横浜市", code: "14100", parentId: null, order: 4, period: "2025年" },
    ],
  },
  {
    id: "m_year",
    category: "時間軸事項",
    name: "調査年次",
    items: [
      { id: "i_year_2015", name: "2015年", code: "2015", parentId: null, order: 1 },
      { id: "i_year_2020", name: "2020年", code: "2020", parentId: null, order: 2 },
      { id: "i_year_2025", name: "2025年", code: "2025", parentId: null, order: 3 },
    ],
  },
  {
    id: "m_aggregate",
    category: "集計事項",
    name: "集計区分",
    items: [
      { id: "i_agg_actual", name: "実数", code: "01", parentId: null, order: 1 },
      { id: "i_agg_ratio", name: "構成比", code: "02", parentId: null, order: 2 },
    ],
  },
  {
    id: "m_unit",
    category: "単位事項",
    name: "単位",
    items: [
      { id: "i_unit_person", name: "人", code: "P", parentId: null, order: 1 },
      { id: "i_unit_household", name: "世帯", code: "H", parentId: null, order: 2 },
      { id: "i_unit_yen", name: "円", code: "Y", parentId: null, order: 3 },
    ],
  },
]

/** 共通メタ（新システムに既存・複数統計で共通利用） */
export const COMMON_META: CommonMeta[] = [
  { id: "cm_sex_total", group: "性別", name: "総数" },
  { id: "cm_sex_male", group: "性別", name: "男" },
  { id: "cm_sex_female", group: "性別", name: "女" },
  { id: "cm_age_0_14", group: "年齢", name: "0〜14歳" },
  { id: "cm_age_15_64", group: "年齢", name: "15〜64歳" },
  { id: "cm_age_65_over", group: "年齢", name: "65歳以上" },
  { id: "cm_job_specialist", group: "職業", name: "専門的・技術的職業" },
  { id: "cm_job_clerical", group: "職業", name: "事務" },
  { id: "cm_job_sales", group: "職業", name: "販売" },
  { id: "cm_ind_agri", group: "産業", name: "農業，林業" },
  { id: "cm_ind_manu", group: "産業", name: "製造業" },
  { id: "cm_ind_service", group: "産業", name: "サービス業" },
  { id: "cm_household_single", group: "世帯", name: "単独世帯" },
  { id: "cm_household_couple", group: "世帯", name: "夫婦のみの世帯" },
  { id: "cm_pref_saitama", group: "都道府県", name: "埼玉県" },
  { id: "cm_pref_kanagawa", group: "都道府県", name: "神奈川県" },
  { id: "cm_pref_tokyo", group: "都道府県", name: "東京都" },
]

/**
 * 旧システムの統計表（統計データそのもの・移行元）。
 * 各表は複数の事項を参照するクロス集計表。
 */
export const STAT_TABLES: StatTable[] = [
  {
    id: "t_pop_sex_region",
    name: "男女別人口（市区町村別）",
    tableNo: "00200521-001",
    matterIds: ["m_sex", "m_region", "m_year", "m_aggregate", "m_unit"],
    cellCount: 1440,
  },
  {
    id: "t_industry_sex",
    name: "産業分類別・男女別就業者数",
    tableNo: "00200521-002",
    matterIds: ["m_industry", "m_sex", "m_year", "m_aggregate", "m_unit"],
    cellCount: 1080,
  },
  {
    id: "t_industry_region",
    name: "産業分類別事業所数（市区町村別）",
    tableNo: "00200552-010",
    matterIds: ["m_industry", "m_region", "m_year", "m_unit"],
    cellCount: 864,
  },
  {
    id: "t_pop_total",
    name: "総人口の推移（年次別）",
    tableNo: "00200521-100",
    matterIds: ["m_year", "m_aggregate", "m_unit"],
    cellCount: 18,
  },
]
