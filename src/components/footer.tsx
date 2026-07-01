import { Prose } from "@/components/ui/prose";
import {
  CloseButton,
  Dialog,
  HStack,
  Link,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CollecticonBrandDevelopmentSeed2 } from "@devseed-ui/collecticons-chakra";
import { LuGitFork, LuGithub } from "react-icons/lu";
import Markdown from "react-markdown";
import changelog from "../../CHANGELOG.md?raw";
import { version } from "../../package.json";

export default function Footer() {
  return (
    <Stack
      position={"absolute"}
      bottom={3}
      left={6}
      gap={1}
      fontWeight={"normal"}
      fontSize={"xs"}
      color={"fg.subtle"}
      letterSpacing={"tight"}
      css={{
        "& a": {
          color: "var(--chakra-colors-fg-muted)",
          transition: "color 0.2s",
        },
        "& a:hover": {
          color: "var(--chakra-colors-fg-default)",
        },
      }}
    >
      <Text maxW={{ base: "calc(100dvw - 3rem)", md: "42rem" }}>
        Information listed here is incomplete and may be wrong. If you find
        issues, please contribute or report them at{" "}
        <Link
          href="https://github.com/cityjson/city3d-stac-registry"
          target="_blank"
          rel="noopener noreferrer"
        >
          cityjson/city3d-stac-registry
        </Link>
        .
      </Text>
      <HStack>
        <Dialog.Root size={"xl"} scrollBehavior={"inside"}>
          <Dialog.Trigger asChild>
            <Link as={"button"}>v{version}</Link>
          </Dialog.Trigger>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title fontSize={"sm"}>
                    stac-map is public, open source, and free. Found a bug or
                    have a feature request?{" "}
                    <Link
                      href="https://github.com/developmentseed/stac-map/issues/new/choose"
                      target="_blank"
                    >
                      Open an issue on Github <LuGithub />
                    </Link>
                  </Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Prose>
                    <Markdown>{changelog}</Markdown>
                  </Prose>
                </Dialog.Body>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Dialog.CloseTrigger>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>{" "}
        | Forked from{" "}
        <Link
          href="https://github.com/developmentseed/stac-map"
          target="_blank"
        >
          stac-map <LuGitFork />
        </Link>{" "}
        by{" "}
        <Link href="https://developmentseed.org/" target="_blank">
          Development Seed <CollecticonBrandDevelopmentSeed2 />
        </Link>
      </HStack>
    </Stack>
  );
}
