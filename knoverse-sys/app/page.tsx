"use client"
import { useUser } from "./providers/UserProvider";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import ProfileTab from "@/components/profile";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ProjectType {
  projectName: string;
  projectDescription: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}


type Teams = {
  id: string;
  name: string;
  description: string;
}[];

function ProjectCard({projectName, projectDescription, onClick}:ProjectType) {
  return <Card className="h-40 w-80 px-4 cursor-pointer " onClick={onClick}>
    <CardTitle>{ projectName }</CardTitle>
    <CardDescription>{ projectDescription }</CardDescription>
  </Card>
}
export default function Home() {
  const { user, accessToken } = useUser();
  const [teams, setTeams] = useState<Teams>([])
  const router = useRouter();

  const handleOnClick = (teamId: string) => {
    router.push(`/chat/${teamId}`)
  }

  useEffect(() => {
    const fetchTeams = async () => {
      if (user) {
        try {
          const response = await fetch("/api/get/user/teams/?userId=" + user?.id, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          const data = await response.json();
          setTeams(Array.isArray(data?.teams) ? data.teams : []);
        } catch (error) {
          console.error("Error fetching teams:", error);
        }
      }
    };

    fetchTeams();
  }, [user, accessToken]);
  return (
    <div className="flex gap-5 h-full">
      <ProfileTab user={ user} />
      <div>
        <p className="mt-4 mb-10 text-3xl">Projects</p>
        <div className="flex gap-4">
          {(teams ?? []).map((team) => (
            <ProjectCard key={team.id} projectName={team.name} projectDescription={team.description} onClick={() => handleOnClick(team.id)}/>
          ))}
        </div>
      </div>
    </div>
  );
}
