/** Props shared by every setup-step illustration (and a good shape for FAQ illustrations). */
export interface StepIllustrationProps {
  /** 0-based active sub-step. Elements of earlier sub-steps stay drawn; later ones are hidden. */
  active: number;
  /** Freeze the CSS animations (the stage already does; this makes the SVG self-contained). */
  paused?: boolean;
  /** aria-label of the SVG, from content/setupSteps. */
  label: string;
}
