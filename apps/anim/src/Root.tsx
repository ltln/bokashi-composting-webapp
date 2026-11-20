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
import { EN_VO_SCHEDULES, VI_VO_SCHEDULES } from "./voAlignment";

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
      <Folder name="Setup-VI">
        <Composition
          id="Step1Vi"
          component={Step1}
          defaultProps={{ locale: "vi", voiced: true }}
          durationInFrames={VI_VO_SCHEDULES.Step1.totalFrames}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Step2Vi"
          component={Step2}
          defaultProps={{ locale: "vi", voiced: true }}
          durationInFrames={VI_VO_SCHEDULES.Step2.totalFrames}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Step3Vi"
          component={Step3}
          defaultProps={{ locale: "vi", voiced: true }}
          durationInFrames={VI_VO_SCHEDULES.Step3.totalFrames}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
      </Folder>
      <Folder name="FAQ-VI">
        <Composition
          id="Faq1Vi"
          component={Faq1}
          defaultProps={{ locale: "vi", voiced: true }}
          durationInFrames={VI_VO_SCHEDULES.Faq1.totalFrames}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Faq2Vi"
          component={Faq2}
          defaultProps={{ locale: "vi", voiced: true }}
          durationInFrames={VI_VO_SCHEDULES.Faq2.totalFrames}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Faq3Vi"
          component={Faq3}
          defaultProps={{ locale: "vi", voiced: true }}
          durationInFrames={VI_VO_SCHEDULES.Faq3.totalFrames}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Faq4Vi"
          component={Faq4}
          defaultProps={{ locale: "vi", voiced: true }}
          durationInFrames={VI_VO_SCHEDULES.Faq4.totalFrames}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Faq5Vi"
          component={Faq5}
          defaultProps={{ locale: "vi", voiced: true }}
          durationInFrames={VI_VO_SCHEDULES.Faq5.totalFrames}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
      </Folder>
      <Folder name="Setup-EN">
        <Composition
          id="Step1En"
          component={Step1}
          defaultProps={{ locale: "en", voiced: true }}
          durationInFrames={EN_VO_SCHEDULES.Step1.totalFrames}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Step2En"
          component={Step2}
          defaultProps={{ locale: "en", voiced: true }}
          durationInFrames={EN_VO_SCHEDULES.Step2.totalFrames}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Step3En"
          component={Step3}
          defaultProps={{ locale: "en", voiced: true }}
          durationInFrames={EN_VO_SCHEDULES.Step3.totalFrames}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
      </Folder>
      <Folder name="FAQ-EN">
        <Composition
          id="Faq1En"
          component={Faq1}
          defaultProps={{ locale: "en", voiced: true }}
          durationInFrames={EN_VO_SCHEDULES.Faq1.totalFrames}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Faq2En"
          component={Faq2}
          defaultProps={{ locale: "en", voiced: true }}
          durationInFrames={EN_VO_SCHEDULES.Faq2.totalFrames}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Faq3En"
          component={Faq3}
          defaultProps={{ locale: "en", voiced: true }}
          durationInFrames={EN_VO_SCHEDULES.Faq3.totalFrames}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Faq4En"
          component={Faq4}
          defaultProps={{ locale: "en", voiced: true }}
          durationInFrames={EN_VO_SCHEDULES.Faq4.totalFrames}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Faq5En"
          component={Faq5}
          defaultProps={{ locale: "en", voiced: true }}
          durationInFrames={EN_VO_SCHEDULES.Faq5.totalFrames}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
      </Folder>
    </>
  );
}
