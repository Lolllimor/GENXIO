import { notifications } from "@mantine/notifications";

const base = {
  radius: 0,
  styles: {
    root: {
      backgroundColor: "var(--panel-2)",
      border: "1px solid var(--line)",
    },
    title: {
      fontFamily: "var(--font-display)",
      fontSize: 12,
      fontWeight: 700,
      textTransform: "uppercase" as const,
      letterSpacing: "0.06em",
      color: "var(--text)",
    },
    description: {
      fontSize: 12.5,
      color: "var(--text-dim)",
    },
    closeButton: {
      color: "var(--text-dim)",
    },
  },
};

export function toastSuccess(message: string) {
  notifications.show({
    ...base,
    title: "Success",
    message,
    color: "grape",
    autoClose: 3500,
  });
}

export function toastError(message: string) {
  notifications.show({
    ...base,
    title: "Error",
    message,
    color: "red",
    autoClose: 5000,
  });
}
