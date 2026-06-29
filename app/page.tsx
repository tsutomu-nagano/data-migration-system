"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { CommonMetaView } from "@/components/views/common-meta-view"
import { GeneratedOutput } from "@/components/views/generated-output"
import { ItemMapping } from "@/components/views/item-mapping"
import { MatterReferences } from "@/components/views/matter-references"
import { MattersOverview } from "@/components/views/matters-overview"
import { StatDataMigration } from "@/components/views/stat-data-migration"
import { MigrationProvider } from "@/lib/migration/store"
import type { ViewKey } from "@/lib/migration/views"

export default function Page() {
  const [view, setView] = useState<ViewKey>("overview")
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null)

  const openMapping = (matterId: string) => {
    setSelectedMatterId(matterId)
    setView("mapping")
  }

  return (
    <MigrationProvider>
      <div className="flex min-h-dvh">
        <AppSidebar view={view} onNavigate={setView} />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
            {view === "overview" && <MattersOverview onOpenMapping={openMapping} />}
            {view === "mapping" && (
              <ItemMapping
                selectedMatterId={selectedMatterId}
                onSelectMatter={setSelectedMatterId}
              />
            )}
            {view === "common-meta" && <CommonMetaView />}
            {view === "references" && <MatterReferences />}
            {view === "data-migration" && <StatDataMigration />}
            {view === "output" && <GeneratedOutput />}
          </div>
        </main>
      </div>
    </MigrationProvider>
  )
}
