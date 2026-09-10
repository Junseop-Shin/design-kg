import { z } from "zod";

export const Stance = z.enum(["PRESCRIPTIVE", "PREFERRED", "OPTION"]);
export const Platform = z.enum(["mobile", "web", "any"]);
export const Size = z.enum(["sm", "md", "lg", "any"]);
export const Direction = z.enum(["up", "down", "set", "other"]);
export const ElementState = z.enum(["default", "focus-visible"]);

export const Scope = z.object({
  component: z.string().default("any"),
  platform: Platform.default("any"),
  size: Size.default("any"),
  variant: z.string().default("any"),
  context: z.string().default("any"),
});

export const Measured = z.object({
  prop: z.string(),
  value: z.number(),
  unit: z.string(),
});

export const Source = z.object({
  video: z.string().regex(/^[A-Za-z0-9_-]{11}$/, "YouTube video id"),
  t: z.string().regex(/^(\d{1,2}:)?\d{1,2}:\d{2}$/, "m:ss or h:mm:ss"),
});

export const Case = z.object({
  id: z.string().regex(/^case-\d{3,}$/),
  source: Source,
  scope: Scope.prefault({}),
  property: z.string(),
  direction: Direction.default("other"),
  problem: z.string(),
  fix: z.string(),
  rationale: z.string().default(""),
  stance: Stance,
  quote: z.string(),
  qualities: z.array(z.string().regex(/^[^→]+→[^→]+$/, "현재→목표")).default([]),
  measured: Measured.optional(),
  evidence: z.string().optional(),
});

export const Rule = z
  .object({
    id: z.string().regex(/^rule-\d{3,}$/),
    statement: z.string(),
    grade: z.enum(["CHECKABLE", "JUDGMENT"]),
    source: z.enum(["corpus", "standard"]).default("corpus"),
    standard_ref: z.string().optional(),
    scope: Scope.prefault({}),
    property: z.string(),
    state: ElementState.default("default"),
    check: z.string().optional(),
    promoted_from: z.array(z.string()).default([]),
    confidence: z.number().int().nonnegative().default(0),
    conflicts_with: z.array(z.string()).default([]),
  })
  .refine((r) => r.grade !== "CHECKABLE" || !!r.check, {
    message: "CHECKABLE rule needs a check expression",
    path: ["check"],
  });

export const Option = z.object({
  id: z.string().regex(/^option-\d{3,}$/),
  question: z.string(),
  scope: Scope.prefault({}),
  choices: z
    .array(
      z.object({
        label: z.string(),
        when: z.string(),
        recommended: z.boolean().default(false),
        cases: z.array(z.string()).min(1),
      }),
    )
    .min(2),
});

const RealizedBy = z
  .object({
    property: z.string(),
    direction: z.enum(["up", "down", "set"]),
    value: z.union([z.number(), z.string()]).optional(),
    scope: Scope.optional(),
    weight: z.number().int().positive(),
    cases: z.array(z.string()).min(1),
  })
  .refine((r) => r.direction !== "set" || r.value !== undefined, {
    message: "direction=set needs value",
    path: ["value"],
  });

export const Quality = z.object({
  id: z.string().regex(/^quality-[a-z0-9-]+$/),
  label: z.string(),
  aliases: z.array(z.string()).default([]),
  polarity: z.enum(["target", "problem"]).default("target"),
  realized_by: z.array(RealizedBy).default([]),
  opposes: z.string().optional(),
});

export const ComponentMap = z.object({
  kg: z.string(),
  ui: z.array(z.string()),
  exclude: z.boolean().default(false),
  note: z.string().optional(),
});

export const Video = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  title: z.string(),
  url: z.url(),
  duration_s: z.number().int().positive().optional(),
  category: z.enum(["review", "web", "mobile"]),
  subtitles: z.enum(["auto", "manual", "none"]),
  reason: z.string(),
});

export const SnapshotElement = z.object({
  ui: z.string(),
  variant: z.string().default("any"),
  size: z.string().default("any"),
  context: z.string().default("any"),
  selector: z.string(),
  state: ElementState,
  box: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }),
  style: z.record(z.string(), z.string()),
  text: z.string().optional(),
});

export const Snapshot = z.object({
  url: z.string(),
  platform: Platform,
  viewport: z.object({ width: z.number(), height: z.number() }),
  capturedAt: z.string(),
  elements: z.array(SnapshotElement),
});

export type Stance = z.infer<typeof Stance>;
export type Platform = z.infer<typeof Platform>;
export type Scope = z.infer<typeof Scope>;
export type Case = z.infer<typeof Case>;
export type Rule = z.infer<typeof Rule>;
export type Option = z.infer<typeof Option>;
export type Quality = z.infer<typeof Quality>;
export type Video = z.infer<typeof Video>;
export type ComponentMap = z.infer<typeof ComponentMap>;
export type SnapshotElement = z.infer<typeof SnapshotElement>;
export type Snapshot = z.infer<typeof Snapshot>;

export type Kg = {
  videos: Video[];
  cases: Case[];
  rules: Rule[];
  options: Option[];
  qualities: Quality[];
  components: ComponentMap[];
};
