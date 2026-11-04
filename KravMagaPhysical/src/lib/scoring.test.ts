import { describe, expect, it } from "vitest";
import { ageBracketLabels, CHARTS, tableFor } from "./charts";
import { parseValue, formatTime } from "./format";
import { EVENT_IDS, NO_LOCKS, outcomeFor, type LockedValues, type Profile } from "./model";
import { distribute, floorPoints, impossibleFix, nudge, passOptions, scoreFor, solve, valueFor, weakestLocked } from "./scoring";
import { sanitizeLocked, sanitizeProfile } from "../store/plannerStore";

// "Joe" from the school's email: 22-year-old man testing at Blue/Brown (needs 75%).
const joe: Profile = { age: 22, gender: "male", rank: "blue-brown" };
const lock = (values: Partial<LockedValues>): LockedValues => ({ ...NO_LOCKS, ...values });

describe("charts.json", () => {
  it("uses the same age columns for men and women", () => {
    for (const id of ["mile", "pushups"] as const) {
      const labels = (g: "male" | "female") => CHARTS.events[id].charts[g]?.map((b) => b.label);
      expect(labels("female")).toEqual(labels("male"));
    }
  });

  it("has a complete, strictly ordered 0-100 chart for every bracket", () => {
    for (const id of EVENT_IDS) {
      const ev = CHARTS.events[id];
      for (const brackets of Object.values(ev.charts)) {
        for (const b of brackets ?? []) {
          expect(b.values).toHaveLength(101);
          const defined = b.values.filter((v): v is number => v !== null);
          for (let i = 1; i < defined.length; i++) {
            const prev = defined[i - 1] ?? 0;
            const cur = defined[i] ?? 0;
            expect(ev.better === "lower" ? cur < prev : cur > prev).toBe(true);
          }
          expect(b.values[100]).not.toBeNull();
        }
      }
    }
  });

  it("picks the right age bracket at the edges", () => {
    const at = (age: number, gender: Profile["gender"] = "male") => ({
      mile: tableFor("mile", { age, gender, rank: "blue" }).bracket.label,
      pushups: tableFor("pushups", { age, gender, rank: "blue" }).bracket.label,
    });
    expect(at(13)).toEqual({ mile: "<30", pushups: "<25" });
    expect(at(25)).toEqual({ mile: "<30", pushups: "<25" });
    expect(at(26)).toEqual({ mile: "<30", pushups: "26-30" });
    expect(at(30)).toEqual({ mile: "<30", pushups: "26-30" });
    expect(at(31)).toEqual({ mile: "31-35", pushups: "31-35" });
    expect(at(39).mile).toBe("36-39");
    expect(at(40).mile).toBe("40-45");
    expect(at(51)).toEqual({ mile: "51-55", pushups: "51+" });
    expect(at(80)).toEqual({ mile: "66+", pushups: "51+" });
    expect(tableFor("plank", joe).chartLabel).toBe("Everyone");
    expect(ageBracketLabels(22)).toEqual({ mile: "30 and under", reps: "25 and under" });
    expect(ageBracketLabels(38)).toEqual({ mile: "36–39", reps: "36–40" });
    expect(ageBracketLabels(70)).toEqual({ mile: "66 and over", reps: "51 and over" });
    expect(tableFor("squats", joe).chartLabel).toBe("Everyone · 25 and under");
  });
});

describe("scoring", () => {
  it("matches the worked example in the school's email", () => {
    const plan = solve(joe, lock({ mile: 8 * 60 + 40, pushups: 55, squats: 74, plank: 2 * 60 + 15 }));
    expect(plan.events.mile.points).toBe(70);
    expect(plan.events.pushups.points).toBe(80);
    expect(plan.events.squats.points).toBe(76);
    expect(plan.events.plank.points).toBe(75);
    expect(plan.average).toBe(75.25);
    expect(plan.outcome).toBe("pass");
    expect(plan.status).toBe("calculator");
  });

  it("rounds down between chart rows and caps at 100", () => {
    const mile = tableFor("mile", joe);
    expect(scoreFor(mile, 520)).toBe(70);
    expect(scoreFor(mile, 521)).toBe(69); // a second slower drops a point
    expect(scoreFor(mile, 300)).toBe(100);
    expect(scoreFor(mile, 2000)).toBe(0);
    const push = tableFor("pushups", joe);
    expect(scoreFor(push, 200)).toBe(100);
    const plank = tableFor("plank", joe);
    expect(scoreFor(plank, 139)).toBe(75);
    expect(scoreFor(plank, 140)).toBe(76);
  });

  it("keeps the chart floors (plank 0:00 = 48, older push-up charts score 0 reps)", () => {
    expect(floorPoints(tableFor("plank", joe))).toBe(48);
    expect(floorPoints(tableFor("pushups", { age: 55, gender: "male", rank: "blue" }))).toBe(47);
    expect(floorPoints(tableFor("pushups", joe))).toBe(25);
    expect(floorPoints(tableFor("mile", joe))).toBe(0);
    expect(valueFor(tableFor("pushups", joe), 10)).toBe(0); // negative chart reps clamp to 0
    expect(valueFor(tableFor("plank", joe), 20)).toBe(0); // blank plank rows mean 0:00
  });
});

