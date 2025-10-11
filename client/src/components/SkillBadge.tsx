import { Badge } from "@/components/ui/badge";
import { Hammer, Wrench, Droplet, PaintBucket, HardHat } from "lucide-react";
import type { SkillType } from "@shared/schema";

const skillIcons = {
  mason: Hammer,
  carpenter: Wrench,
  plumber: Droplet,
  painter: PaintBucket,
  helper: HardHat,
};

const skillLabels = {
  mason: "Mason",
  carpenter: "Carpenter",
  plumber: "Plumber",
  painter: "Painter",
  helper: "Helper",
};

interface SkillBadgeProps {
  skill: SkillType;
  className?: string;
}

export function SkillBadge({ skill, className }: SkillBadgeProps) {
  const Icon = skillIcons[skill];
  
  return (
    <Badge variant="secondary" className={className} data-testid={`badge-skill-${skill}`}>
      <Icon className="h-3 w-3 mr-1" />
      {skillLabels[skill]}
    </Badge>
  );
}
