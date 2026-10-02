import { useState, useRef, useCallback, useEffect } from 'react';
import { Check, X, Crop, RotateCcw } from 'lucide-react';

interface ImageCropperProps {
  file: File;
  onCancel: () => void;
  onConfirm: (croppedFile: File) => void;
  aspectRatio?: number;
  title?: string;
}

interface CropRect { x: number; y: number; w: number; h: number; }
interface Point { x: number; y: number; }

type DragMode = 'idle' | 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se';

const MIN_SIZE = 40;

export function ImageCropper({
  file,
  onCancel,
  onConfirm,
  aspectRatio = 1,
  title = 'Crop Image',
}: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSrc, setImgSrc] = useState('');
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  const [dragMode, setDragMode] = useState<DragMode>('idle');
  const dragState = useRef<{ start: Point; origin: CropRect }>({ start: { x: 0, y: 0 }, origin: { x: 0, y: 0, w: 0, h: 0 } });
  const [preview, setPreview] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImgSrc(url);
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Use a fixed display area and compute the actual rendered image size precisely
  const handleImgLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    // Get the actual rendered dimensions of the <img> element
    const rect = img.getBoundingClientRect();
    const dw = rect.width;
    const dh = rect.height;
    setDisplaySize({ w: dw, h: dh });

    // Center the initial crop at 85% of the smaller dimension
    const minSide = Math.min(dw, dh);
    const side = minSide * 0.85;
    setCrop({
      x: (dw - side) / 2,
      y: (dh - side) / 2,
      w: side,
      h: side,
    });
  }, []);

  const clampCrop = useCallback((c: CropRect): CropRect => {
    let { x, y, w, h } = c;
    if (w < MIN_SIZE) w = MIN_SIZE;
    if (h < MIN_SIZE) h = MIN_SIZE;
    if (aspectRatio === 1) {
      const s = Math.min(w, h);
      w = s;
      h = s;
    } else {
      h = w / aspectRatio;
    }
    // Clamp within image bounds
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + w > displaySize.w) x = displaySize.w - w;
    if (y + h > displaySize.h) y = displaySize.h - h;
    if (x < 0) { x = 0; w = displaySize.w; }
    if (y < 0) { y = 0; h = displaySize.h; }
    return { x, y, w, h };
  }, [aspectRatio, displaySize.w, displaySize.h]);

  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    return {
      x: Math.max(0, Math.min(clientX - rect.left, displaySize.w)),
      y: Math.max(0, Math.min(clientY - rect.top, displaySize.h)),
    };
  };

  const startDrag = (mode: DragMode) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const p = getPoint(e);
    setDragMode(mode);
    dragState.current = { start: p, origin: { ...crop } };
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragMode === 'idle') return;
    e.preventDefault();
    const p = getPoint(e);
    const { start, origin } = dragState.current;
    const dx = p.x - start.x;
    const dy = p.y - start.y;

    if (dragMode === 'move') {
      setCrop(clampCrop({ x: origin.x + dx, y: origin.y + dy, w: origin.w, h: origin.h }));
      return;
    }

    let { x, y, w, h } = origin;
    if (dragMode === 'resize-se') {
      w = origin.w + dx;
      h = origin.h + dy;
    } else if (dragMode === 'resize-sw') {
      x = origin.x + dx;
      w = origin.w - dx;
      h = origin.h + dy;
    } else if (dragMode === 'resize-ne') {
      y = origin.y + dy;
      w = origin.w + dx;
      h = origin.h - dy;
    } else if (dragMode === 'resize-nw') {
      x = origin.x + dx;
      y = origin.y + dy;
      w = origin.w - dx;
      h = origin.h - dy;
    }

    // Maintain aspect ratio for square crop
    if (aspectRatio === 1) {
      const s = Math.min(Math.abs(w), Math.abs(h));
      if (dragMode === 'resize-nw') {
        x = origin.x + (origin.w - s);
        y = origin.y + (origin.h - s);
      } else if (dragMode === 'resize-ne') {
        y = origin.y + (origin.h - s);
        x = origin.x;
      } else if (dragMode === 'resize-sw') {
        x = origin.x + (origin.w - s);
        y = origin.y;
      } else {
        x = origin.x;
        y = origin.y;
      }
      w = s;
      h = s;
    }

    setCrop(clampCrop({ x, y, w, h }));
  };

  const endDrag = () => setDragMode('idle');

  // Generate preview — use exact integer pixel mapping
  useEffect(() => {
    if (crop.w <= 0 || displaySize.w <= 0 || !imgRef.current) {
      setPreview('');
      return;
    }
    const img = imgRef.current;
    // Use naturalWidth/naturalHeight for precise scaling
    const scaleX = img.naturalWidth / displaySize.w;
    const scaleY = img.naturalHeight / displaySize.h;
    const sw = Math.round(crop.w * scaleX);
    const sh = Math.round(crop.h * scaleY);
    const sx = Math.round(crop.x * scaleX);
    const sy = Math.round(crop.y * scaleY);
    if (sw <= 0 || sh <= 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    setPreview(canvas.toDataURL('image/jpeg', 0.85));
  }, [crop, displaySize, imgSize]);

  const handleConfirm = () => {
    if (crop.w <= 0 || !imgRef.current) return;
    const img = imgRef.current;
    const scaleX = img.naturalWidth / displaySize.w;
    const scaleY = img.naturalHeight / displaySize.h;
    const sw = Math.round(crop.w * scaleX);
    const sh = Math.round(crop.h * scaleY);
    const sx = Math.round(crop.x * scaleX);
    const sy = Math.round(crop.y * scaleY);
    if (sw <= 0 || sh <= 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    canvas.toBlob((blob) => {
      if (!blob) return;
      onConfirm(new File([blob], file.name, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  };

  const handleReset = () => {
    if (displaySize.w === 0) return;
    const minSide = Math.min(displaySize.w, displaySize.h);
    const side = minSide * 0.85;
    setCrop({
      x: (displaySize.w - side) / 2,
      y: (displaySize.h - side) / 2,
      w: side,
      h: side,
    });
  };

  const cursorClass = dragMode === 'move' ? 'cursor-move' : dragMode !== 'idle' ? 'cursor-nwse-resize' : 'cursor-crosshair';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-sm animate-fade-in" style={{ backgroundColor: 'var(--overlay)' }} onClick={onCancel} />
      <div
        className="relative rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[95vh] animate-scale-in"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b-themed">
          <h2 className="text-lg font-semibold t-primary flex items-center gap-2">
            <Crop className="w-5 h-5 text-accent" /> {title}
          </h2>
          <button onClick={onCancel} className="t-faint hover:t-secondary transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <p className="text-sm t-muted mb-4 text-center">
            Drag the corners to resize, drag inside to reposition
          </p>

          <div
            className="flex justify-center mb-4"
            onMouseMove={handleMove}
            onTouchMove={handleMove}
            onMouseUp={endDrag}
            onTouchEnd={endDrag}
            onMouseLeave={endDrag}
          >
            <div
              ref={containerRef}
              className={`relative inline-block select-none rounded-lg overflow-hidden ${cursorClass}`}
              style={{ touchAction: 'none' }}
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="To crop"
                onLoad={handleImgLoad}
                className="block max-w-full mx-auto"
                style={{ maxHeight: '350px' }}
                draggable={false}
              />
              {crop.w > 0 && displaySize.w > 0 && (
                <>
                  <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} />
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: `${crop.x}px`,
                      top: `${crop.y}px`,
                      width: `${crop.w}px`,
                      height: `${crop.h}px`,
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                      border: '2px solid #E0701A',
                      borderRadius: '4px',
                    }}
                  >
                    {/* Grid lines (rule of thirds) */}
                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/25" />
                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/25" />
                    <div className="absolute top-1/3 left-0 right-0 h-px bg-white/25" />
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-white/25" />

                    {/* Corner handles */}
                    <div
                      onMouseDown={startDrag('resize-nw')}
                      onTouchStart={startDrag('resize-nw')}
                      className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-white rounded-sm cursor-nwse-resize shadow"
                      style={{ border: '2px solid #B45309' }}
                    />
                    <div
                      onMouseDown={startDrag('resize-ne')}
                      onTouchStart={startDrag('resize-ne')}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white rounded-sm cursor-nesw-resize shadow"
                      style={{ border: '2px solid #B45309' }}
                    />
                    <div
                      onMouseDown={startDrag('resize-sw')}
                      onTouchStart={startDrag('resize-sw')}
                      className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-white rounded-sm cursor-nesw-resize shadow"
                      style={{ border: '2px solid #B45309' }}
                    />
                    <div
                      onMouseDown={startDrag('resize-se')}
                      onTouchStart={startDrag('resize-se')}
                      className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white rounded-sm cursor-nwse-resize shadow"
                      style={{ border: '2px solid #B45309' }}
                    />

                    {/* Move area */}
                    <div
                      onMouseDown={startDrag('move')}
                      onTouchStart={startDrag('move')}
                      className="absolute inset-0 cursor-move"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Preview row */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-xs t-muted mb-2">Preview</p>
              <div
                className="w-20 h-20 rounded-lg overflow-hidden border-2"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-subtle)' }}
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center t-faint">
                    <Crop className="w-6 h-6" />
                  </div>
                )}
              </div>
            </div>
            <button onClick={handleReset} className="btn btn-ghost btn-sm t-secondary">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t-themed">
          <button className="btn btn-secondary flex-1" onClick={onCancel}>
            <X className="w-4 h-4" /> Cancel
          </button>
          <button className="btn btn-primary flex-1" onClick={handleConfirm}>
            <Check className="w-4 h-4" /> Confirm Crop
          </button>
        </div>
      </div>
    </div>
  );
}
