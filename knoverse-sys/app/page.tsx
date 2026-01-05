"use client"
import Image from "next/image";
import { useUser } from "./providers/UserProvider";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import ProfileTab from "@/components/profile";

interface ProjectType {
  projectName: string;
  projectDescription: string;
}

const Projects = [
  {
    projectId: 1,
    projectName: "Knoverse",
    projectDescription: "Transcendence Project",
  },
  {
    projectId: 2,
    projectName: "Webserv",
    projectDescription: "Nginx like server"
  }
]

function ProjectCard({projectName, projectDescription}:ProjectType) {
  return <Card className="h-40 w-80 px-4 cursor-pointer " >
    <CardTitle>{ projectName }</CardTitle>
    <CardDescription>{ projectDescription }</CardDescription>
  </Card>
}

export default function Home() {
  return (
    <div className="flex gap-5 h-full">
      <ProfileTab/>
      <div>
        <p className="mt-4 mb-10 text-3xl">Projects</p>
        <div className="flex gap-4">
          {
            Projects.map((project) => <ProjectCard key={project.projectId} projectName={project.projectName} projectDescription={ project.projectDescription } />)
          }
        </div>
      </div>
    </div>
  );
}
