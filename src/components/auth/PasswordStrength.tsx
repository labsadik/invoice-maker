import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { strength, label, color } = useMemo(() => {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) {
      return { strength: score, label: "Weak", color: "bg-destructive" };
    } else if (score <= 4) {
      return { strength: score, label: "Medium", color: "bg-warning" };
    } else {
      return { strength: score, label: "Strong", color: "bg-success" };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              level <= strength ? color : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className={cn(
        "text-xs font-medium",
        strength <= 2 ? "text-destructive" : strength <= 4 ? "text-warning" : "text-success"
      )}>
        Password strength: {label}
      </p>
    </div>
  );
}
