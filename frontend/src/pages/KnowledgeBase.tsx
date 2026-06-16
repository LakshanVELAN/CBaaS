import { useState, useEffect, useRef } from 'react';
import * as api from '../api';
import ConfirmDialog from '../components/ConfirmDialog';

type Tab = 'training' | 'neo4j' | 'upload' | 'guide';

export default function KnowledgeBase() {
  // ── Training ──
  const [entries, setEntries] = useState<api.KBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [trainUrl, setTrainUrl] = useState('');
  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState<api.TrainPageResponse | null>(null);
  const [trainError, setTrainError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // ── Neo4j Config ──
  const [neo4jUri, setNeo4jUri] = useState('');
  const [neo4jUser, setNeo4jUser] = useState('neo4j');
  const [neo4jPass, setNeo4jPass] = useState('');
  const [neo4jConnected, setNeo4jConnected] = useState(false);
  const [neo4jLoading, setNeo4jLoading] = useState(false);
  const [neo4jSaving, setNeo4jSaving] = useState(false);
  const [neo4jTesting, setNeo4jTesting] = useState(false);
  const [neo4jMessage, setNeo4jMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── JSON Upload ──
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<api.UploadKnowledgeResponse | null>(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Extraction Guide ──
  const [guide, setGuide] = useState<api.ExtractionGuide | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Active Tab ──
  const [activeTab, setActiveTab] = useState<Tab>('training');

  // ── Fetch ──
  const fetchEntries = () => {
    setLoading(true);
    api.getKnowledgeBase()
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchNeo4jConfig = async () => {
    setNeo4jLoading(true);
    try {
      const config = await api.getNeo4jConfig();
      setNeo4jUri(config.uri);
      setNeo4jUser(config.username);
      setNeo4jPass(config.password);
      setNeo4jConnected(config.is_connected);
    } catch {
      // ignore
    } finally {
      setNeo4jLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchNeo4jConfig();
  }, []);

  // ── Training ──
  const handleTrain = async () => {
    if (!trainUrl.trim()) return;
    setTraining(true);
    setTrainError('');
    setTrainResult(null);
    try {
      const res = await api.trainPage(trainUrl.trim());
      setTrainResult(res);
      setTrainUrl('');
      fetchEntries();
    } catch (err: any) {
      setTrainError(err.message);
    } finally {
      setTraining(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteKnowledgeBase(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // ignore
    }
    setConfirmDelete(null);
  };

  // ── Neo4j ──
  const handleSaveNeo4j = async () => {
    if (!neo4jUri.trim()) {
      setNeo4jMessage({ type: 'error', text: 'Neo4j URI is required' });
      return;
    }
    setNeo4jSaving(true);
    setNeo4jMessage(null);
    try {
      await api.saveNeo4jConfig({ uri: neo4jUri, username: neo4jUser, password: neo4jPass });
      setNeo4jMessage({ type: 'success', text: 'Configuration saved successfully' });
    } catch (err: any) {
      setNeo4jMessage({ type: 'error', text: err.message });
    } finally {
      setNeo4jSaving(false);
    }
  };

  const handleTestNeo4j = async () => {
    if (!neo4jUri.trim()) {
      setNeo4jMessage({ type: 'error', text: 'Please provide a Neo4j URI first' });
      return;
    }
    setNeo4jTesting(true);
    setNeo4jMessage(null);
    try {
      const res = await api.testNeo4jConnection({ uri: neo4jUri, username: neo4jUser, password: neo4jPass });
      setNeo4jConnected(true);
      setNeo4jMessage({ type: 'success', text: res.message });
    } catch (err: any) {
      setNeo4jConnected(false);
      setNeo4jMessage({ type: 'error', text: err.message });
    } finally {
      setNeo4jTesting(false);
    }
  };

  // ── JSON Upload ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadFile(file);
    setUploadResult(null);
    setUploadError('');
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadError('');
    setUploadResult(null);
    try {
      const text = await uploadFile.text();
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(text);
      } catch {
        setUploadError('Invalid JSON file. Please upload a valid JSON file.');
        setUploading(false);
        return;
      }
      const res = await api.uploadKnowledge(data);
      setUploadResult(res);
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Extraction Guide ──
  const fetchGuide = async () => {
    setGuideLoading(true);
    try {
      const data = await api.getExtractionGuide();
      setGuide(data);
    } catch {
      // ignore
    } finally {
      setGuideLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'guide' && !guide) {
      fetchGuide();
    }
  }, [activeTab, guide]);

  const copyPrompt = () => {
    if (!guide) return;
    navigator.clipboard.writeText(guide.extraction_prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Filtered entries ──
  const filtered = search
    ? entries.filter(
        (e) =>
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.url.toLowerCase().includes(search.toLowerCase()),
      )
    : entries;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'training', label: 'Page Training', icon: '📚' },
    { key: 'neo4j', label: 'Neo4j GraphDB', icon: '🔗' },
    { key: 'upload', label: 'Upload JSON', icon: '📤' },
    { key: 'guide', label: 'Help & Guide', icon: '💡' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h2>Knowledge Base</h2>
        <p>Train pages, connect Neo4j GraphDB, upload knowledge, and get guided help.</p>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="kb-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`kb-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="kb-tab-icon">{tab.icon}</span>
            <span className="kb-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════
          TAB 1: Page Training
          ════════════════════════════════════════ */}
      {activeTab === 'training' && (
        <>
          <div className="card train-card">
            <h3>Train a Page</h3>
            <p className="card-desc">
              Enter a URL to scrape its content and store it in the knowledge base
              for chatbot context.
            </p>
            <div className="train-row">
              <input
                type="url"
                placeholder="https://example.com/page"
                value={trainUrl}
                onChange={(e) => setTrainUrl(e.target.value)}
                className="input"
              />
              <button
                className="btn btn-primary"
                onClick={handleTrain}
                disabled={training || !trainUrl.trim()}
              >
                {training ? 'Scraping…' : 'Train Page'}
              </button>
            </div>
            {trainError && <div className="form-error" style={{ marginTop: 12 }}>{trainError}</div>}
            {trainResult && (
              <div className="train-result">
                <span className="train-result-icon">
                  {trainResult.created ? '✅' : '🔄'}
                </span>
                <span>
                  <strong>{trainResult.title}</strong> —{' '}
                  {(trainResult.content_length / 1024).toFixed(1)} KB,
                  {trainResult.links_count} links extracted
                </span>
              </div>
            )}
          </div>

          <div className="card">
            <div className="kb-header">
              <h3>Trained Pages ({entries.length})</h3>
              <input
                type="text"
                placeholder="Search entries…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input search-input"
              />
            </div>

            {loading ? (
              <p className="text-muted">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted">
                {search ? 'No entries match your search.' : 'No trained pages yet.'}
              </p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>URL</th>
                      <th>Links</th>
                      <th>Trained</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry) => (
                      <tr key={entry.id}>
                        <td className="td-name">{entry.title}</td>
                        <td>
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link"
                          >
                            {entry.url.length > 50
                              ? entry.url.slice(0, 50) + '…'
                              : entry.url}
                          </a>
                        </td>
                        <td>{entry.extracted_links?.length || 0}</td>
                        <td className="text-muted">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-danger-outline"
                            onClick={() => setConfirmDelete(entry.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <ConfirmDialog
            open={!!confirmDelete}
            title="Delete Knowledge Entry"
            message="Remove this page from the knowledge base. The chatbot will no longer use it as context."
            confirmLabel="Delete"
            destructive
            onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
            onCancel={() => setConfirmDelete(null)}
          />
        </>
      )}

      {/* ════════════════════════════════════════
          TAB 2: Neo4j GraphDB Connection
          ════════════════════════════════════════ */}
      {activeTab === 'neo4j' && (
        <div className="card">
          <div className="neo4j-header">
            <div className="neo4j-title-row">
              <h3>🔗 Neo4j GraphDB Connection</h3>
              {neo4jLoading ? (
                <span className="neo4j-status neo4j-status-loading">Checking…</span>
              ) : neo4jConnected ? (
                <span className="neo4j-status neo4j-status-connected">● Connected</span>
              ) : (
                <span className="neo4j-status neo4j-status-disconnected">● Disconnected</span>
              )}
            </div>
            <p className="card-desc">
              Connect your own Neo4j graph database to store and query structured
              knowledge about your application's pages, roles, and navigation.
              The chatbot uses this to provide context-aware responses.
            </p>
          </div>

          <div className="neo4j-form">
            <div className="form-group">
              <label htmlFor="neo4j-uri">Neo4j URI</label>
              <input
                id="neo4j-uri"
                type="text"
                placeholder="bolt://localhost:7687"
                value={neo4jUri}
                onChange={(e) => setNeo4jUri(e.target.value)}
                className="input"
              />
              <span className="form-hint">e.g. bolt://localhost:7687 or neo4j+s://myinstance.databases.neo4j.io</span>
            </div>

            <div className="form-group">
              <label htmlFor="neo4j-user">Username</label>
              <input
                id="neo4j-user"
                type="text"
                value={neo4jUser}
                onChange={(e) => setNeo4jUser(e.target.value)}
                className="input"
                placeholder="neo4j"
              />
            </div>

            <div className="form-group">
              <label htmlFor="neo4j-pass">Password</label>
              <input
                id="neo4j-pass"
                type="password"
                value={neo4jPass}
                onChange={(e) => setNeo4jPass(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>

            {neo4jMessage && (
              <div className={`form-message ${neo4jMessage.type}`}>
                {neo4jMessage.text}
              </div>
            )}

            <div className="neo4j-actions">
              <button
                className="btn btn-primary"
                onClick={handleSaveNeo4j}
                disabled={neo4jSaving || !neo4jUri.trim()}
              >
                {neo4jSaving ? 'Saving…' : 'Save Configuration'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleTestNeo4j}
                disabled={neo4jTesting || !neo4jUri.trim()}
              >
                {neo4jTesting ? 'Testing…' : 'Test Connection'}
              </button>
            </div>
          </div>

          <div className="neo4j-info">
            <h4>What happens after connecting?</h4>
            <ul>
              <li>The chatbot will use your Neo4j database to look up page structures, roles, and navigation paths</li>
              <li>Upload a JSON knowledge file (in the <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('upload'); }}>Upload JSON</a> tab) to populate the graph</li>
              <li>The <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('guide'); }}>Help & Guide</a> tab shows you how to extract knowledge from your front-end</li>
              <li>Connection details are encrypted and stored per-tenant</li>
            </ul>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 3: Upload JSON
          ════════════════════════════════════════ */}
      {activeTab === 'upload' && (
        <div className="card">
          <h3>📤 Upload JSON Knowledge File</h3>
          <p className="card-desc">
            Upload a JSON file containing your front-end's UI structure — roles,
            pages, actions, and navigation. This data will be imported into the
            Neo4j knowledge graph for chatbot context.
          </p>

          <div className="upload-area">
            <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className="upload-icon">📄</div>
              <p className="upload-text">
                {uploadFile ? (
                  <><strong>{uploadFile.name}</strong> ({(uploadFile.size / 1024).toFixed(1)} KB)</>
                ) : (
                  'Click to select a JSON file or drag & drop here'
                )}
              </p>
            </div>

            {uploadFile && (
              <button
                className="btn btn-primary btn-block"
                onClick={handleUpload}
                disabled={uploading}
                style={{ marginTop: 12 }}
              >
                {uploading ? 'Uploading…' : 'Upload & Import to Neo4j'}
              </button>
            )}

            {uploadError && <div className="form-error" style={{ marginTop: 12 }}>{uploadError}</div>}

            {uploadResult && (
              <div className="upload-result">
                <div className="upload-result-icon">✅</div>
                <div className="upload-result-body">
                  <strong>{uploadResult.message}</strong>
                  <div className="upload-stats">
                    <span>Roles: {uploadResult.stats.roles_created}</span>
                    <span>Pages: {uploadResult.stats.pages_created}</span>
                    <span>Actions: {uploadResult.stats.actions_created}</span>
                    <span>Menu Items: {uploadResult.stats.menu_items_created}</span>
                    <span>Relationships: {uploadResult.stats.relationships_created}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <details className="upload-schema">
            <summary>📖 View expected JSON structure</summary>
            <pre className="upload-schema-code">{`{
  "roles": [
    {
      "name": "admin",
      "display_name": "Administrator",
      "description": "Full access role",
      "pages": [
        {
          "path": "/dashboard",
          "title": "Dashboard",
          "description": "Main overview page",
          "visible_content": "Welcome to the dashboard.",
          "actions": [
            {
              "id": "export_data",
              "label": "Export Data",
              "action_description": "Click to export data as CSV",
              "navigates_to": "/export"
            }
          ],
          "linked_pages": ["/settings", "/profile"]
        }
      ],
      "menu_items": [
        { "label": "Dashboard", "icon": "dashboard", "path": "/dashboard" }
      ]
    }
  ],
  "pages": []
}`}</pre>
          </details>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 4: Help & Guide
          ════════════════════════════════════════ */}
      {activeTab === 'guide' && (
        <div className="card">
          <h3>💡 Help & Knowledge Extraction Guide</h3>

          {guideLoading ? (
            <p className="text-muted">Loading guide…</p>
          ) : guide ? (
            <div className="guide-content">
              <p className="guide-overview">{guide.overview}</p>

              <h4>Extraction Methods</h4>
              <div className="guide-methods">
                {guide.methods.map((method, i) => (
                  <div key={i} className="guide-method">
                    <h5>{method.method}</h5>
                    <p>{method.description}</p>
                    <ol className="guide-steps">
                      {method.steps.map((step, j) => (
                        <li key={j}>{step}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>

              <h4>Knowledge Extraction Prompt</h4>
              <p className="guide-prompt-desc">
                Use this prompt with an AI assistant (or your development team)
                to extract structured knowledge from your front-end codebase:
              </p>
              <div className="guide-prompt-box">
                <pre className="guide-prompt-text">{guide.extraction_prompt}</pre>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={copyPrompt}
                  style={{ flexShrink: 0 }}
                >
                  {copied ? '✅ Copied!' : '📋 Copy Prompt'}
                </button>
              </div>

              <h4>JSON Structure Reference</h4>
              <p className="guide-prompt-desc">{guide.json_structure.description}</p>
              <pre className="upload-schema-code">{JSON.stringify(guide.json_structure.schema, null, 2)}</pre>

              <div className="guide-support">
                <h4>❓ Need Help?</h4>
                <p>
                  If you need assistance setting up your knowledge base or extracting
                  data from your front-end, please reach out to our support team:
                </p>
                <div className="guide-support-actions">
                  <a href="mailto:support@chatbotsaas.com" className="btn btn-primary">
                    📧 Email Support
                  </a>
                  <a href="#" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); setActiveTab('upload'); }}>
                    📤 Go to JSON Upload
                  </a>
                  <a href="#" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); setActiveTab('neo4j'); }}>
                    🔗 Configure Neo4j
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted">Could not load the guide. Please try again.</p>
          )}
        </div>
      )}
    </div>
  );
}
