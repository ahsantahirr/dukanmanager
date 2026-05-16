import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getLocalImage,
  LOCAL_IMAGE_UPDATED,
  type LocalImageType,
} from "@/lib/localImages";
import { cn } from "@/lib/utils";

interface EntityImageProps {
  type: LocalImageType;
  entityId: string;
  fallback: string;
  alt?: string;
  className?: string;
}

export function EntityImage({
  type,
  entityId,
  fallback,
  alt = "",
  className,
}: EntityImageProps) {
  const { user } = useAuth();
  const [src, setSrc] = useState(fallback);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user?.id || !entityId) {
        setSrc(fallback);
        return;
      }

      const local = await getLocalImage(user.id, type, entityId);
      if (!cancelled) {
        setSrc(local || fallback);
      }
    };

    load();

    const onUpdate = () => load();
    window.addEventListener(LOCAL_IMAGE_UPDATED, onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener(LOCAL_IMAGE_UPDATED, onUpdate);
    };
  }, [user?.id, type, entityId, fallback]);

  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-cover", className)}
      onError={() => setSrc(fallback)}
    />
  );
}
