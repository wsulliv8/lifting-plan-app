import React from "react";
import Modal from "../../common/Modal";
import { CheckIcon } from "@heroicons/react/20/solid";
import { useTheme } from "../../../context/useTheme";

const DayModal = ({ isOpen, onClose, day }) => {
  const { screenSize } = useTheme();
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        screenSize.isMobile
          ? `Day ${day.planDay}`
          : `Day ${day.planDay} - ${formatDate(day.date)}`
      }
      titleClassName="text-[var(--text-primary)] font-medium"
      className={
        screenSize.isMobile
          ? "w-full h-full m-0 rounded-none p-2"
          : "w-[95vw] max-w-4xl p-4"
      }
    >
      <div className={`space-y-4 ${screenSize.isMobile ? "p-2" : "p-4"}`}>
        {day.workouts.map((workout, workoutIndex) => (
          <div
            key={workoutIndex}
            className={`bg-[var(--surface)] rounded-lg shadow-sm ${
              screenSize.isMobile ? "" : "p-4"
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <h2
                className={`${screenSize.isMobile ? "text-base" : "text-lg"} font-semibold text-[var(--text-primary)]`}
              >
                {workout.name}
              </h2>
              {workout.completed_at && (
                <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
              )}
            </div>

            <div className="space-y-4">
              {workout.lifts.map((lift, liftIndex) => {
                const hasRPE = lift.rpe && lift.rpe.length > 0;

                return (
                  <div
                    key={liftIndex}
                    className={`bg-[var(--background)] rounded-lg ${
                      screenSize.isMobile ? "p-2" : "p-4"
                    } border border-[var(--border)]`}
                  >
                    <h3 className="font-medium mb-3 text-[var(--text-primary)] capitalize">
                      {lift.name}
                    </h3>

                    <div className="overflow-x-auto">
                      <div
                        className={`grid ${
                          hasRPE
                            ? "grid-cols-[auto_1fr_1fr_1fr]"
                            : "grid-cols-[auto_1fr_1fr]"
                        } gap-x-4 gap-y-2 min-w-[300px]`}
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

                        {Array.from({ length: lift.sets }).map(
                          (_, setIndex) => (
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
                          )
                        )}
                      </div>
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
