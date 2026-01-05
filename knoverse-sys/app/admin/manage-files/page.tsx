'use server'

import Link from 'next/link'
import ManageFilesControls from '@/components/manage-files-controls'
import { db } from '@/db'
import { teams } from '@/db/schema'
import HeaderCard from '@/components/dashboard-header-card'
import TeamCard from '@/components/team-card'

export default async function ManageFilesPage() {
  // fetch teams server-side
  const teamRows = await db.select().from(teams)

  return (
    <div>
      <HeaderCard title="Manage Files" description='Manage team files here' />

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {teamRows.map((t: typeof teams.$inferSelect) => (
          <TeamCard key={t.id} team={t} />
        ))}
      </section>

      {/* <ManageFilesControls /> */}
    </div>
  )
}
