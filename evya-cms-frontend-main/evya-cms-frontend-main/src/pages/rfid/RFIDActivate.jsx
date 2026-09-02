import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ReloadIcon } from "@radix-ui/react-icons";
import AxiosServices from '@/services/AxiosServices';

export default function ActivateRfidDialog({ open, onOpenChange, requestData, onSuccess }) {
  const [rfidList, setRfidList] = useState([{ rfId: '', expiryDate: '' }]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  useEffect(() => {
    if (requestData?.rfidCount) {
      const count = parseInt(requestData.rfidCount) || 1;
      const initialRfidList = Array(count).fill().map(() => ({ rfId: '', expiryDate: '' }));
      setRfidList(initialRfidList);
    }
  }, [requestData]);

  const handleChange = (index, field, value) => {
    const updated = [...rfidList];
    updated[index][field] = value;
    setRfidList(updated);
  };

  const handleAdd = () => {
    setRfidList([...rfidList, { rfId: '', expiryDate: '' }]);
  };

  const handleRemove = (index) => {
    const updated = [...rfidList];
    updated.splice(index, 1);
    setRfidList(updated);
  };

  const handleSubmit = async () => {
    for (const rfid of rfidList) {
      if (!rfid.rfId || rfid.rfId.length > 16 || !/^[a-zA-Z0-9]+$/.test(rfid.rfId)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Each RFID must be alphanumeric and 1–16 characters",
        });
        return;
      }
      if (!rfid.expiryDate) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Each RFID must have an expiry date",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const payload = rfidList.map(r => ({
        rfId: r.rfId,
        expiryDate: r.expiryDate,
        userId: requestData.userId,
        phone: requestData.mobile,
        status: "Inactive",
      }));

      await AxiosServices.setRfidCard(requestData.userId, payload, requestData.id);

      toast({
        title: "Success",
        description: "RFID(s) updated successfully",
      });
      setRfidList([{ rfId: '', expiryDate: '' }]);
      onSuccess?.();
      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to update RFID(s)",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Activate RFID ({requestData?.rfidCount || 1} required)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-auto">
          {rfidList.map((rfid, index) => (
            <div key={index} className="space-y-2 border-b pb-4">
              <div className="flex justify-between items-center">
                <Label>RFID Number {index + 1} *</Label>
                {index >= (requestData?.rfidCount || 1) && (
                  <span className="text-xs text-muted-foreground">Additional</span>
                )}
              </div>
              <Input
                value={rfid.rfId}
                onChange={(e) => handleChange(index, 'rfId', e.target.value.slice(0, 16))}
                placeholder="Enter RFID number"
                maxLength={16}
              />
              <Label>Expiry Date *</Label>
              <Input
                type="date"
                value={rfid.expiryDate}
                onChange={(e) => handleChange(index, 'expiryDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              {/* Only allow removing additional RFIDs beyond the required count */}
              {index >= (requestData?.rfidCount || 1) && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-2"
                  onClick={() => handleRemove(index)}
                  disabled={loading}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          <div className="flex justify-between items-center pt-2">
            {rfidList.length >= (requestData?.rfidCount || 1) && (
              <Button variant="outline" onClick={handleAdd} disabled={loading}>
                Add Another
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                Submit
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}