describe("planner", () => {
  it("splits points evenly when nothing is locked", () => {
    const plan = solve(joe, NO_LOCKS);
    expect(plan.status).toBe("balanced");
    expect(EVENT_IDS.map((id) => plan.events[id].points)).toEqual([75, 75, 75, 75]);
    expect(plan.events.mile.value).toBe(8 * 60 + 20);
    expect(plan.events.pushups.value).toBe(50);
    expect(plan.events.squats.value).toBe(73);
    expect(plan.events.plank.value).toBe(2 * 60 + 15);
    expect(plan.average).toBe(75);
  });

  it("lowers the auto events when a locked event goes up", () => {
    const plan = solve(joe, lock({ pushups: 65, mile: 8 * 60 + 40 }));
    expect(plan.events.pushups.points).toBe(90);
    expect(plan.events.mile.points).toBe(70);
    expect(plan.events.squats).toMatchObject({ locked: false, points: 70, value: 68 });
    expect(plan.events.plank).toMatchObject({ locked: false, points: 70, value: 110 });
    expect(plan.totalPoints).toBe(300);
  });

  it("hands out leftover points one at a time so the total is exact", () => {
    expect(distribute(226, [0, 0, 0].map(() => ({ lo: 0, hi: 100 })))).toEqual([76, 75, 75]);
    expect(distribute(150, [{ lo: 48, hi: 100 }, { lo: 0, hi: 100 }, { lo: 0, hi: 100 }])).toEqual([50, 50, 50]);
    expect(distribute(100, [{ lo: 48, hi: 100 }, { lo: 0, hi: 100 }])).toEqual([50, 50]);
    expect(distribute(60, [{ lo: 48, hi: 100 }, { lo: 0, hi: 100 }])).toEqual([48, 12]);
    expect(distribute(10, [{ lo: 48, hi: 100 }])).toEqual([48]);
    expect(distribute(500, [{ lo: 0, hi: 100 }])).toEqual([100]);
  });

  it("reports impossible plans with the best reachable average", () => {
    const plan = solve({ ...joe, rank: "brown" }, lock({ mile: 900, pushups: 0 }));
    expect(plan.status).toBe("impossible");
    expect(plan.events.squats.points).toBe(100);
    expect(plan.events.plank.points).toBe(100);
    expect(plan.average).toBe((0 + 25 + 100 + 100) / 4);
    expect(weakestLocked(plan)?.event).toBe("mile");
  });

  it("suggests the smallest fix to the weakest locked event", () => {
    // The design canvas example: 10:48 mile (38 pts) and 35 push-ups (60 pts) at Blue/Brown.
    const plan = solve(joe, lock({ mile: 648, pushups: 35 }));
    expect(plan.status).toBe("impossible");
    expect(plan.average).toBe(74.5);
    expect(plan.outcome).toBe("conditional");
    expect(impossibleFix(plan)).toEqual({ event: "mile", shortBy: 2, costPoints: 38, targetPoints: 40, targetValue: 640 });
    const fixed = solve(joe, lock({ mile: 640, pushups: 35 }));
    expect(fixed.status).toBe("balanced");
    expect(fixed.totalPoints).toBe(300);
  });

  it("says when one event can't close the gap alone", () => {
    // 0 + 25 + 2 locked, plank maxed at 100: 127 of 320, so the mile would need 193 points.
    const plan = solve({ ...joe, rank: "brown" }, lock({ mile: 900, pushups: 0, squats: 0 }));
    expect(impossibleFix(plan)).toMatchObject({ event: "mile", shortBy: 193, targetPoints: null, targetValue: null });
    // A 95-point gap on a 0-point mile is still fixable: a 7:00 mile.
    expect(impossibleFix(solve({ ...joe, rank: "brown" }, lock({ mile: 900, pushups: 0 })))).toMatchObject({ targetPoints: 95, targetValue: 420 });
    expect(impossibleFix(solve(joe, NO_LOCKS))).toBeNull();
  });

  it("lists what one event alone would need when all four are locked and short", () => {
    // Joe with a 9:20 mile: 60 + 80 + 76 + 75 = 291, 9 short of 300.
    const plan = solve(joe, lock({ mile: 560, pushups: 55, squats: 74, plank: 135 }));
    expect(plan.outcome).toBe("conditional");
    expect(passOptions(plan)).toEqual([
      { event: "mile", targetPoints: 69, targetValue: 524 }, // 8:44
      { event: "pushups", targetPoints: 89, targetValue: 64 },
      { event: "squats", targetPoints: 85, targetValue: 83 },
      { event: "plank", targetPoints: 84, targetValue: 180 }, // 3:00
    ]);
    for (const o of passOptions(plan)) {
      const fixed = solve(joe, { ...lock({ mile: 560, pushups: 55, squats: 74, plank: 135 }), [o.event]: o.targetValue });
      expect(fixed.totalPoints).toBe(300);
      expect(fixed.outcome).toBe("pass");
    }
    // An event that would need more than 100 is left out; passing or partly-auto plans get no options.
    // 15:00 mile = 0 pts, so 69 short: only the mile can cover that alone (80/76/75 + 69 > 100).
    const far = solve(joe, lock({ mile: 900, pushups: 55, squats: 74, plank: 135 }));
    expect(passOptions(far).map((o) => o.event)).toEqual(["mile"]);
    expect(passOptions(solve(joe, lock({ mile: 520, pushups: 55, squats: 74, plank: 135 })))).toEqual([]);
    expect(passOptions(solve(joe, lock({ mile: 560 })))).toEqual([]);
  });

  it("drops auto events to the chart floor when locked events carry the test", () => {
    const older: Profile = { age: 55, gender: "male", rank: "green-blue" };
    const plan = solve(older, lock({ mile: 7 * 60, pushups: 53 }));
    expect(plan.status).toBe("covered");
    expect(plan.events.squats).toMatchObject({ points: 25, value: 0 });
    expect(plan.events.plank).toMatchObject({ points: 48, value: 0 });
    expect(plan.outcome).toBe("pass");
  });

  it("re-scores locked values when the profile changes", () => {
    const locked = lock({ pushups: 55 });
    expect(solve(joe, locked).events.pushups.points).toBe(80);
    expect(solve({ ...joe, age: 45 }, locked).events.pushups.points).toBe(89);
  });
});

