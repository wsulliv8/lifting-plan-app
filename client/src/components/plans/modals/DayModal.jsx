import React from "react";
import Modal from "../../common/Modal";
import { CheckIcon } from "@heroicons/react/20/solid";

const DayModal = ({ isOpen, onClose, day }) => {
  if (!day) return null;

  const getValueColor = (achieved, target, isRPE = false) => {
    if (achieved === undefined || achieved === null)
      return "text-[var(--text-secondary)]";

    const achievedNum = parseInt(achieved);
    const targetNum = parseInt(target);

    if (isNaN(achievedNum) || isNaN(targetNum))
      return "text-[var(--text-secondary)]";

    if (isRPE) {
      if (achievedNum > targetNum) return "text-[var(--danger)]";
      if (achievedNum < targetNum) return "text-[var(--primary)]";
    } else {
      if (achievedNum < targetNum) return "text-[var(--danger)]";
      if (achievedNum > targetNum) return "text-[var(--primary)]";
    }
    return "text-[var(--text-primary)]";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Day ${day.planDay}`}
      titleClassName="text-[var(--text-primary)] font-medium"
      className="w-[95vw] max-w-4xl"
    >
      <div className="space-y-6 p-4">
        {day.workouts.map((workout, workoutIndex) => (
          <div
            key={workoutIndex}
            className="bg-[var(--surface)] rounded-lg p-4  shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {workout.name}
              </h2>
              {workout.completed_at && (
                <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
              )}
            </div>

            <div className="space-y-4">
              {workout.lifts.map((lift, liftIndex) => {
                // Check if lift has RPE data
                const hasRPE = lift.rpe && lift.rpe.length > 0;

                return (
                  <div
                    key={liftIndex}
                    className="bg-[var(--background)] rounded-lg p-4 border border-[var(--border)]"
                  >
                    <h3 className="font-medium mb-3 text-[var(--text-primary)] capitalize">
                      {lift.name}
                    </h3>

                    <div
                      className={`grid ${
                        hasRPE
                          ? "grid-cols-[auto_1fr_1fr_1fr]"
                          : "grid-cols-[auto_1fr_1fr]"
                      } gap-x-4 gap-y-2`}
                    >
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        Set
                      </div>
                      <div className="text-sm font-medium text-center text-[var(--text-primary)]">
                        Reps
                      </div>
                      <div className="text-sm font-medium text-center text-[var(--text-primary)]">
                        Weight
                      </div>
                      {hasRPE && (
                        <div className="text-sm font-medium text-center text-[var(--text-primary)]">
                          RPE
                        </div>
                      )}

                      {Array.from({ length: lift.sets }).map((_, setIndex) => (
                        <React.Fragment key={setIndex}>
                          <div className="flex items-center justify-center text-[var(--text-secondary)]">
                            {setIndex + 1}
                          </div>
                          <div className="grid grid-cols-2 text-center gap-x-1">
                            <span className="text-[var(--text-secondary)]">
                              {lift.reps[setIndex]}
                            </span>
                            <span
                              className={getValueColor(
                                lift.reps_achieved?.[setIndex],
                                lift.reps[setIndex]
                              )}
                            >
                              {lift.reps_achieved?.[setIndex] || "-"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 text-center gap-x-1">
                            <span className="text-[var(--text-secondary)]">
                              {lift.weight[setIndex]}
                            </span>
                            <span
                              className={getValueColor(
                                lift.weight_achieved?.[setIndex],
                                lift.weight[setIndex]
                              )}
                            >
                              {lift.weight_achieved?.[setIndex] || "-"}
                            </span>
                          </div>
                          {hasRPE && (
                            <div className="grid grid-cols-2 text-center gap-x-1">
                              <span className="text-[var(--text-secondary)]">
                                {lift.rpe[setIndex]}
                              </span>
                              <span
                                className={getValueColor(
                                  lift.rpe_achieved?.[setIndex],
                                  lift.rpe[setIndex],
                                  true
                                )}
                              >
                                {lift.rpe_achieved?.[setIndex] || "-"}
                              </span>
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {lift.notes && (
                      <div className="mt-4 text-sm text-[var(--text-secondary)] bg-[var(--surface)] p-2 rounded">
                        {lift.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default DayModal;
