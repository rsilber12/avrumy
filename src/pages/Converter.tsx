import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import JSZip from "jszip";
import { Upload, Download, X, FileType, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { convertFontToTtf, ttfFileName } from "@/lib/fontConverter";

type Status = "pending" | "converting" | "done" | "error";

interface Item {
  id: string;
  file: File;
  status: Status;
  error?: string;
  ttf?: Uint8Array;
  outName?: string;
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const Converter = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [converting, setConverting] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const accepted: Item[] = [];
    for (const f of Array.from(files)) {
      const n = f.name.toLowerCase();
      if (!n.endsWith(".woff") && !n.endsWith(".woff2")) continue;
      accepted.push({
        id: crypto.randomUUID(),
        file: f,
        status: "pending",
      });
    }
    if (accepted.length === 0) {
      toast.error("Only .woff and .woff2 files are supported");
      return;
    }
    setItems((prev) => [...prev, ...accepted]);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const convertAll = async () => {
    setConverting(true);
    const pending = items.filter((i) => i.status === "pending" || i.status === "error");
    for (const item of pending) {
      setItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: "converting", error: undefined } : p)),
      );
      try {
        const ttf = await convertFontToTtf(item.file);
        const outName = ttfFileName(item.file.name);
        setItems((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: "done", ttf, outName } : p)),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Conversion failed";
        setItems((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: "error", error: msg } : p)),
        );
      }
    }
    setConverting(false);
  };

  const downloadOne = (item: Item) => {
    if (!item.ttf || !item.outName) return;
    // Copy into a fresh ArrayBuffer so Blob gets a real ArrayBuffer (not SharedArrayBuffer)
    const copy = new Uint8Array(item.ttf.byteLength);
    copy.set(item.ttf);
    downloadBlob(new Blob([copy.buffer], { type: "font/ttf" }), item.outName);
  };

  const downloadAllZip = async () => {
    const done = items.filter((i) => i.status === "done" && i.ttf && i.outName);
    if (done.length === 0) {
      toast.error("Nothing to download yet");
      return;
    }
    const zip = new JSZip();
    for (const i of done) zip.file(i.outName!, i.ttf!);
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "fonts-ttf.zip");
  };

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((p) => p.id !== id));
  const clearAll = () => setItems([]);

  const doneCount = items.filter((i) => i.status === "done").length;
  const pendingCount = items.filter((i) => i.status === "pending" || i.status === "error").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <nav className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Avrumy
          </Link>
          <Link
            to="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </Link>
        </nav>
      </header>

      <main className="container mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <h1 className="mb-3 text-4xl font-semibold tracking-tight">Font Converter</h1>
          <p className="text-muted-foreground">
            Convert <span className="font-medium text-foreground">.woff</span> and{" "}
            <span className="font-medium text-foreground">.woff2</span> files to{" "}
            <span className="font-medium text-foreground">.ttf</span>. Everything runs locally
            in your browser — no uploads.
          </p>
        </div>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/50"
          }`}
        >
          <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="mb-1 text-base font-medium">Drop fonts here or click to browse</p>
          <p className="text-sm text-muted-foreground">
            Supports .woff and .woff2 — multiple files allowed
          </p>
          <input
            type="file"
            accept=".woff,.woff2,font/woff,font/woff2"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>

        {items.length > 0 && (
          <div className="mt-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {items.length} file{items.length !== 1 ? "s" : ""} • {doneCount} converted
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearAll} disabled={converting}>
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={convertAll}
                  disabled={converting || pendingCount === 0}
                >
                  {converting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Converting…
                    </>
                  ) : (
                    `Convert ${pendingCount > 0 ? pendingCount : "all"}`
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={downloadAllZip}
                  disabled={doneCount === 0}
                >
                  <Download className="h-4 w-4" /> Download all (.zip)
                </Button>
              </div>
            </div>

            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <FileType className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(item.file.size / 1024).toFixed(1)} KB
                      {item.error && (
                        <span className="ml-2 text-destructive">— {item.error}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === "converting" && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {item.status === "done" && (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadOne(item)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {item.status === "error" && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                      disabled={item.status === "converting"}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Avrumy, LLC
      </footer>
    </div>
  );
};

export default Converter;
