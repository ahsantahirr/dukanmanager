import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  getLocalImage,
  removeLocalImage,
  saveLocalImage,
  type LocalImageType,
} from "@/lib/localImages";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";

const MAX_MB = 5;

interface ImageUploadFieldProps {
  type: LocalImageType;
  /** Set when editing an existing row; omit for new rows until saved */
  entityId?: string;
  fallback: string;
  /** Called when user picks a file before entity exists (create flow) */
  onPendingFile?: (file: File | null) => void;
}

export function ImageUploadField({
  type,
  entityId,
  fallback,
  onPendingFile,
}: ImageUploadFieldProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(fallback);
  const [hasCustom, setHasCustom] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!entityId || !user?.id) {
        setPreview(fallback);
        setHasCustom(false);
        return;
      }
      const local = await getLocalImage(user.id, type, entityId);
      if (!cancelled) {
        setPreview(local || fallback);
        setHasCustom(!!local);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [entityId, user?.id, type, fallback]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_MB}MB`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setHasCustom(true);

    if (!entityId || !user?.id) {
      onPendingFile?.(file);
      toast.success("Image will be saved when you submit");
      return;
    }

    setSaving(true);
    try {
      await saveLocalImage(user.id, type, entityId, file);
      toast.success("Image saved on this device");
    } catch {
      toast.error("Could not save image");
      setPreview(fallback);
      setHasCustom(false);
    } finally {
      setSaving(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleRemove = async () => {
    if (entityId && user?.id && hasCustom) {
      await removeLocalImage(user.id, type, entityId);
      toast.success("Image removed");
    }
    onPendingFile?.(null);
    setPreview(fallback);
    setHasCustom(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <Label>Photo (saved on this device only)</Label>
      <div className="flex items-start gap-4 rounded-xl border bg-muted/30 p-3">
        <img
          src={preview}
          alt=""
          className="h-20 w-20 shrink-0 rounded-lg object-cover ring-2 ring-background"
          onError={() => setPreview(fallback)}
        />
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : hasCustom ? "Change photo" : "Upload photo"}
          </Button>
          {hasCustom && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={handleRemove}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Stored in your browser — not uploaded to the server.
          </p>
        </div>
      </div>
    </div>
  );
}
