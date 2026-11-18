import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";

import { Composition, Folder } from "remotion";
import { Faq1 } from "./boards/Faq1";
import { Faq2 } from "./boards/Faq2";
import { Faq3 } from "./boards/Faq3";
import { Faq4 } from "./boards/Faq4";
import { Faq5 } from "./boards/Faq5";
import { Step1 } from "./boards/Step1";
import { Step2 } from "./boards/Step2";
import { Step3 } from "./boards/Step3";
import { COMP_HEIGHT, COMP_WIDTH, FPS, SUBSTEP_FRAMES } from "./timeline";

export function RemotionRoot() {
  return (
    <>
      <Folder name="Setup">
        <Composition
          id="Step1"
          component={Step1}
          durationInFrames={3 * SUBSTEP_FRAMES}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Step2"
          component={Step2}
          durationInFrames={4 * SUBSTEP_FRAMES}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Step3"
          component={Step3}
          durationInFrames={3 * SUBSTEP_FRAMES}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
      </Folder>
      <Folder name="FAQ">
        <Composition
          id="Faq1"
          component={Faq1}
          durationInFrames={4 * SUBSTEP_FRAMES}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Faq2"
          component={Faq2}
          durationInFrames={3 * SUBSTEP_FRAMES}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Faq3"
          component={Faq3}
          durationInFrames={3 * SUBSTEP_FRAMES}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Faq4"
          component={Faq4}
          durationInFrames={2 * SUBSTEP_FRAMES}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Faq5"
          component={Faq5}
          durationInFrames={3 * SUBSTEP_FRAMES}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
      </Folder>
    </>
  );
}
