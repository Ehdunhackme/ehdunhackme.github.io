import type { Metadata } from "next";
import { ProjectsContent } from "@/content/projects";
export const metadata: Metadata = {
  title: "My Project Board",
  description: "Selected research and projects by Dun Li Chan.",
  alternates: { canonical: "/projects/" },
};
export default function Projects() {
  return <ProjectsContent />;
}
