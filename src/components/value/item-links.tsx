import { useEffect, useState } from "react";
import type { StacLink } from "stac-ts";
import { useStacJson } from "../../hooks/stac";
import { useStore } from "../../store";

const BATCH_SIZE = 20;

export default function ItemLinks({ links }: { links: StacLink[] }) {
  const [loadedCount, setLoadedCount] = useState(BATCH_SIZE);

  // Progressively load more links as previous batches complete
  const visibleLinks = links.slice(0, loadedCount);

  return (
    <>
      {visibleLinks.map((link) => (
        <ItemLink
          link={link}
          key={link.href}
          onLoaded={() =>
            setLoadedCount((c) => Math.min(c + 1, links.length))
          }
        />
      ))}
    </>
  );
}

function ItemLink({
  link,
  onLoaded,
}: {
  link: StacLink;
  onLoaded: () => void;
}) {
  const addItem = useStore((state) => state.addItem);
  const result = useStacJson({ href: link.href });

  useEffect(() => {
    if (result.data?.type === "Feature") {
      addItem(result.data);
      onLoaded();
    }
  }, [result.data, addItem, onLoaded]);

  return null;
}