describe("nudge", () => {
  it("moves exactly one point per press, snapping times to chart rows", () => {
    const mile = tableFor("mile", joe);
    expect(nudge(mile, 518, 1)).toBe(516); // 8:38 (70) -> 8:36 (71)
    expect(nudge(mile, 518, -1)).toBe(524); // -> 8:44 (69)
    expect(nudge(mile, 390, 1)).toBe(386); // already 100: keep getting faster
    expect(nudge(mile, 900, -1)).toBe(904); // already 0: keep getting slower
    const plank = tableFor("plank", joe);
    expect(nudge(plank, 137, 1)).toBe(140);
    expect(nudge(plank, 137, -1)).toBe(130);
    expect(nudge(plank, 3, -1)).toBe(0);
    const push = tableFor("pushups", joe);
    expect(nudge(push, 0, -1)).toBe(0);
    expect(nudge(push, 80, 1)).toBe(81);
  });
});

describe("outcomes", () => {
  it("applies the 5-point grace band", () => {
    expect(outcomeFor(75, 75)).toBe("pass");
    expect(outcomeFor(74.75, 75)).toBe("conditional");
    expect(outcomeFor(70, 75)).toBe("conditional");
    expect(outcomeFor(69.75, 75)).toBe("retest");
  });
});

describe("input parsing and formatting", () => {
  it("reads times and reps", () => {
    expect(parseValue("mile", "8:40")).toBe(520);
    expect(parseValue("mile", "8.05")).toBe(485);
    expect(parseValue("mile", "9")).toBe(540);
    expect(parseValue("plank", "135")).toBe(135);
    expect(parseValue("plank", "2:75")).toBeNull();
    expect(parseValue("pushups", "55")).toBe(55);
    expect(parseValue("pushups", "5.5")).toBeNull();
    expect(parseValue("squats", "")).toBeNull();
    expect(formatTime(65)).toBe("1:05");
  });
});

describe("stored state", () => {
  it("drops anything malformed", () => {
    expect(sanitizeProfile({ age: 200, gender: "male", rank: "brown" })).toEqual({ age: 99, gender: "male", rank: "brown" });
    expect(sanitizeProfile({ age: 30, gender: "x", rank: "brown" })).toBeNull();
    expect(sanitizeProfile({ age: 30, gender: "female", rank: "black" })).toBeNull();
    expect(sanitizeLocked({ mile: 500.4, pushups: "lots", squats: -3 })).toEqual({
      mile: 500,
      pushups: null,
      squats: 0,
      plank: null,
    });
  });
});
