import { FormationType } from "./types";
import { SlotFormation } from "./SlotFormation";
import { DynamicQuadFormation } from "./DynamicQuadFormation";
import { VeeFormation } from "./VeeFormation";
import { LineFormation } from "./LineFormation";
import type { Environment } from "./Environment";

/** Display names for each formation type (HUD, debug). */
export const FORMATION_NAMES: Record<FormationType, string> = {
  [FormationType.Quad]: "Quad",
  [FormationType.Vee]: "Vee",
  [FormationType.Line]: "Line",
};

/** Builds the formation for a given type over an environment. */
export function makeFormation(type: FormationType, env: Environment): SlotFormation {
  switch (type) {
    case FormationType.Vee:
      return new VeeFormation(env);
    case FormationType.Line:
      return new LineFormation(env);
    case FormationType.Quad:
    default:
      return new DynamicQuadFormation(env);
  }
}
