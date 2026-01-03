"use client";

import { useEffect, useState } from "react";
import { useUser } from "../providers/UserProvider";
import StatsCard from "@/components/dashboard-stats-card";
import { Card } from "@/components/ui/card";
import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { FaUsers, FaFileAlt, FaProjectDiagram } from "react-icons/fa";
import HeaderCard from "@/components/dashboard-header-card";
import TeamActivityCard from "@/components/team-activity-catd";
import { createClient } from "@/lib/supabase/client";

const chartConfig = {
  users: { label: "Users", color: "#3b82f6" },
  activity: { label: "Activity", color: "#f8721a" },
} satisfies ChartConfig;

export default function AdminPage() {
  const [totalUsers, setTotalUsers] = useState<string | null>(null);
  const [totalFiles, setTotalFiles] = useState<string | null>(null);
  const [activeTeams, setActiveTeams] = useState<string | null>(null);
  const [topTeams, setTopTeams] = useState<Array<{
    name: string;
    activity: number;
  }> | null>(null);
  const [teamStats, setTeamStats] = useState<Array<{
    teamId?: string | null;
    teamName: string | null;
    userCount: number;
    activityCount: number;
  }> | null>(null);
  const [teamChartData, setTeamChartData] = useState<
    Array<{ teamName: string; userCount: number; activityCount: number }>
  >([]);
  const { accessToken } = useUser();

  useEffect(() => {
    const supabase = createClient();

    async function fetchTeamStats() {
      try {
        const res = await fetch("/api/admin/analytics/usage", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        const stats = data.teamStats ?? data.stats ?? [];
        setTeamStats(stats);
        const top = (stats || [])
          .slice()
          .sort(
            (a: any, b: any) => (b.activityCount ?? 0) - (a.activityCount ?? 0)
          )
          .slice(0, 5)
          .map((s: any) => ({
            teamName: s.teamName ?? "Unknown",
            userCount: Number(s.userCount ?? 0),
            activityCount: Number(s.activityCount ?? 0),
          }));
        setTeamChartData(top);
        // also set topTeams used by the UI list
        setTopTeams(
          top.map((t: any) => ({ name: t.teamName, activity: t.activityCount }))
        );
      } catch (err) {
        console.error("Error fetching team stats:", err);
      }
    }

    // Fetch total users
    fetch("/api/admin/users/number-of-users", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setTotalUsers(data.numberOfUsers);
      })
      .catch((err) => {
        console.error("Error fetching total users:", err);
      });

    // Fetch total files
    fetch("/api/admin/files/number-of-files", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setTotalFiles(data.numberOfFiles);
        console.log("data.numberOfFiles:", data.numberOfFiles);
      })
      .catch((err) => {
        console.error("Error fetching total files:", err);
      });

    // Fetch active teams
    fetch("/api/admin/teams/number-of-teams", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setActiveTeams(data.numberOfTeams);
      })
      .catch((err) => {
        console.error("Error fetching active teams:", err);
      });

    // Fetch team stats initially
    fetchTeamStats();

    // Subscribe to realtime changes on analytics_events and refetch on change
    const subscription = supabase
      .channel("public:analytics_events")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "analytics_events" },
        (payload) => {
          // any insert/update/delete on analytics_events -> refresh stats
          console.debug("analytics_events change", payload);
          fetchTeamStats();
        }
      )
      .subscribe();

    return () => {
      try {
        subscription.unsubscribe();
      } catch (e) {
        console.warn("Failed to unsubscribe supabase channel", e);
      }
    };
  }, [accessToken]);

  return (
    <div>
      {/* Header Section */}
      <div className="mb-8">
        <HeaderCard
          title="Admin Dashboard"
          description="Overview of key metrics and user activity"
        />
      </div>

      {/* Stats Cards Section */}
      <div>
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <StatsCard
            title="Total Users"
            value={totalUsers ? totalUsers : "N/A"}
            icon={FaUsers}
          />
          <StatsCard
            title="Active Teams"
            value={activeTeams ? activeTeams : "N/A"}
            icon={FaProjectDiagram}
          />
          <StatsCard
            title="Files Uploaded"
            value={totalFiles ? totalFiles : "N/A"}
            icon={FaFileAlt}
            iconClassName="text-4xl text-blue-600"
          />
        </div>
      </div>

      {/* User Activity Section */}
      <div className="mt-12">
        <h2 className="text-3xl font-sans font-bold mb-4">User Activity</h2>
      </div>
      <div className="mt-8 grid sm:grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Activity Chart */}
        <Card className="p-4 border rounded-lg">
          <ChartContainer config={chartConfig}>
            <BarChart width={600} height={300} data={teamChartData}>
              <XAxis dataKey="teamName" />
              <Tooltip />
              <Legend />
              <Bar dataKey="userCount" fill={chartConfig.users.color} />
              <Bar dataKey="activityCount" fill={chartConfig.activity.color} />
            </BarChart>
          </ChartContainer>
        </Card>

        {/* Teams With Most Activity */}
        <Card className="p-4 border rounded-lg">
          <h3 className="text-2xl font-semibold mb-4">
            Teams With Most Activity
          </h3>
          {topTeams?.map((team, index) => (
            <TeamActivityCard team={team} key={index} />
          ))}
        </Card>
      </div>
    </div>
  );
}
