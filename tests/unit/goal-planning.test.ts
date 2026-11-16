
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  EMPTY_GOAL_WORKSPACE,
  applyGoalMovement,
  getGoalProgress,
  isGoalWorkspace,
  parseGoalWorkspace,
  type SavingsGoal,
} from "../../lib/goal-planning";

const goal: SavingsGoal = {
  id: "goal-1",
  name: "Emergency fund",
  targetPaisa: 1000000,
  openingPaisa: 250000,
  createdOn: "2026-11-16",
  deadlineOn: "2027-06-01",
};

const workspace = {
  version: 1 as const,
  goals: [goal],
  movements: [],
};

describe("savings goals", () => {
  it("defaults to an empty workspace", () => {
    expect(
      parseGoalWorkspace(null)
    ).toEqual(
      EMPTY_GOAL_WORKSPACE
    );
  });

  it("calculates progress in integer paisa", () => {
    const progress =
      getGoalProgress(
        goal,
        []
      );

    expect(progress.percent).toBe(25);

    expect(
      progress.remainingPaisa
    ).toBe(750000);
  });

  it("records allocations and releases safely", () => {
    const added = applyGoalMovement(
      workspace,
      {
        id: "move-1",
        goalId: goal.id,
        kind: "add",
        amountPaisa: 150000,
        occurredOn: "2026-11-16",
        note: "Savings",
      }
    );

    const released = applyGoalMovement(
      added,
      {
        id: "move-2",
        goalId: goal.id,
        kind: "release",
        amountPaisa: 50000,
        occurredOn: "2026-11-16",
        note: "Adjustment",
      }
    );

    expect(
      getGoalProgress(
        goal,
        released.movements
      ).savedPaisa
    ).toBe(350000);
  });

  it("blocks releases larger than existing allocations", () => {
    expect(() =>
      applyGoalMovement(
        workspace,
        {
          id: "move-3",
          goalId: goal.id,
          kind: "release",
          amountPaisa: 250001,
          occurredOn: "2026-11-16",
          note: "",
        }
      )
    ).toThrow(/cannot release/i);
  });

  it("rejects orphan movement records", () => {
    const invalid = {
      ...workspace,

      movements: [
        {
          id: "orphan",
          goalId: "missing",
          kind: "add",
          amountPaisa: 100,
          occurredOn: "2026-11-16",
          note: "",
        },
      ],
    };

    expect(
      isGoalWorkspace(invalid)
    ).toBe(false);
  });

  it("rejects a release before sufficient allocation", () => {
    const wrongOrder = {
      ...workspace,

      movements: [
        {
          id: "release-first",
          goalId: goal.id,
          kind: "release",
          amountPaisa: 300000,
          occurredOn: "2026-11-16",
          note: "",
        },
        {
          id: "allocate-later",
          goalId: goal.id,
          kind: "add",
          amountPaisa: 300000,
          occurredOn: "2026-11-16",
          note: "",
        },
      ],
    };

    expect(
      isGoalWorkspace(wrongOrder)
    ).toBe(false);
  });

  it("rejects duplicate IDs and corrupted storage", () => {
    expect(
      isGoalWorkspace({
        ...workspace,
        goals: [
          goal,
          goal,
        ],
      })
    ).toBe(false);

    expect(() =>
      parseGoalWorkspace("{broken")
    ).toThrow(/unreadable/i);
  });
});
