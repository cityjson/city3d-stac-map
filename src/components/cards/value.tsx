import { Prose } from "@/components/ui/prose";
import Thumbnail from "@/components/ui/thumbnail";
import { useStore } from "@/store";
import type { StacValue } from "@/types/stac";
import {
  getSelfHref,
  getStacValueTitle,
  getThumbnailAsset,
} from "@/utils/stac";
import { Card } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { MarkdownHooks } from "react-markdown";

export default function ValueCard({
  value,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
  footer,
  accentColor = "249, 115, 22",
}: {
  value: StacValue;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  footer?: ReactNode;
  accentColor?: string;
}) {
  const setHref = useStore((store) => store.setHref);
  const selfHref = getSelfHref(value);
  const thumbnailAsset = getThumbnailAsset(value);
  const description = value.description as string | undefined;

  return (
    <Card.Root
      size={"sm"}
      variant={"subtle"}
      borderWidth={1}
      borderColor={isHovered ? `rgba(${accentColor}, 0.5)` : "border"}
      bg={isHovered ? `rgba(${accentColor}, 0.06)` : "bg.subtle"}
      cursor={"pointer"}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={() => selfHref && setHref(selfHref)}
      css={{
        transition: "all 0.15s ease",
        "&:hover": {
          borderColor: `rgba(${accentColor}, 0.4)`,
          bg: `rgba(${accentColor}, 0.04)`,
        },
      }}
    >
      <Card.Body gap={2}>
        <Card.Title letterSpacing="tight">{getStacValueTitle(value)}</Card.Title>
        <Card.Description as="div">
          {thumbnailAsset && <Thumbnail asset={thumbnailAsset} />}
          {description && (
            <Prose lineClamp={3}>
              <MarkdownHooks>{description}</MarkdownHooks>
            </Prose>
          )}
        </Card.Description>
      </Card.Body>
      {footer && <Card.Footer>{footer}</Card.Footer>}
    </Card.Root>
  );
}
