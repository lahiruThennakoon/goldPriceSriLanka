"use client";

import { useEffect, useState } from "react";
import { getSettings, saveSettings, type Settings, type ThresholdStyle } from "@/lib/storage";
import { applyTheme } from "@/lib/theme";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [permissionNote, setPermissionNote] = useState<string | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  function update(partial: Partial<Settings>) {
    if (!settings) return;
    const next = { ...settings, ...partial };
    setSettings(next);
    saveSettings(next);
    if (partial.theme) applyTheme(partial.theme);
  }

  async function requestNotificationPermission() {
    if (typeof Notification === "undefined") {
      setPermissionNote("Notifications aren't supported in this browser.");
      return true;
    }
    if (Notification.permission === "granted") return true;
    const result = await Notification.requestPermission();
    if (result !== "granted") {
      setPermissionNote("Permission not granted — this alert is saved but inactive until you enable notifications.");
      return false;
    }
    setPermissionNote(null);
    return true;
  }

  if (!settings) return null;

  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-lg font-semibold">Settings</h1>

      <Section title="Defaults">
        <Row label="Default purity">
          <select
            value={settings.defaultPurity}
            onChange={(e) => update({ defaultPurity: parseFloat(e.target.value) })}
            className="min-h-[44px] rounded-sm border border-border-hairline bg-transparent px-2"
          >
            {[24, 22, 21, 18, 14].map((k) => (
              <option key={k} value={k}>
                {k}K
              </option>
            ))}
          </select>
        </Row>
        <Row label="Default weight unit">
          <select
            value={settings.defaultWeightUnit}
            onChange={(e) => update({ defaultWeightUnit: e.target.value as "grams" | "pavan" })}
            className="min-h-[44px] rounded-sm border border-border-hairline bg-transparent px-2"
          >
            <option value="grams">Grams</option>
            <option value="pavan">Pavan</option>
          </select>
        </Row>
        <Row label="Refresh interval">
          <select
            value={settings.refreshIntervalMinutes}
            onChange={(e) => update({ refreshIntervalMinutes: parseInt(e.target.value, 10) })}
            className="min-h-[44px] rounded-sm border border-border-hairline bg-transparent px-2"
          >
            {[5, 15, 30, 60].map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </Row>
        <Row label="Theme">
          <select
            value={settings.theme}
            onChange={(e) => update({ theme: e.target.value as Settings["theme"] })}
            className="min-h-[44px] rounded-sm border border-border-hairline bg-transparent px-2"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Row>
      </Section>

      <Section title="Daily digest">
        <Row label="Enable daily notification">
          <input
            type="checkbox"
            checked={settings.dailyDigestEnabled}
            onChange={async (e) => {
              const enabling = e.target.checked;
              if (enabling) {
                const granted = await requestNotificationPermission();
                update({ dailyDigestEnabled: granted });
              } else {
                update({ dailyDigestEnabled: false });
              }
            }}
            className="h-5 w-5"
          />
        </Row>
        {settings.dailyDigestEnabled && (
          <Row label="Time">
            <input
              type="time"
              value={settings.dailyDigestTime}
              onChange={(e) => update({ dailyDigestTime: e.target.value })}
              className="min-h-[44px] rounded-sm border border-border-hairline bg-transparent px-2"
            />
          </Row>
        )}
      </Section>

      <Section title="Threshold alerts">
        {settings.alerts.length === 0 && (
          <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
            No alerts set.
          </p>
        )}
        {settings.alerts.map((a) => (
          <Row key={a.id} label={a.style === "percentage" ? `${a.value}% move` : `Rs. ${a.value}`}>
            <button
              onClick={() => update({ alerts: settings.alerts.filter((x) => x.id !== a.id) })}
              className="min-h-[44px] text-sm"
              style={{ color: "var(--negative)" }}
            >
              Remove
            </button>
          </Row>
        ))}

        {showAlertForm ? (
          <AlertForm
            onCancel={() => setShowAlertForm(false)}
            onSave={async (style, value) => {
              const granted = await requestNotificationPermission();
              update({
                alerts: [
                  ...settings.alerts,
                  { id: crypto.randomUUID(), style, value, createdAt: new Date().toISOString() },
                ],
              });
              if (!granted) {
                // saved above regardless -- shown as inactive via permissionNote
              }
              setShowAlertForm(false);
            }}
          />
        ) : (
          <button
            onClick={() => setShowAlertForm(true)}
            className="min-h-[44px] w-full rounded-sm border border-border-hairline text-sm"
          >
            + Add alert
          </button>
        )}

        {permissionNote && (
          <p className="text-xs" style={{ color: "var(--verify-amber)" }}>
            {permissionNote}
          </p>
        )}
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-md bg-surface-raised p-4">
      <p className="text-xs font-medium uppercase" style={{ color: "var(--ink-secondary)" }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-t border-border-hairline pt-3 first:border-t-0 first:pt-0">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}

function AlertForm({
  onSave,
  onCancel,
}: {
  onSave: (style: ThresholdStyle, value: number) => void;
  onCancel: () => void;
}) {
  const [style, setStyle] = useState<ThresholdStyle>("percentage");
  const [value, setValue] = useState("2");

  return (
    <div className="space-y-2 border-t border-border-hairline pt-3">
      <div className="flex gap-2">
        {(["percentage", "absolute"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStyle(s)}
            className="min-h-[44px] flex-1 rounded-sm border border-border-hairline text-xs"
            style={{
              background: style === s ? "var(--accent-gold)" : "transparent",
              color: style === s ? "var(--surface-base)" : "var(--ink-primary)",
            }}
          >
            {s === "percentage" ? "% move" : "Absolute Rs."}
          </button>
        ))}
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="min-h-[44px] w-full rounded-sm border border-border-hairline bg-transparent px-3"
      />
      <div className="flex gap-2">
        <button onClick={onCancel} className="min-h-[44px] flex-1 rounded-sm border border-border-hairline text-sm">
          Cancel
        </button>
        <button
          onClick={() => onSave(style, parseFloat(value) || 0)}
          className="min-h-[44px] flex-1 rounded-sm text-sm font-medium"
          style={{ background: "var(--accent-gold)", color: "var(--surface-base)" }}
        >
          Save alert
        </button>
      </div>
    </div>
  );
}
