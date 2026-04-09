"use client";

import { useState, useEffect } from "react";
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
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">General application configuration</p>
      </div>

      <div className="border border-border rounded-lg p-6 space-y-4">
        <h2 className="font-medium">User Account</h2>
        <div>
          <Label className="text-sm mb-1.5">Email Address</Label>
          <Input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
          />
        </div>
        <div className="border-t border-border pt-4 mt-4 space-y-3">
          <h3 className="text-sm font-medium">Change Password</h3>
          <div>
            <Label className="text-sm mb-1.5">Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm mb-1.5">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5">Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleUpdatePassword}>
            Update Password
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-lg p-6 space-y-4">
        <h2 className="font-medium">Company Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm mb-1.5">Company Name</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div>
            <Label className="text-sm mb-1.5">Primary Contact Email</Label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="border border-border rounded-lg p-6 space-y-4">
        <h2 className="font-medium">Warehouses</h2>
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
                <TableCell>{wh.name}</TableCell>
                <TableCell>{wh.location}</TableCell>
                <TableCell className="text-right">{wh.capacity.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="border border-border rounded-lg p-6 space-y-4">
        <h2 className="font-medium">Notification Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Email Alerts</Label>
            <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
          </div>
          <div>
            <Label className="text-sm mb-1.5">Alert Threshold (days of supply)</Label>
            <Input
              type="number"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              className="w-32"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Weekly Digest</Label>
            <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
          </div>
        </div>
      </div>

      <div className="border border-border rounded-lg p-6 space-y-4">
        <h2 className="font-medium">Data Preferences</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm mb-1.5">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (&euro;)</SelectItem>
                <SelectItem value="GBP">GBP (&pound;)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm mb-1.5">Units</Label>
            <Select value={units} onValueChange={setUnits}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric</SelectItem>
                <SelectItem value="imperial">Imperial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm mb-1.5">Date Format</Label>
            <Select value={dateFormat} onValueChange={setDateFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button onClick={handleSave}>Save Settings</Button>
    </div>
  );
}
