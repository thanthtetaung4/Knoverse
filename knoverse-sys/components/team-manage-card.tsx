"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useUser } from "@/app/providers/UserProvider";
import { useRouter } from "next/navigation";

type TeamManageCardProps = {
  title: string;
  description: string;
  teamId: string;
};

export default function TeamManageCard({
  title,
  description,
  teamId,
}: TeamManageCardProps) {
  const { accessToken } = useUser();
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleRedirect = (teamId: string) => {
    router.push(`/admin/manage-teams/${teamId}`);
  };

  const handleDeleteUser = (teamId: string) => {
    // Implement user deletion logic here
    setIsDeleting(true);
    try {
      const res = fetch("/api/admin/teams", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ teamId: teamId }),
      });
    } catch (error) {
      console.error("Error deleting user:", error);
    }
    setIsDeleting(false);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{description}</p>
      </CardContent>  
      <CardAction className="flex justify-center gap-2 pl-4">
        <Button
          variant="outline"
          className="group flex items-center gap-2 text-foreground"
          onClick={() => handleDeleteUser(teamId)}
          disabled={isDeleting}
        >
          <svg
            className="h-4 w-4 group-hover:text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </Button>
        <Button
          variant="outline"
          className="group flex items-center gap-2 text-foreground"
          onClick={() => handleRedirect(teamId)}
        >
          Details
        </Button>
      </CardAction>
    </Card>
  );
}
