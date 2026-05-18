import { useState, type ImgHTMLAttributes } from 'react';

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  widths?: number[];
  sizes?: string;
}

function getWebpUrl(src: string): string {
  return src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
}

export function OptimizedImage({
  src,
  alt,
  widths = [320, 640, 960, 1280],
  sizes = '(max-width: 768px) 100vw, 50vw',
  className,
  ...rest
}: Props) {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  const ext = src.split('.').pop()?.toLowerCase();
  const isRaster = ext === 'png' || ext === 'jpg' || ext === 'jpeg';

  if (!isRaster) {
    return <img src={src} alt={alt} loading="lazy" className={className} onError={() => setHidden(true)} {...rest} />;
  }

  const srcsetWebp = widths.map((w) => `${getWebpUrl(src)}?w=${w} ${w}w`).join(', ');
  const srcsetOrig = widths.map((w) => `${src}?w=${w} ${w}w`).join(', ');

  return (
    <picture>
      <source type="image/webp" srcSet={srcsetWebp} sizes={sizes} />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        srcSet={srcsetOrig}
        sizes={sizes}
        className={className}
        onError={() => setHidden(true)}
        {...rest}
      />
    </picture>
  );
}
