import { useRef, useState } from "react";
import { uploadPropertyImage, uploadTestimonialImage } from "../../firebase/storage";

const UPLOADERS = {
  properties: uploadPropertyImage,
  testimonials: uploadTestimonialImage,
};

// Default: images only (used by testimonial photos).
export const IMAGE_TYPES = [
  { ext: ".png", mime: "image/png" },
  { ext: ".jpg", mime: "image/jpeg" },
  { ext: ".jpeg", mime: "image/jpeg" },
];

// Property gallery also allows PDF brochures and HEIC photos.
export const GALLERY_TYPES = [
  { ext: ".pdf", mime: "application/pdf" },
  { ext: ".png", mime: "image/png" },
  { ext: ".jpg", mime: "image/jpeg" },
  { ext: ".jpeg", mime: "image/jpeg" },
  { ext: ".heic", mime: "image/heic" },
  { ext: ".heif", mime: "image/heif" },
];

// Property brochure: a single downloadable PDF.
export const BROCHURE_TYPES = [{ ext: ".pdf", mime: "application/pdf" }];

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * File picker / drag-drop that validates type + size, uploads to Firebase
 * Storage, reports progress, and calls onUploaded({url, path, name, contentType})
 * per finished file.
 *
 * @param {object} props
 * @param {"properties"|"testimonials"} props.folder
 * @param {string} props.ownerId       property/testimonial id (folder segment)
 * @param {boolean} [props.multiple]
 * @param {Array<{ext:string,mime:string}>} [props.accept]  allowed types (default IMAGE_TYPES)
 * @param {number} [props.maxBytes]     per-file size cap (default 10 MB)
 * @param {boolean} [props.disabled]
 * @param {string} [props.disabledHint] message shown when disabled
 * @param {(item:{url:string, path:string, name:string, contentType:string}) => void} props.onUploaded
 */
export default function ImageUploader({
  folder,
  ownerId,
  multiple = true,
  accept = IMAGE_TYPES,
  maxBytes = DEFAULT_MAX_BYTES,
  disabled = false,
  disabledHint,
  onUploaded,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState([]); // { name, pct, error }

  const upload = UPLOADERS[folder];
  const allowedMimes = accept.map((a) => a.mime);
  const allowedExts = accept.map((a) => a.ext);
  const acceptAttr = [...new Set([...allowedExts, ...allowedMimes])].join(",");
  const maxMb = Math.round(maxBytes / (1024 * 1024));
  const extLabel = [...new Set(allowedExts.map((e) => e.replace(".", "").toUpperCase()))].join(", ");

  const validate = (file) => {
    const name = file.name.toLowerCase();
    const okType = allowedMimes.includes(file.type) || allowedExts.some((ext) => name.endsWith(ext));
    if (!okType) return `Unsupported type — allowed: ${extLabel}.`;
    if (file.size > maxBytes) return `Too large (max ${maxMb} MB).`;
    return null;
  };

  const handleFiles = (fileList) => {
    if (disabled) return;
    Array.from(fileList).forEach((file) => {
      const problem = validate(file);
      const entry = { name: file.name, pct: 0, error: problem };
      setUploads((u) => [...u, entry]);
      if (problem) return; // show the rejection, don't upload

      const setPct = (pct) => setUploads((u) => u.map((e) => (e === entry ? { ...e, pct } : e)));
      upload(file, ownerId, (pct) => setPct(pct))
        .then(({ url, path }) => {
          onUploaded({ url, path, name: file.name, contentType: file.type });
          setUploads((u) => u.filter((e) => e !== entry));
        })
        .catch((err) => {
          setUploads((u) => u.map((e) => (e === entry ? { ...e, error: err.message || "Upload failed" } : e)));
        });
    });
  };

  if (disabled) {
    return (
      <div className="admin-uploader admin-uploader--disabled">
        <i className="fa-solid fa-lock" aria-hidden="true" />
        <span>{disabledHint || "Save first to enable uploads."}</span>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`admin-uploader${dragging ? " is-dragging" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" />
        <span>Drag &amp; drop here, or click to choose</span>
        <small className="admin-uploader__hint">{extLabel} · up to {maxMb} MB each</small>
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          multiple={multiple}
          hidden
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {uploads.length > 0 && (
        <ul className="admin-uploads">
          {uploads.map((u, i) => (
            <li key={i} className="admin-upload">
              <span className="admin-upload__name">{u.name}</span>
              {u.error ? (
                <span className="admin-upload__error">{u.error}</span>
              ) : (
                <span className="admin-upload__bar">
                  <span className="admin-upload__fill" style={{ width: `${u.pct}%` }} />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
