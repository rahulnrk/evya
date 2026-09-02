import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReloadIcon } from '@radix-ui/react-icons';
import { useToast } from '@/components/ui/use-toast';
import AxiosServices from '@/services/AxiosServices';

export function AddChargerHealth({ onSuccess }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    cpId: '',
    logUrl: '',
  });

  const handleSubmit = async () => {
    if (!form.cpId || !form.logUrl) {
      toast({
        title: 'Validation Error',
        description: 'CP ID and Logs URL are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await AxiosServices.registerLogs(form);

      toast({
        title: 'Success',
        description: 'Charger logs registered successfully',
      });

      setOpen(false);
      setForm({ cpId: '', logUrl: '' });

      if (onSuccess) onSuccess(form.cpId);
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to register logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Charger For Health</Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Charger Health</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>CP ID</Label>
            <Input
              placeholder="ocpp2"
              value={form.cpId}
              onChange={(e) =>
                setForm({ ...form, cpId: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Logs URL</Label>
            <Input
              placeholder="http://server/ocpp/view/ocpp2/..."
              value={form.logUrl}
              onChange={(e) =>
                setForm({ ...form, logUrl: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
