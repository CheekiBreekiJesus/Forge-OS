import type { ActivityEvent } from "@/domain/types";
import type { LocalNotification } from "@/domain/customizer-types";
import type { DashboardAlertItem } from "./metrics";

const priorityLabels = {
  "pt-PT": { action: "Alta", warning: "Média", info: "Baixa" },
  en: { action: "High", warning: "Medium", info: "Low" }
} as const;

function severityTone(severity: LocalNotification["severity"]) {
  if (severity === "action") return "red" as const;
  if (severity === "warning") return "amber" as const;
  return "green" as const;
}

export function deriveDashboardAlerts(
  notifications: LocalNotification[],
  activities: ActivityEvent[],
  locale: "pt-PT" | "en",
  fallbackItems: DashboardAlertItem[]
): DashboardAlertItem[] {
  const labels = priorityLabels[locale];

  const fromNotifications = notifications.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    detail: item.message,
    timeLabel: new Date(item.createdAt).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit"
    }),
    priority:
      item.severity === "action"
        ? labels.action
        : item.severity === "warning"
          ? labels.warning
          : labels.info,
    tone: severityTone(item.severity),
    href: item.href
  }));

  if (fromNotifications.length > 0) return fromNotifications;

  const fromActivities = activities.slice(0, 5).map((activity) => ({
    id: activity.id,
    title: activity.title,
    detail: activity.action,
    timeLabel: new Date(activity.occurredAt).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit"
    }),
    priority: labels.info,
    tone: "blue" as const,
    href: `/${locale}`
  }));

  return fromActivities.length > 0 ? fromActivities : fallbackItems;
}
