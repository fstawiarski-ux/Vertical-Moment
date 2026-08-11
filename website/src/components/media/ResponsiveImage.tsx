import type { ExploreImageAsset } from "../../core/types";

export function ResponsiveImage({
  image,
  className,
  priority = false,
}: {
  image: ExploreImageAsset;
  className?: string;
  priority?: boolean;
}) {
  return (
    <picture>
      {image.sources?.map((source) => (
        <source key={source.type} type={source.type} srcSet={source.srcSet} sizes={image.sizes} />
      ))}
      <img
        className={className}
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={image.sizes}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
    </picture>
  );
}
