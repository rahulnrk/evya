import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import Loading from "@/users/Loading";
import OcpiServices from "@/services/OcpiServices";

// ADR-003: a vendor manages its own OCPI roaming here. A platform admin (role 1) works on a chosen
// vendor; a vendor admin's calls are scoped to its own vendor by the gateway from the login token.
const PLATFORM_ADMIN_ROLE = 1;

const STATUS_TONE = {
  REGISTERED: "bg-green-100 text-green-800",
  PENDING: "bg-amber-100 text-amber-800",
  UNREGISTERED: "bg-slate-100 text-slate-700",
  SUSPENDED: "bg-red-100 text-red-800",
};

const errorText = (e, fallback) =>
  e?.response?.data?.message || e?.response?.data || e?.message || fallback;

export default function Ocpi() {
  const { toast } = useToast();
  const user = useSelector((state) => state.authentication.user);
  const isPlatformAdmin = Number(user?.roleId) === PLATFORM_ADMIN_ROLE;

  // A platform admin picks which vendor to work on; a vendor admin has none to pick.
  const [vendorId, setVendorId] = useState(isPlatformAdmin ? "" : null);
  const [vendorInput, setVendorInput] = useState("");
  const activeVendor = isPlatformAdmin ? vendorId : null;
  const vendorChosen = !isPlatformAdmin || (vendorId !== "" && vendorId != null);

  const [loading, setLoading] = useState(false);
  const [party, setParty] = useState(null);
  const [connections, setConnections] = useState([]);
  const [form, setForm] = useState({ countryCode: "", partyId: "", businessName: "", businessWebsite: "" });
  const [savingParty, setSavingParty] = useState(false);
  const [inviteLabel, setInviteLabel] = useState("");
  const [inviting, setInviting] = useState(false);
  const [invite, setInvite] = useState(null); // { tokenA, versionsUrl, handoverNote }

  const load = useCallback(async () => {
    if (!vendorChosen) return;
    setLoading(true);
    setParty(null);
    setConnections([]);
    try {
      const [partyRes, connRes] = await Promise.allSettled([
        OcpiServices.getParty(activeVendor),
        OcpiServices.getConnections(activeVendor),
      ]);
      if (partyRes.status === "fulfilled") {
        setParty(partyRes.value.data);
        setForm({
          countryCode: partyRes.value.data.countryCode || "",
          partyId: partyRes.value.data.partyId || "",
          businessName: partyRes.value.data.businessName || "",
          businessWebsite: partyRes.value.data.businessWebsite || "",
        });
      } else if (partyRes.reason?.response?.status === 404) {
        setParty(null); // no party yet — the form stays empty for first setup
      } else if (partyRes.reason?.response?.status === 403) {
        toast({ variant: "destructive", title: "OCPI is not enabled for this vendor" });
      } else {
        toast({ variant: "destructive", title: "Could not load the OCPI party", description: errorText(partyRes.reason, "") });
      }
      if (connRes.status === "fulfilled") setConnections(connRes.value.data || []);
    } finally {
      setLoading(false);
    }
  }, [activeVendor, vendorChosen, toast]);

  useEffect(() => { load(); }, [load]);

  const saveParty = async () => {
    setSavingParty(true);
    try {
      const body = { ...form };
      if (isPlatformAdmin) body.vendorId = Number(activeVendor);
      const res = await OcpiServices.saveParty(body, activeVendor);
      setParty(res.data);
      toast({ title: "OCPI party saved" });
    } catch (e) {
      toast({ variant: "destructive", title: "Could not save the party", description: errorText(e, "") });
    } finally {
      setSavingParty(false);
    }
  };

  const invitePartner = async () => {
    setInviting(true);
    try {
      const res = await OcpiServices.invitePartner(inviteLabel || null, activeVendor);
      setInvite(res.data); // Token A is shown once, in the dialog
      setInviteLabel("");
      load();
    } catch (e) {
      toast({ variant: "destructive", title: "Could not create the invitation", description: errorText(e, "") });
    } finally {
      setInviting(false);
    }
  };

  const revoke = async (connectionId) => {
    try {
      await OcpiServices.revokeConnection(connectionId, activeVendor);
      toast({ title: "Connection ended" });
      load();
    } catch (e) {
      toast({ variant: "destructive", title: "Could not end the connection", description: errorText(e, "") });
    }
  };

  const partyIdentityLocked = Boolean(party); // country/party id is fixed once the party exists

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">OCPI Roaming</h1>
        <p className="text-sm text-slate-500">
          Let other charging networks use your chargers, and manage your roaming partners.
        </p>
      </div>

      {isPlatformAdmin && (
        <Card>
          <CardHeader><CardTitle className="text-base">Vendor</CardTitle></CardHeader>
          <CardContent className="flex items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="vendorId">Vendor (white-label) id</Label>
              <Input id="vendorId" value={vendorInput} onChange={(e) => setVendorInput(e.target.value)}
                     placeholder="e.g. 1" className="w-40" />
            </div>
            <Button onClick={() => setVendorId(vendorInput.trim())} disabled={!vendorInput.trim()}>
              Load
            </Button>
          </CardContent>
        </Card>
      )}

      {!vendorChosen && (
        <p className="text-sm text-slate-500">Enter a vendor id to manage its roaming.</p>
      )}

      {vendorChosen && loading && <Loading />}

      {vendorChosen && !loading && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Party {party ? <Badge className="ml-2 bg-slate-100 text-slate-700">
                  {party.countryCode}*{party.partyId} · {party.role}</Badge> : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!party && (
                <p className="text-sm text-slate-500">
                  Set up your OCPI identity to start. Country code and party id are fixed once saved.
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="country">Country code (ISO 3166-1, e.g. IN)</Label>
                  <Input id="country" maxLength={2} value={form.countryCode}
                         disabled={partyIdentityLocked}
                         onChange={(e) => setForm({ ...form, countryCode: e.target.value.toUpperCase() })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="party">Party id (3 letters, e.g. ACM)</Label>
                  <Input id="party" maxLength={3} value={form.partyId}
                         disabled={partyIdentityLocked}
                         onChange={(e) => setForm({ ...form, partyId: e.target.value.toUpperCase() })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="business">Business name</Label>
                  <Input id="business" value={form.businessName}
                         onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input id="website" value={form.businessWebsite}
                         onChange={(e) => setForm({ ...form, businessWebsite: e.target.value })} />
                </div>
              </div>
              <Button onClick={saveParty}
                      disabled={savingParty || !form.countryCode || !form.partyId || !form.businessName}>
                {savingParty ? "Saving…" : party ? "Save details" : "Create party"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Roaming partners</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-3">
                <div className="space-y-1">
                  <Label htmlFor="label">Invite a partner (label, optional)</Label>
                  <Input id="label" value={inviteLabel} onChange={(e) => setInviteLabel(e.target.value)}
                         placeholder="e.g. Partner BV" className="w-64" />
                </div>
                <Button onClick={invitePartner} disabled={inviting || !party}>
                  {inviting ? "Creating…" : "Invite partner"}
                </Button>
              </div>
              {!party && (
                <p className="text-sm text-slate-500">Create your party before inviting partners.</p>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Last seen</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connections.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-slate-500">No partners yet.</TableCell></TableRow>
                  )}
                  {connections.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.partnerBusinessName || "—"}</TableCell>
                      <TableCell>
                        {c.partnerCountryCode ? `${c.partnerCountryCode}*${c.partnerPartyId}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_TONE[c.status] || "bg-slate-100 text-slate-700"}>{c.status}</Badge>
                      </TableCell>
                      <TableCell>{c.agreedVersion || "—"}</TableCell>
                      <TableCell>{c.lastSeenAt ? new Date(c.lastSeenAt).toLocaleString() : "—"}</TableCell>
                      <TableCell className="text-right">
                        {c.status !== "UNREGISTERED" && (
                          <Button variant="ghost" className="text-red-600" onClick={() => revoke(c.id)}>End</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={Boolean(invite)} onOpenChange={(open) => !open && setInvite(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader><DialogTitle>Invitation token</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">{invite?.handoverNote}</p>
            <div className="space-y-1">
              <Label>Token (shown once)</Label>
              <div className="flex gap-2">
                <Input readOnly value={invite?.tokenA || ""} className="font-mono text-xs" />
                <Button onClick={() => {
                  navigator.clipboard?.writeText(invite?.tokenA || "");
                  toast({ title: "Token copied" });
                }}>Copy</Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Versions URL (give this to the partner too)</Label>
              <Input readOnly value={invite?.versionsUrl || ""} className="font-mono text-xs" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
