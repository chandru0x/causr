import { useEffect, useState } from 'react';
import type { IndexSource, UpdateServicePayload } from '../types/services';

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

  if (!open) {
    return null;
  }

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
    onSave({
      indexSource: 'local',
      localPath: localPath.trim(),
    });
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal panel"
        role="dialog"
        aria-labelledby="link-code-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="link-code-title" className="panel-title">
          Link Code Source
        </h2>

        <div className="modal-tabs" role="tablist" aria-label="Code source type">
          <button
            type="button"
            role="tab"
            aria-selected={indexSource === 'git'}
            className={indexSource === 'git' ? 'modal-tab active' : 'modal-tab'}
            onClick={() => setIndexSource('git')}
          >
            Git
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={indexSource === 'local'}
            className={indexSource === 'local' ? 'modal-tab active' : 'modal-tab'}
            onClick={() => setIndexSource('local')}
          >
            Local
          </button>
        </div>

        <div className="form-field">
          <label htmlFor="service-name">Service Name</label>
          <input id="service-name" value={serviceName} readOnly />
        </div>

        {indexSource === 'git' ? (
          <>
            <div className="form-field">
              <label htmlFor="repo-url">Repository URL</label>
              <input
                id="repo-url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/company/payment-service"
              />
            </div>
            <div className="form-field">
              <label htmlFor="branch">Branch</label>
              <input
                id="branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
              />
            </div>
            <div className="form-field">
              <label htmlFor="repo-subpath">Repository Subpath (optional)</label>
              <input
                id="repo-subpath"
                value={repoSubpath}
                onChange={(e) => setRepoSubpath(e.target.value)}
                placeholder="services/payment-api"
              />
            </div>
          </>
        ) : (
          <div className="form-field">
            <label htmlFor="local-path">Local Path</label>
            <input
              id="local-path"
              value={localPath}
              onChange={(e) => setLocalPath(e.target.value)}
              placeholder="/home/user/projects/payment-service"
            />
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={saving || !canSave}
            onClick={handleSave}
          >
            {saving ? 'Saving…' : 'Save & Index'}
          </button>
        </div>
      </div>
    </div>
  );
}
