"use client";

import React from "react"

import { useState } from "react";
import { Plus } from "lucide-react";
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

interface AddMonitorDialogProps {
  onAdd: () => void;
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

export function AddMonitorDialog({ onAdd }: AddMonitorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("https://");
  const [method, setMethod] = useState("GET");
  const [interval, setInterval] = useState("3600");
  const [timeout, setTimeout] = useState("30");
  const [expectedStatus, setExpectedStatus] = useState("200");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          url,
          method,
          check_interval_seconds: parseInt(interval, 10),
          timeout_seconds: parseInt(timeout, 10),
          expected_status_code: parseInt(expectedStatus, 10),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create monitor");
        return;
      }

      // Reset form and close
      setName("");
      setUrl("https://");
      setMethod("GET");
      setInterval("3600");
      setTimeout("30");
      setExpectedStatus("200");
      setOpen(false);
      onAdd();
    } catch {
      setError("Failed to create monitor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Monitor
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card text-card-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Monitor</DialogTitle>
          <DialogDescription>
            Add a new endpoint to monitor. It will start checking immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="My Website"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-background"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              type="url"
              className="bg-background font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="method">HTTP Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger id="method" className="bg-background">
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
              <Label htmlFor="expected-status">Expected Status</Label>
              <Input
                id="expected-status"
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
              <Label htmlFor="interval">Check Interval</Label>
              <Select value={interval} onValueChange={setInterval}>
                <SelectTrigger id="interval" className="bg-background">
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
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input
                id="timeout"
                value={timeout}
                onChange={(e) => setTimeout(e.target.value)}
                type="number"
                min={5}
                max={120}
                className="bg-background"
              />
            </div>
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
              {loading ? "Adding..." : "Add Monitor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
