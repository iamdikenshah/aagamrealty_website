import { useRef, useState } from "react";
import { addProperty, propertyIdExists } from "../../firebase/firestore";
import { parseImportFile, validateRecords } from "../propertyImport";

/**
 * "Import JSON" panel for PropertiesManager.
 *
 * Flow: pick a .json file → every record is validated and shown in a review
 * list → the admin imports the valid ones in bulk (always as drafts), or loads
 * a single record into the normal property form to edit before saving.
 *
 * Importing never overwrites: an id already taken in Firestore is given a
 * numeric suffix, the same way the form derives ids for new listings.
 */
export default function PropertyImport({ onClose, onImported, onEditRecord }) {
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [results, setResults] = useState(null);
  const [skipped, setSkipped] = useState({}); // id → true when deselected
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null); // {done, total}
  const [report, setReport] = useState(null); // post-import summary

  const handleFile = async (file) => {
    setParseError("");
    setResults(null);
    setReport(null);
    setSkipped({});
    if (!file) return;
    setFileName(file.name);
    try {
      const { records } = await parseImportFile(file);
      const validated = validateRecords(records);
      // Flag ids already present in Firestore so the admin knows a suffix is coming.
      await Promise.all(
        validated.map(async (r) => {
          if (!r.id || r.errors.length) return;
          if (await propertyIdExists(r.id)) {
            r.warnings.push(`A property with id "${r.id}" already exists — this will import as a separate copy.`);
          }
        })
      );
      setResults(validated);
    } catch (err) {
      setParseError(err.message || "Could not read that file.");
    }
  };

  const onPick = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
    e.target.value = ""; // let the same file be re-picked after a fix
  };

  const importable = (results || []).filter((r) => r.errors.length === 0 && !skipped[r.index]);

  const uniqueId = async (base) => {
    const root = base || "property";
    let id = root;
    let n = 2;
    // eslint-disable-next-line no-await-in-loop
    while (await propertyIdExists(id)) { id = `${root}-${n}`; n += 1; }
    return id;
  };

  const runImport = async () => {
    if (!importable.length) return;
    if (!confirm(`Import ${importable.length} propert${importable.length === 1 ? "y" : "ies"} as drafts?`)) return;
    setBusy(true);
    setProgress({ done: 0, total: importable.length });
    const ok = [];
    const failed = [];
    for (let i = 0; i < importable.length; i += 1) {
      const r = importable[i];
      try {
        // eslint-disable-next-line no-await-in-loop
        const id = await uniqueId(r.id);
        // eslint-disable-next-line no-await-in-loop
        await addProperty(id, r.data);
        ok.push({ title: r.title, id });
      } catch (err) {
        failed.push({ title: r.title, message: err.message || String(err) });
      }
      setProgress({ done: i + 1, total: importable.length });
    }
    setBusy(false);
    setProgress(null);
    setReport({ ok, failed });
    if (ok.length) onImported();
  };

  const toggle = (index) => setSkipped((s) => ({ ...s, [index]: !s[index] }));

  const validCount = (results || []).filter((r) => !r.errors.length).length;
  const errorCount = (results || []).length - validCount;

  return (
    <div className="admin-import">
      <div className="admin-page-head">
        <h1 className="admin-h1">Import properties</h1>
        <button className="admin-btn" onClick={onClose} disabled={busy}>Cancel</button>
      </div>

      {!report && (
        <div className="admin-import__drop">
          <i className="fa-solid fa-file-arrow-up" aria-hidden="true" />
          <p>Upload a <strong>.json</strong> file containing a property object, or a list of them.</p>
          <button className="admin-btn admin-btn--primary" onClick={() => fileRef.current?.click()} disabled={busy}>
            Choose JSON file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            onChange={onPick}
            hidden
          />
          {fileName && <p className="admin-muted admin-import__file">{fileName}</p>}
        </div>
      )}

      {parseError && <p className="admin-error">{parseError}</p>}

      {results && !report && (
        <>
          <div className="admin-import__summary">
            <span className="admin-badge admin-badge--active">{validCount} ready</span>
            {errorCount > 0 && <span className="admin-badge admin-badge--sold">{errorCount} with errors</span>}
            <span className="admin-muted">Imported properties always start as unpublished drafts.</span>
          </div>

          <ul className="admin-import__list">
            {results.map((r) => {
              const bad = r.errors.length > 0;
              const off = !!skipped[r.index];
              return (
                <li key={r.index} className={`admin-import__item${bad ? " is-invalid" : ""}${off ? " is-skipped" : ""}`}>
                  <div className="admin-import__row">
                    <label className="admin-checkline admin-import__pick">
                      <input
                        type="checkbox"
                        checked={!bad && !off}
                        disabled={bad || busy}
                        onChange={() => toggle(r.index)}
                      />
                      <span className="admin-import__title">
                        {r.index + 1}. {r.title}
                        {r.id && <code className="admin-import__id">{r.id}</code>}
                      </span>
                    </label>
                    <button
                      type="button"
                      className="admin-btn admin-btn--sm"
                      disabled={busy}
                      onClick={() => onEditRecord(r)}
                      title="Open this record in the property form"
                    >
                      <i className="fa-solid fa-pen" aria-hidden="true" /> Edit in form
                    </button>
                  </div>

                  {r.errors.length > 0 && (
                    <ul className="admin-import__msgs admin-import__msgs--err">
                      {r.errors.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  )}
                  {r.warnings.length > 0 && (
                    <ul className="admin-import__msgs admin-import__msgs--warn">
                      {r.warnings.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="admin-form__actions">
            <button className="admin-btn" onClick={onClose} disabled={busy}>Cancel</button>
            <button
              className="admin-btn admin-btn--primary"
              onClick={runImport}
              disabled={busy || importable.length === 0}
            >
              {busy && progress
                ? `Importing ${progress.done}/${progress.total}…`
                : `Import ${importable.length} as draft${importable.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </>
      )}

      {report && (
        <div className="admin-import__report">
          {report.ok.length > 0 && (
            <>
              <p className="admin-import__done">
                <i className="fa-solid fa-circle-check" aria-hidden="true" /> Imported {report.ok.length} propert
                {report.ok.length === 1 ? "y" : "ies"} as drafts.
              </p>
              <ul className="admin-import__msgs">
                {report.ok.map((r) => <li key={r.id}>{r.title} <code className="admin-import__id">{r.id}</code></li>)}
              </ul>
            </>
          )}
          {report.failed.length > 0 && (
            <>
              <p className="admin-error">{report.failed.length} could not be imported:</p>
              <ul className="admin-import__msgs admin-import__msgs--err">
                {report.failed.map((r, i) => <li key={i}>{r.title} — {r.message}</li>)}
              </ul>
            </>
          )}
          <div className="admin-form__actions">
            <button className="admin-btn admin-btn--primary" onClick={onClose}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
