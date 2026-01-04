"use client";
import { useUser } from "@/app/providers/UserProvider";
import HeaderCard from "@/components/dashboard-header-card";
import TeamManageCard from "@/components/team-manage-card";
import { useEffect, useState } from "react";

type Teams = {
  id: string;
  name: string;
  description: string;
}[];

export default function ManageTeamsPage() {
  const [teams, setTeams] = useState<Teams>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { accessToken } = useUser();

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/teams", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      setTeams(data.teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return (
    <>
      <HeaderCard
        title="Manage Teams"
        description="Manage your teams and their settings."
      />
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p>Loading teams...</p>
        ) : (
          teams.map((team) => (
            <TeamManageCard
              key={team.id}
              title={team.name}
              description={team.description}
              teamId={team.id}
            />
          ))
        )}
      </div>
    </>
  );
}
