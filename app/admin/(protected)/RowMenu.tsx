"use client";

import { Menu } from "@mantine/core";

const itemStyle = {
  fontFamily: "var(--font-display)",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  borderRadius: 0,
};

export default function RowMenu({
  onView,
  onEdit,
  onDelete,
}: {
  onView?: () => void;
  onEdit?: () => void;
  onDelete: () => void;
}) {
  return (
    <Menu shadow="md" width={140} position="bottom-end" withinPortal radius={0}>
      <Menu.Target>
        <button
          type="button"
          aria-label="Row actions"
          className="text-text-dim hover:text-text"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.75" />
            <circle cx="12" cy="12" r="1.75" />
            <circle cx="12" cy="19" r="1.75" />
          </svg>
        </button>
      </Menu.Target>
      <Menu.Dropdown
        styles={{
          dropdown: {
            backgroundColor: "var(--panel-2)",
            border: "1px solid var(--line)",
            padding: 0,
          },
        }}
      >
        {onView && (
          <Menu.Item onClick={onView} styles={{ item: { ...itemStyle, color: "var(--text)" } }}>
            View
          </Menu.Item>
        )}
        {onEdit && (
          <Menu.Item onClick={onEdit} styles={{ item: { ...itemStyle, color: "var(--text)" } }}>
            Edit
          </Menu.Item>
        )}
        <Menu.Item onClick={onDelete} styles={{ item: { ...itemStyle, color: "var(--red)" } }}>
          Delete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
