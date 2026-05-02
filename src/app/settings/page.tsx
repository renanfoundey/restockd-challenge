"use client";

import { useState, useEffect, type ReactNode } from "react";
import { warehouses } from "@/data/warehouses";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getObject, setObject } from "@/lib/storage";
import { toast } from "sonner";

interface SettingsData {
  companyName: string;
  contactEmail: string;
  userEmail: string;
  emailAlerts: boolean;
  alertThreshold: string;
  weeklyDigest: boolean;
  currency: string;
  units: string;
  dateFormat: string;
}

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("Restockd Fashion Co.");
  const [contactEmail, setContactEmail] = useState("ops@restockd.com");
  const [userEmail, setUserEmail] = useState("admin@restockd.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState("7");
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [units, setUnits] = useState("metric");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");

  useEffect(() => {
    const saved = getObject<SettingsData>("restockd_settings");
    if (saved) {
      setCompanyName(saved.companyName);
      setContactEmail(saved.contactEmail);
      setUserEmail(saved.userEmail);
      setEmailAlerts(saved.emailAlerts);
      setAlertThreshold(saved.alertThreshold);
      setWeeklyDigest(saved.weeklyDigest);
      setCurrency(saved.currency);
      setUnits(saved.units);
      setDateFormat(saved.dateFormat);
    }
  }, []);

  const handleSave = () => {
    setObject<SettingsData>("restockd_settings", {
      companyName,
      contactEmail,
      userEmail,
      emailAlerts,
      alertThreshold,
      weeklyDigest,
      currency,
      units,
      dateFormat,
    });
    toast.success("Settings saved");
  };

  const handleUpdatePassword = () => {
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated");
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          General application configuration
        </p>
      </div>

      <Tabs defaultValue="account">
        <TabsList variant="line" className="border-b border-border w-full justify-start">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="pt-6 space-y-4">
          <SettingCard
            title="Profile"
            description="The email used to sign in and receive notifications."
          >
            <Field label="Email Address">
              <Input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </Field>
          </SettingCard>

          <SettingCard
            title="Password"
            description="Use a strong password — at least 6 characters."
          >
            <Field label="Current Password">
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="New Password">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </Field>
              <Field label="Confirm Password">
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </Field>
            </div>
            <Button variant="outline" size="sm" onClick={handleUpdatePassword}>
              Update Password
            </Button>
          </SettingCard>
        </TabsContent>

        <TabsContent value="workspace" className="pt-6 space-y-4">
          <SettingCard
            title="Company Info"
            description="Shown on exports and supplier-facing communications."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Company Name">
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </Field>
              <Field label="Primary Contact Email">
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </Field>
            </div>
          </SettingCard>

          <SettingCard
            title="Warehouses"
            description="Read-only — manage warehouses in your inventory system."
          >
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Capacity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((wh) => (
                    <TableRow key={wh.id}>
                      <TableCell className="font-mono text-xs">{wh.id}</TableCell>
                      <TableCell className="font-medium">{wh.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {wh.location}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {wh.capacity.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="preferences" className="pt-6 space-y-4">
          <SettingCard
            title="Notifications"
            description="Choose how Restockd alerts you about inventory events."
          >
            <Row label="Email Alerts" hint="Receive emails for low-stock and reorder events.">
              <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
            </Row>
            <div className="border-t border-border pt-4">
              <Field
                label="Alert Threshold"
                hint="Days of supply at which we flag an SKU."
              >
                <Input
                  type="number"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="w-32"
                />
              </Field>
            </div>
            <div className="border-t border-border pt-4">
              <Row
                label="Weekly Digest"
                hint="A Monday morning summary of last week's inventory activity."
              >
                <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
              </Row>
            </div>
          </SettingCard>

          <SettingCard
            title="Data & Display"
            description="How numbers and dates are formatted across the app."
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Currency">
                <Select
                  value={currency}
                  onValueChange={(v) => v && setCurrency(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Units">
                <Select value={units} onValueChange={(v) => v && setUnits(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric</SelectItem>
                    <SelectItem value="imperial">Imperial</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Date Format">
                <Select
                  value={dateFormat}
                  onValueChange={(v) => v && setDateFormat(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </SettingCard>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save Settings
        </Button>
      </div>
    </div>
  );
}

function SettingCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-border">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
