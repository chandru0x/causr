import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { IndexSource, UpdateServicePayload } from '@/types/services';

interface LinkCodeModalProps {
  serviceName: string;
  initialIndexSource?: IndexSource;
  initialRepoUrl?: string;
  initialBranch?: string;
  initialLocalPath?: string;
  initialRepoSubpath?: string;
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: UpdateServicePayload) => void;
}

export function LinkCodeModal({
  serviceName,
  initialIndexSource = 'git',
  initialRepoUrl = '',
  initialBranch = 'main',
  initialLocalPath = '',
  initialRepoSubpath = '',
  open,
  saving,
  onClose,
  onSave,
}: LinkCodeModalProps) {
  const [indexSource, setIndexSource] = useState<IndexSource>(initialIndexSource);
  const [repoUrl, setRepoUrl] = useState(initialRepoUrl);
  const [branch, setBranch] = useState(initialBranch);
  const [localPath, setLocalPath] = useState(initialLocalPath);
  const [repoSubpath, setRepoSubpath] = useState(initialRepoSubpath);

  useEffect(() => {
    if (open) {
      setIndexSource(initialIndexSource);
      setRepoUrl(initialRepoUrl);
      setBranch(initialBranch || 'main');
      setLocalPath(initialLocalPath);
      setRepoSubpath(initialRepoSubpath);
    }
  }, [
    open,
    initialIndexSource,
    initialRepoUrl,
    initialBranch,
    initialLocalPath,
    initialRepoSubpath,
  ]);

  const canSave =
    indexSource === 'git' ? repoUrl.trim().length > 0 : localPath.trim().length > 0;

  const handleSave = () => {
    if (indexSource === 'git') {
      onSave({
        indexSource: 'git',
        repoUrl: repoUrl.trim(),
        branch: branch.trim() || 'main',
        repoSubpath: repoSubpath.trim() || undefined,
      });
      return;
    }
    onSave({ indexSource: 'local', localPath: localPath.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Link code source</DialogTitle>
          <DialogDescription>
            Point Andromedia at source code for <span className="font-medium">{serviceName}</span>.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={indexSource}
          onValueChange={(v) => setIndexSource(v as IndexSource)}
          className="gap-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="git">Git repository</TabsTrigger>
            <TabsTrigger value="local">Local path</TabsTrigger>
          </TabsList>

          <div className="space-y-2">
            <Label htmlFor="service-name">Service name</Label>
            <Input id="service-name" value={serviceName} readOnly className="bg-muted" />
          </div>

          <TabsContent value="git" className="mt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repo-url">Repository URL</Label>
              <Input
                id="repo-url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/company/payment-service"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input
                id="branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-subpath">Subfolder (optional)</Label>
              <Input
                id="repo-subpath"
                value={repoSubpath}
                onChange={(e) => setRepoSubpath(e.target.value)}
                placeholder="log-processor-service"
              />
              <p className="text-xs text-muted-foreground">
                For monorepos — index only this folder inside the clone.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="local" className="mt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="local-path">Absolute path</Label>
              <Input
                id="local-path"
                value={localPath}
                onChange={(e) => setLocalPath(e.target.value)}
                placeholder="/home/user/projects/payment-service"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Index code already on this machine. No git clone — clones live at{' '}
                <code className="rounded bg-muted px-1">~/.andromedia/repos/</code>.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !canSave}>
            {saving ? 'Saving…' : 'Save & index'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
