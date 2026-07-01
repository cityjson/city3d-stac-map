import { HStack } from "@chakra-ui/react";
import HrefInput from "./href-input";
import { ColorModeButton } from "./ui/color-mode";
import { ProjectionButton } from "./ui/projection";
import { SettingsButton } from "./ui/settings";

export default function Header() {
  return (
    <HStack pointerEvents={"auto"} w="full" minW={0}>
      <HrefInput />
      <ProjectionButton variant={"surface"} flexShrink={0} />
      <ColorModeButton variant={"surface"} flexShrink={0} />
      <SettingsButton variant={"surface"} flexShrink={0} />
    </HStack>
  );
}
