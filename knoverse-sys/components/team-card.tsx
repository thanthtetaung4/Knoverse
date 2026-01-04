'use client';
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

type TeamCardProps = {
  team: {
	  name: string | null;
	  description?: string | null;
	id: string | null;
	createdAt: Date | null;
  }
};

export default function TeamCard({ team }: TeamCardProps) {
	const router = useRouter();

  return (
    <Card onClick={() => router.push(`/admin/manage-files/${team.id}`)} style={{ cursor: 'pointer' }}>
		<CardHeader>
			<CardTitle>{team.name}</CardTitle>
		</CardHeader>
		<CardContent>
			{team.description ? <p>{team.description}</p> : <p>ID: {team.id}</p>}
		</CardContent>
	</Card>
  )
}

