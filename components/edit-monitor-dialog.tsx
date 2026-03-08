"use client";

import React from "react"

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Monitor } from "@/lib/types";

interface EditMonitorDialogProps {
  monitor: Monitor;
  onSave: () => void;
}

const INTERVAL_OPTIONS = [
  { label: "Every 1 minute", value: "60" },
  { label: "Every 5 minutes", value: "300" },
  { label: "Every 15 minutes", value: "900" },
  { label: "Every 30 minutes", value: "1800" },
  { label: "Every 1 hour", value: "3600" },
  { label: "Every 6 hours", value: "21600" },
  { label: "Every 12 hours", value: "43200" },
  { label: "Every 24 hours", value: "86400" },
];

export function EditMonitorDialog({ monitor, onSave }: EditMonitorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(monitor.name);
  const [url, setUrl] = useState(monitor.url);
  const [method, setMethod] = useState(monitor.method);
  const [interval, setInterval] = useState(
    String(monitor.check_interval_seconds)
  );
  const [timeout, setTimeout] = useState(String(monitor.timeout_seconds));
  const [expectedStatus, setExpectedStatus] = useState(
    String(monitor.expected_status_code)
  );
  const [isActive, setIsActive] = useState(monitor.is_active);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/monitors/${monitor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          url,
          method,
          check_interval_seconds: parseInt(interval, 10),
          timeout_seconds: parseInt(timeout, 10),
          expected_status_code: parseInt(expectedStatus, 10),
          is_active: isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update monitor");
        return;
      }

      setOpen(false);
      onSave();
    } catch {
      setError("Failed to update monitor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 bg-transparent">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card text-card-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Monitor</DialogTitle>
          <DialogDescription>
            Update the configuration for this endpoint.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-background"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-url">URL</Label>
            <Input
              id="edit-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              type="url"
              className="bg-background font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-method">HTTP Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger id="edit-method" className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="HEAD">HEAD</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-expected-status">Expected Status</Label>
              <Input
                id="edit-expected-status"
                value={expectedStatus}
                onChange={(e) => setExpectedStatus(e.target.value)}
                type="number"
                min={100}
                max={599}
                className="bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-interval">Check Interval</Label>
              <Select value={interval} onValueChange={setInterval}>
                <SelectTrigger id="edit-interval" className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVAL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-timeout">Timeout (seconds)</Label>
              <Input
                id="edit-timeout"
                value={timeout}
                onChange={(e) => setTimeout(e.target.value)}
                type="number"
                min={5}
                max={120}
                className="bg-background"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <Label htmlFor="edit-active">Active</Label>
            <Switch
              id="edit-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
