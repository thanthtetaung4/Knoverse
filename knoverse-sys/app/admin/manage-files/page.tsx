"use client";

import Link from "next/link";
import ManageFilesControls from "@/components/manage-files-controls";
import { teams } from "@/db/schema";
import HeaderCard from "@/components/dashboard-header-card";
import TeamCard from "@/components/team-card";
import { useState, useEffect, use } from "react";
import { useUser } from "@/app/providers/UserProvider";

type Team = typeof teams.$inferSelect;

export default function ManageFilesPage() {
  const [teamRows, setTeamRows] = useState<Team[]>([]);
  const { accessToken } = useUser();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch("/api/admin/teams", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setTeamRows(data.teams);
        } else {
          console.error("Failed to fetch teams:", data.error);
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    fetchTeams();
  }, []);
  return (
    <div>
      <HeaderCard title="Manage Files" description="Manage team files here" />

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {teamRows.map((t: Team) => (
          <TeamCard key={t.id} team={t} />
        ))}
      </section>

      {/* <ManageFilesControls /> */}
    </div>
  );
}
