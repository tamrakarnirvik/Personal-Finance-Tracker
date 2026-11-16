
"use client";

import {
  useState,
  type FormEvent,
} from "react";

import {
  Plus,
  Target,
  Trash2,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  formatNpr,
  parseNprToPaisa,
} from "@/lib/finance";

import {
  getLocalDateKey,
  isValidDateKey,
} from "@/lib/recurring-planning";

import {
  applyGoalMovement,
  getGoalProgress,
  type GoalMovement,
  type SavingsGoal,
} from "@/lib/goal-planning";

import { useGoals } from "@/components/goals/use-goals";

const field =
  "h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

function paisa(value: string): number {
  const result = parseNprToPaisa(
    value.trim()
  );

  if (
    !Number.isSafeInteger(result) ||
    result <= 0
  ) {
    throw new Error(
      "Enter an amount greater than zero."
    );
  }

  return result;
}

export function GoalsManager() {
  const {
    workspace,
    error: storageError,
    updateGoals,
  } = useGoals();

  const [name, setName] = useState("");
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [target, setTarget] = useState("");
  const [opening, setOpening] =
    useState("0");

  const [deadline, setDeadline] =
    useState("");

  const [selectedId, setSelectedId] =
    useState("");

  const [kind, setKind] =
    useState<GoalMovement["kind"]>("add");

  const [amount, setAmount] =
    useState("");

  const [note, setNote] =
    useState("");

  const [
    showAllHistory,
    setShowAllHistory,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const today = getLocalDateKey();

  // ======================================
  // CREATE OR EDIT GOAL
  // ======================================

  function createGoal(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setNotice("");

    try {
      const cleanName = name.trim();

      if (
        !cleanName ||
        cleanName.length > 80
      ) {
        throw new Error(
          "Enter a goal name up to 80 characters."
        );
      }

      const targetPaisa =
        paisa(target);

      const openingInput =
        opening.trim();

      const openingPaisa =
        openingInput === "" ||
        /^0+(?:\.0{1,2})?$/.test(
          openingInput
        )
          ? 0
          : parseNprToPaisa(
              openingInput
            );

      if (
        !Number.isSafeInteger(
          openingPaisa
        ) ||
        openingPaisa < 0
      ) {
        throw new Error(
          "Starting allocation cannot be negative."
        );
      }

      const oldGoal =
        workspace.goals.find(
          (goal) =>
            goal.id === editingId
        );

      if (
        deadline &&
        (
          !isValidDateKey(deadline) ||
          (
            deadline < today &&
            deadline !== oldGoal?.deadlineOn
          )
        )
      ) {
        throw new Error(
          "Choose a future date or today's date for the target."
        );
      }

      if (
        editingId &&
        !oldGoal
      ) {
        throw new Error(
          "Goal to edit no longer exists."
        );
      }

      // UPDATE EXISTING GOAL

      if (oldGoal) {
        updateGoals((current) => ({
          ...current,

          goals: current.goals.map(
            (goal) =>
              goal.id === oldGoal.id
                ? {
                    ...goal,
                    name: cleanName,
                    targetPaisa,
                    deadlineOn:
                      deadline || null,
                  }
                : goal
          ),
        }));

        setEditingId(null);
        setName("");
        setTarget("");
        setOpening("0");
        setDeadline("");

        setNotice(
          "Savings goal updated."
        );

        return;
      }

      // CREATE NEW GOAL

      const goal: SavingsGoal = {
        id: crypto.randomUUID(),
        name: cleanName,
        targetPaisa,
        openingPaisa,
        createdOn: today,
        deadlineOn:
          deadline || null,
      };

      updateGoals((current) => ({
        ...current,
        goals: [
          ...current.goals,
          goal,
        ],
      }));

      setEditingId(null);
      setName("");
      setTarget("");
      setOpening("0");
      setDeadline("");

      setNotice(
        "Savings goal created."
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not create goal."
      );
    }
  }

  // ======================================
  // RECORD ALLOCATION OR RELEASE
  // ======================================

  function recordMovement(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setNotice("");

    try {
      if (!selectedId) {
        throw new Error(
          "Choose a goal first."
        );
      }

      const movement: GoalMovement = {
        id: crypto.randomUUID(),
        goalId: selectedId,
        kind,
        amountPaisa: paisa(amount),
        occurredOn: today,
        note: note.trim().slice(0, 160),
      };

      updateGoals((current) =>
        applyGoalMovement(
          current,
          movement
        )
      );

      setAmount("");
      setNote("");

      setNotice(
        kind === "add"
          ? "Allocation recorded."
          : "Allocation released."
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to record allocation."
      );
    }
  }

  // ======================================
  // EDIT AND DELETE GOALS
  // ======================================

  function editGoal(
    goal: SavingsGoal
  ) {
    setEditingId(goal.id);
    setName(goal.name);

    setTarget(
      (
        goal.targetPaisa / 100
      ).toFixed(2)
    );

    setOpening(
      (
        goal.openingPaisa / 100
      ).toFixed(2)
    );

    setDeadline(
      goal.deadlineOn ?? ""
    );

    setError("");
    setNotice("");

    document
      .getElementById("goal-name")
      ?.focus();
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setTarget("");
    setOpening("0");
    setDeadline("");
  }

  function removeGoal(
    goal: SavingsGoal
  ) {
    const confirmed = window.confirm(
      `Delete "${goal.name}" and its allocation history? This does not change your accounts.`
    );

    if (!confirmed) return;

    try {
      updateGoals((current) => ({
        ...current,

        goals: current.goals.filter(
          (item) =>
            item.id !== goal.id
        ),

        movements:
          current.movements.filter(
            (item) =>
              item.goalId !== goal.id
          ),
      }));

      if (
        selectedId === goal.id
      ) {
        setSelectedId("");
      }

      if (
        editingId === goal.id
      ) {
        cancelEdit();
      }

      setNotice(
        "Goal deleted. No account balances were changed."
      );

      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not delete goal."
      );
    }
  }

  // ======================================
  // SUMMARY CALCULATIONS
  // ======================================

  const totalTarget =
    workspace.goals.reduce(
      (sum, goal) =>
        sum + goal.targetPaisa,
      0
    );

  const totalSaved =
    workspace.goals.reduce(
      (sum, goal) =>
        sum +
        getGoalProgress(
          goal,
          workspace.movements
        ).savedPaisa,
      0
    );

  const movementHistory = [
    ...workspace.movements,
  ].reverse();

  const recent = showAllHistory
    ? movementHistory
    : movementHistory.slice(0, 8);

  // ======================================
  // USER INTERFACE
  // ======================================

  return (
    <div className="space-y-6 pb-7">

      {/* SUMMARY CARDS */}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          [
            "Active goals",
            String(
              workspace.goals.length
            ),
          ],
          [
            "Combined target",
            formatNpr(totalTarget),
          ],
          [
            "Allocated so far",
            formatNpr(totalSaved),
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="clean-panel p-5"
          >
            <p className="text-xs text-muted-foreground">
              {label}
            </p>

            <p className="mt-2 wrap-break-word text-xl font-semibold tabular-nums">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">

        {/* GOAL EDITOR */}

        <section
          aria-label="Create savings goal"
          className="clean-panel space-y-4 p-5 sm:p-6"
        >
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Target
              size={19}
              className="text-primary"
            />

            {editingId
              ? "Edit savings goal"
              : "New savings goal"}
          </h2>

          <form
            className="space-y-4"
            onSubmit={createGoal}
          >
            <div className="space-y-1">
              <label
                htmlFor="goal-name"
                className="text-sm font-medium"
              >
                Goal name
              </label>

              <input
                id="goal-name"
                className={field}
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                maxLength={80}
                placeholder="Emergency fund, new laptop..."
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="goal-target"
                  className="text-sm font-medium"
                >
                  Target (NPR)
                </label>

                <input
                  id="goal-target"
                  className={field}
                  value={target}
                  onChange={(event) =>
                    setTarget(
                      event.target.value
                    )
                  }
                  inputMode="decimal"
                  placeholder="100000"
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="goal-opening"
                  className="text-sm font-medium"
                >
                  Already allocated (NPR)
                </label>

                <input
                  id="goal-opening"
                  className={field}
                  disabled={Boolean(
                    editingId
                  )}
                  value={opening}
                  onChange={(event) =>
                    setOpening(
                      event.target.value
                    )
                  }
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="goal-deadline"
                className="text-sm font-medium"
              >
                Target date (optional)
              </label>

              <input
                id="goal-deadline"
                type="date"
                className={field}
                min={
                  editingId
                    ? undefined
                    : today
                }
                value={deadline}
                onChange={(event) =>
                  setDeadline(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={Boolean(
                  storageError
                )}
              >
                <Plus size={16} />

                {editingId
                  ? "Save goal changes"
                  : "Create goal"}
              </Button>

              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEdit}
                >
                  Cancel edit
                </Button>
              )}
            </div>
          </form>
        </section>

        {/* GOAL PROGRESS LIST */}

        <section
          aria-label="Savings goal progress"
          className="clean-panel space-y-4 p-5 sm:p-6"
        >
          <h2 className="text-base font-semibold">
            Your goals
          </h2>

          {workspace.goals.length === 0 ? (
            <p className="py-5 text-sm text-muted-foreground">
              No goals yet. Create your first savings target.
            </p>
          ) : (
            workspace.goals.map((goal) => {
              const progress =
                getGoalProgress(
                  goal,
                  workspace.movements
                );

              return (
                <article
                  key={goal.id}
                  className="rounded-xl border border-border p-4"
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold">
                        {goal.name}
                      </h3>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {goal.deadlineOn
                          ? (
                              goal.deadlineOn <
                                today &&
                              !progress.achieved
                            )
                            ? `Target date passed: ${goal.deadlineOn}`
                            : `Target date: ${goal.deadlineOn}`
                          : "No target date"}
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        editGoal(goal)
                      }
                    >
                      Edit
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-label={`Delete goal ${goal.name}`}
                      disabled={Boolean(
                        storageError
                      )}
                      onClick={() =>
                        removeGoal(goal)
                      }
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>

                  <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
                    <span className="font-semibold tabular-nums">
                      {formatNpr(
                        progress.savedPaisa
                      )}{" "}
                      /{" "}
                      {formatNpr(
                        goal.targetPaisa
                      )}
                    </span>

                    <span className="text-muted-foreground">
                      {progress.percent}%
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[#146B55] transition-all duration-300"
                      style={{
                        width:
                          `${progress.percent}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {progress.achieved
                      ? "Target reached"
                      : `${formatNpr(
                          progress.remainingPaisa
                        )} remaining`}
                  </p>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => {
                      setSelectedId(
                        goal.id
                      );
                      setError("");
                    }}
                  >
                    Record allocation
                  </Button>
                </article>
              );
            })
          )}
        </section>
      </div>

      {/* ALLOCATION FORM */}

      <section
        aria-label="Goal allocations"
        className="clean-panel space-y-4 p-5 sm:p-6"
      >
        <h2 className="text-base font-semibold">
          Record an allocation or release
        </h2>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Allocations are planning records only.
          They do not move money, change account
          balances, or create income or expense
          transactions.
        </p>

        <form
          className="grid items-end gap-3 md:grid-cols-2 xl:grid-cols-5"
          onSubmit={recordMovement}
        >
          <div className="space-y-1 xl:col-span-2">
            <label
              htmlFor="allocation-goal"
              className="text-sm font-medium"
            >
              Goal
            </label>

            <select
              id="allocation-goal"
              className={field}
              required
              value={selectedId}
              onChange={(event) =>
                setSelectedId(
                  event.target.value
                )
              }
            >
              <option value="">
                Select goal
              </option>

              {workspace.goals.map(
                (goal) => (
                  <option
                    key={goal.id}
                    value={goal.id}
                  >
                    {goal.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="allocation-kind"
              className="text-sm font-medium"
            >
              Action
            </label>

            <select
              id="allocation-kind"
              className={field}
              value={kind}
              onChange={(event) =>
                setKind(
                  event.target.value as
                    GoalMovement["kind"]
                )
              }
            >
              <option value="add">
                Allocate
              </option>

              <option value="release">
                Release
              </option>
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="allocation-amount"
              className="text-sm font-medium"
            >
              Amount (NPR)
            </label>

            <input
              id="allocation-amount"
              className={field}
              value={amount}
              onChange={(event) =>
                setAmount(
                  event.target.value
                )
              }
              inputMode="decimal"
              required
              placeholder="5000"
            />
          </div>

          <Button
            type="submit"
            disabled={
              Boolean(storageError) ||
              workspace.goals.length === 0
            }
          >
            {kind === "add" ? (
              <ArrowDownToLine size={16} />
            ) : (
              <ArrowUpFromLine size={16} />
            )}

            Save
          </Button>

          <div className="space-y-1 md:col-span-2 xl:col-span-5">
            <label
              htmlFor="allocation-note"
              className="text-sm font-medium"
            >
              Note (optional)
            </label>

            <input
              id="allocation-note"
              className={field}
              value={note}
              onChange={(event) =>
                setNote(
                  event.target.value
                )
              }
              maxLength={160}
              placeholder="Monthly allocation..."
            />
          </div>
        </form>

        {/* ALLOCATION HISTORY */}

        {recent.length > 0 && (
          <div className="space-y-2 border-t border-border pt-4">
            <h3 className="text-sm font-medium">
              Recent allocations
            </h3>

            {recent.map((movement) => (
              <div
                key={movement.id}
                className="flex flex-wrap justify-between gap-2 text-sm"
              >
                <span>
                  {workspace.goals.find(
                    (goal) =>
                      goal.id === movement.goalId
                  )?.name ?? "Goal"}
                  {" · "}
                  {movement.kind}
                  {" · "}
                  {movement.occurredOn}

                  {movement.note
                    ? ` · ${movement.note}`
                    : ""}
                </span>

                <span className="font-medium tabular-nums">
                  {movement.kind === "release"
                    ? "−"
                    : "+"}
                  {formatNpr(
                    movement.amountPaisa
                  )}
                </span>
              </div>
            ))}

            {movementHistory.length > 8 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setShowAllHistory(
                    (current) => !current
                  )
                }
              >
                {showAllHistory
                  ? "Show fewer"
                  : `Show all ${movementHistory.length} allocations`}
              </Button>
            )}
          </div>
        )}
      </section>

      {/* ERROR AND STATUS */}

      {(storageError || error) && (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {storageError || error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="text-sm text-muted-foreground"
        >
          {notice}
        </p>
      )}
    </div>
  );
}
