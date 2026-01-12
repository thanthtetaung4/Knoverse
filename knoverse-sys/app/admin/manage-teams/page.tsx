"use client";
import { useUser } from "@/app/providers/UserProvider";
import HeaderCard from "@/components/dashboard-header-card";
import TeamManageCard from "@/components/team-manage-card";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Teams = {
  id: string;
  name: string;
  description: string;
}[];

export default function ManageTeamsPage() {
  const [teams, setTeams] = useState<Teams>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { accessToken } = useUser();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [teamDeleted, setTeamDeleted] = useState(false);

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
    setTeamDeleted(false);
  }, [teamDeleted]);

  const handleAddTeam = async () => {
    try {
      const response = await fetch("/api/admin/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          teamName: newTeam.name,
          description: newTeam.description,
        }),
      });
      if (response.ok) {
        setShowAddDialog(false);
        setNewTeam({ name: "", description: "" });
        fetchTeams();
      } else {
        console.error("Failed to add team");
      }
    } catch (error) {
      console.error("Error adding team:", error);
    }
  };

  return (
    <>
      <HeaderCard
        title="Manage Teams"
        description="Manage your teams and their settings."
      />
      <div>
        <Button
          variant="outline"
          className="group flex items-center gap-2 text-foreground"
          onClick={() => setShowAddDialog(true)}
        >
          <svg
            className="h-4 w-4 group-hover:text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          <span>Add Team</span>
        </Button>
      </div>
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
              setTeamDeleted={setTeamDeleted}
            />
          ))
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Team</DialogTitle>
            <DialogDescription>
              Enter the details of the new user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Team Name"
                value={newTeam.name}
                onChange={(e) =>
                  setNewTeam({ ...newTeam, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Team Description"
                value={newTeam.description}
                onChange={(e) =>
                  setNewTeam({ ...newTeam, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTeam}>Add Team</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
