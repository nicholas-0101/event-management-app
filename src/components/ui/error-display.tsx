import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorDisplayProps {
  message: string;
  type?: "error" | "warning" | "info" | "success";
  onClose?: () => void;
  className?: string;
  showIcon?: boolean;
}

export function ErrorDisplay({
  message,
  type = "error",
  onClose,
  className,
  showIcon = true,
}: ErrorDisplayProps) {
  if (!message) return null;

  const getIcon = () => {
    if (!showIcon) return null;

    switch (type) {
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "info":
        return <Info className="h-4 w-4" />;
      case "success":
        return <div className="h-4 w-4 rounded-full bg-current" />;
      default:
        return null;
    }
  };

  const getStyles = () => {
    switch (type) {
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 text-sm",
        getStyles(),
        className
      )}
    >
      {getIcon()}
      <div className="flex-1">
        <p className="font-medium">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1 hover:bg-black/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default ErrorDisplay;
