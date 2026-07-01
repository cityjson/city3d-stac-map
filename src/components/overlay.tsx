import { Box, Container, GridItem } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Header from "./header";
import Panel from "./panel";

const MIN_PANEL_WIDTH = 320;
const MIN_HEADER_WIDTH = 260;
const DEFAULT_PANEL_WIDTH = 420;

function getMaxPanelWidth() {
  return window.innerWidth - MIN_HEADER_WIDTH;
}

function clampPanelWidth(width: number) {
  return Math.max(MIN_PANEL_WIDTH, Math.min(width, getMaxPanelWidth()));
}

function getInitialPanelWidth() {
  return clampPanelWidth(Math.min(DEFAULT_PANEL_WIDTH, window.innerWidth * 0.4));
}

export default function Overlay() {
  const [panelWidth, setPanelWidth] = useState(getInitialPanelWidth);

  useEffect(() => {
    function handleResize() {
      setPanelWidth((width) => clampPanelWidth(width));
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleResizePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = panelWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function handlePointerMove(moveEvent: PointerEvent) {
      setPanelWidth(clampPanelWidth(startWidth + moveEvent.clientX - startX));
    }

    function handlePointerUp() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  return (
    <Container
      zIndex={1}
      fluid
      h="100dvh"
      pointerEvents={"none"}
      position={"absolute"}
      top={0}
      left={0}
      pt={3}
      px={3}
    >
      <Box
        display="grid"
        gridTemplateColumns={`${panelWidth}px minmax(0, 1fr)`}
        gap={3}
      >
        <GridItem minW={0} position="relative">
          <Panel />
          <Box
            role="separator"
            aria-label="Resize side panel"
            aria-orientation="vertical"
            aria-valuemin={MIN_PANEL_WIDTH}
            aria-valuemax={getMaxPanelWidth()}
            aria-valuenow={Math.round(panelWidth)}
            position="absolute"
            top={0}
            right="-6px"
            zIndex={2}
            h="80dvh"
            w="12px"
            pointerEvents="auto"
            cursor="col-resize"
            display="flex"
            alignItems="stretch"
            justifyContent="center"
            onPointerDown={handleResizePointerDown}
          >
            <Box
              w="1px"
              rounded="full"
              bg="border"
              opacity={0.65}
              _hover={{ opacity: 1, bg: "fg.muted" }}
            />
          </Box>
        </GridItem>
        <GridItem minW={0}>
          <Header />
        </GridItem>
      </Box>
    </Container>
  );
}
