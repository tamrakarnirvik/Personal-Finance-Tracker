
import { isValidDateKey } from "@/lib/recurring-planning";

export const GOALS_STORAGE_KEY =
  "expense-tracker-goals-v1";

export const GOALS_CHANGE_EVENT =
  "expense-tracker-goals-changed";

export interface SavingsGoal {
  id: string;
  name: string;
  targetPaisa: number;
  openingPaisa: number;
  createdOn: string;
  deadlineOn: string | null;
}

export interface GoalMovement {
  id: string;
  goalId: string;
  kind: "add" | "release";
  amountPaisa: number;
  occurredOn: string;
  note: string;
}

export interface GoalWorkspace {
  version: 1;
  goals: SavingsGoal[];
  movements: GoalMovement[];
}

export const EMPTY_GOAL_WORKSPACE: GoalWorkspace = {
  version: 1,
  goals: [],
  movements: [],
};

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isPaisa(
  value: unknown,
  allowZero = false
): value is number {
  return (
    Number.isSafeInteger(value) &&
    (value as number) >= (allowZero ? 0 : 1)
  );
}

function isId(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    /^[A-Za-z0-9-]{1,90}$/.test(value)
  );
}

export function isSavingsGoal(
  value: unknown
): value is SavingsGoal {
  if (!isRecord(value)) return false;

  return (
    isId(value.id) &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    value.name.length <= 80 &&
    isPaisa(value.targetPaisa) &&
    isPaisa(value.openingPaisa, true) &&
    isValidDateKey(value.createdOn) &&
    (
      value.deadlineOn === null ||
      isValidDateKey(value.deadlineOn)
    ) &&
    (
      value.deadlineOn === null ||
      (value.deadlineOn as string) >=
        (value.createdOn as string)
    )
  );
}

export function isGoalMovement(
  value: unknown
): value is GoalMovement {
  if (!isRecord(value)) return false;

  return (
    isId(value.id) &&
    isId(value.goalId) &&
    (
      value.kind === "add" ||
      value.kind === "release"
    ) &&
    isPaisa(value.amountPaisa) &&
    isValidDateKey(value.occurredOn) &&
    typeof value.note === "string" &&
    value.note.length <= 160
  );
}

export function getGoalSavedPaisa(
  goal: SavingsGoal,
  movements: readonly GoalMovement[]
): number {
  return movements.reduce(
    (balance, movement) => {
      if (movement.goalId !== goal.id) {
        return balance;
      }

      return balance +
        (
          movement.kind === "add"
            ? movement.amountPaisa
            : -movement.amountPaisa
        );
    },
    goal.openingPaisa
  );
}

export function isGoalWorkspace(
  value: unknown
): value is GoalWorkspace {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !Array.isArray(value.goals) ||
    !Array.isArray(value.movements) ||
    !value.goals.every(isSavingsGoal) ||
    !value.movements.every(isGoalMovement)
  ) {
    return false;
  }

  const goals = value.goals as SavingsGoal[];

  const movements =
    value.movements as GoalMovement[];

  // Check duplicate IDs.

  if (
    new Set(
      goals.map((goal) => goal.id)
    ).size !== goals.length ||
    new Set(
      movements.map((movement) => movement.id)
    ).size !== movements.length
  ) {
    return false;
  }

  const goalById = new Map(
    goals.map((goal) => [
      goal.id,
      goal,
    ])
  );

  const balances = new Map(
    goals.map((goal) => [
      goal.id,
      goal.openingPaisa,
    ])
  );

  // Validate every movement in saved order.
  // This prevents negative intermediate balances.

  for (const movement of movements) {
    const goal = goalById.get(
      movement.goalId
    );

    if (
      !goal ||
      movement.occurredOn < goal.createdOn
    ) {
      return false;
    }

    const next =
      (balances.get(goal.id) ?? 0) +
      (
        movement.kind === "add"
          ? movement.amountPaisa
          : -movement.amountPaisa
      );

    if (
      !Number.isSafeInteger(next) ||
      next < 0
    ) {
      return false;
    }

    balances.set(
      goal.id,
      next
    );
  }

  return true;
}

export function parseGoalWorkspace(
  raw: string | null
): GoalWorkspace {
  if (raw === null) {
    return {
      version: 1,
      goals: [],
      movements: [],
    };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "Saved goals contain unreadable JSON. Nothing was overwritten."
    );
  }

  if (!isGoalWorkspace(parsed)) {
    throw new Error(
      "Saved goals or allocations are invalid. Nothing was overwritten."
    );
  }

  return parsed;
}

export function getGoalProgress(
  goal: SavingsGoal,
  movements: readonly GoalMovement[]
) {
  const savedPaisa = getGoalSavedPaisa(
    goal,
    movements
  );

  const remainingPaisa = Math.max(
    0,
    goal.targetPaisa - savedPaisa
  );

  const percent = Math.min(
    100,
    Math.floor(
      (savedPaisa / goal.targetPaisa) * 100
    )
  );

  return {
    savedPaisa,
    remainingPaisa,
    percent,
    achieved:
      savedPaisa >= goal.targetPaisa,
  };
}

export function applyGoalMovement(
  workspace: GoalWorkspace,
  movement: GoalMovement
): GoalWorkspace {
  if (
    !isGoalWorkspace(workspace) ||
    !isGoalMovement(movement)
  ) {
    throw new Error(
      "Invalid goal data or allocation."
    );
  }

  const goal = workspace.goals.find(
    (item) => item.id === movement.goalId
  );

  if (!goal) {
    throw new Error(
      "This goal no longer exists."
    );
  }

  if (
    workspace.movements.some(
      (item) => item.id === movement.id
    )
  ) {
    throw new Error(
      "Duplicate allocation ID."
    );
  }

  if (
    movement.occurredOn < goal.createdOn
  ) {
    throw new Error(
      "Allocation date is before goal creation."
    );
  }

  if (
    movement.kind === "release" &&
    movement.amountPaisa >
      getGoalSavedPaisa(
        goal,
        workspace.movements
      )
  ) {
    throw new Error(
      "You cannot release more than the amount allocated to this goal."
    );
  }

  const next: GoalWorkspace = {
    ...workspace,
    movements: [
      ...workspace.movements,
      movement,
    ],
  };

  if (!isGoalWorkspace(next)) {
    throw new Error(
      "The updated allocation is invalid."
    );
  }

  return next;
}
