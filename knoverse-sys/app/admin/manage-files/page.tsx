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

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
      {teamRows.map((t: typeof teams.$inferSelect) => (
          <TeamCard key={t.id} team={t} />
        ))}
      </section>

      <ManageFilesControls />
    </div>
  )
}
