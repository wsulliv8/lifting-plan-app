import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { savePlan } from "../services/plans";
import progressionAlgorithm from "../utils/progressionAlgorithm";
import { stripIds } from "../utils/planUtils";
import chunk from "lodash/chunk";

export const usePlanActions = ({
  plan,
  setPlan,
  workouts,
  setWorkouts,
  totalDays,
  setTotalDays,
  workoutsRef,
  selectedDays,
  setSelectedDays,
  duplicateFormData,
  setDuplicateFormData,
  setShowDuplicateForm,
  clipboard,
  setClipboard,
  setContextMenu,
  setShowCopiedMessage,
  setShowGroupForm,
  setGroupName,
  setGroupColor,
  groupName,
  groupColor,
  userLiftsData,
  weeksLength,
  editingDay,
  setEditingDay,
  setIsModalOpen,
}) => {
  const handleDuplicateConfirm = useCallback(() => {
    setWorkouts((prevWorkouts) => {
      const updatedWorkouts = new Map(prevWorkouts);
      let newTotalDays = totalDays;
      const userLiftsMap = new Map(
        userLiftsData.map((data) => [data.base_lift_id, data])
      );
      const generateUniqueId = () => uuidv4();

      // Track group updates
      const updatedGroups = plan.dayGroups ? [...plan.dayGroups] : [];
      const newTargetDayIds = []; // Collect all targetDayIds

      if (selectedDays.length === 1) {
        const sourceDayId = selectedDays[0];
        const sourceWorkouts = Array.from(prevWorkouts.values()).filter(
          (w) => w.dayId === sourceDayId
        );
        const { selectedWeekDays, startWeek, endWeek } = duplicateFormData;

        // Find source day's group
        const sourceGroupIndex = updatedGroups.findIndex((group) =>
          group.dayIds.includes(sourceDayId)
        );
        const sourceGroup =
          sourceGroupIndex !== -1 ? updatedGroups[sourceGroupIndex] : null;

        if (
          selectedWeekDays.length === 0 ||
          startWeek < 1 ||
          endWeek < startWeek
        ) {
          console.warn("Invalid duplication parameters");
          return prevWorkouts;
        }

        let sessionIndex = 1;
        for (let week = startWeek - 1; week < endWeek; week++) {
          selectedWeekDays.forEach((dayIndex) => {
            const targetDayId = week * 7 + dayIndex;
            if (targetDayId >= newTotalDays) {
              newTotalDays = Math.ceil((targetDayId + 1) / 7) * 7;
            }
            // Collect targetDayId for group update
            if (sourceGroup && !newTargetDayIds.includes(targetDayId)) {
              newTargetDayIds.push(targetDayId);
            }
            if (duplicateFormData.overwriteExisting) {
              prevWorkouts.forEach((workout) => {
                if (workout.dayId === targetDayId) {
                  updatedWorkouts.delete(workout.id);
                }
              });
            }
            sourceWorkouts.forEach((workout) => {
              const newLifts = duplicateFormData.autoProgress
                ? workout.lifts.map((lift) => ({
                    ...progressionAlgorithm.applyProgressionRule(
                      lift,
                      sessionIndex,
                      userLiftsMap.get(lift.base_lift_id)
                    ),
                    id: generateUniqueId(),
                    progressionRule: lift.progressionRule || "none",
                  }))
                : workout.lifts.map((lift) => ({
                    ...lift,
                    id: generateUniqueId(),
                    progressionRule: lift.progressionRule || "none",
                  }));
              const newWorkout = {
                ...workout,
                id: generateUniqueId(),
                dayId: targetDayId,
                lifts: newLifts,
              };
              updatedWorkouts.set(newWorkout.id, newWorkout);
              sessionIndex++;
              // Add targetDayId to source group
              // Update source group with all targetDayIds
              if (sourceGroup && newTargetDayIds.length > 0) {
                updatedGroups[sourceGroupIndex] = {
                  ...sourceGroup,
                  dayIds: [
                    ...sourceGroup.dayIds,
                    ...newTargetDayIds.filter(
                      (id) => !sourceGroup.dayIds.includes(id)
                    ),
                  ],
                };
                console.log(
                  "Updated group dayIds:",
                  updatedGroups[sourceGroupIndex].dayIds
                );
              }
            });
          });
        }
      } else if (selectedDays.length > 1) {
        const { repeatCount, overwriteExisting } = duplicateFormData;
        if (repeatCount < 1) {
          console.warn("Invalid repeat count");
          return prevWorkouts;
        }

        const lastSelectedDayId = Math.max(...selectedDays);
        const insertionPoint = lastSelectedDayId + 1;
        const totalNewDays = selectedDays.length * repeatCount;

        const maxTargetDayId = insertionPoint + totalNewDays - 1;
        if (maxTargetDayId >= newTotalDays) {
          newTotalDays = Math.ceil((maxTargetDayId + 1) / 7) * 7;
        }

        let currentDayId = insertionPoint;
        for (let i = 0; i < repeatCount; i++) {
          selectedDays.forEach((sourceDayId, dayIndex) => {
            const sourceWorkouts = Array.from(prevWorkouts.values()).filter(
              (w) => w.dayId === sourceDayId
            );

            // Find source day's group
            const sourceGroupIndex = updatedGroups.findIndex((group) =>
              group.dayIds.includes(sourceDayId)
            );
            const sourceGroup =
              sourceGroupIndex !== -1 ? updatedGroups[sourceGroupIndex] : null;

            if (overwriteExisting) {
              prevWorkouts.forEach((workout) => {
                if (workout.dayId === currentDayId) {
                  updatedWorkouts.delete(workout.id);
                }
              });
            }

            sourceWorkouts.forEach((workout) => {
              const newLifts = duplicateFormData.autoProgress
                ? workout.lifts.map((lift) => ({
                    ...progressionAlgorithm.applyProgressionRule(
                      lift,
                      i + 1, //* selectedDays.length + dayIndex,
                      userLiftsMap.get(lift.base_lift_id)
                    ),
                    id: generateUniqueId(),
                    progressionRule: lift.progressionRule || "none",
                  }))
                : workout.lifts.map((lift) => ({
                    ...lift,
                    id: generateUniqueId(),
                    progressionRule: lift.progressionRule || "none",
                  }));
              const newWorkout = {
                ...workout,
                id: generateUniqueId(),
                dayId: currentDayId,
                lifts: newLifts,
              };
              updatedWorkouts.set(newWorkout.id, newWorkout);
            });
            // Add targetDayId to source group
            if (sourceGroup && !sourceGroup.dayIds.includes(currentDayId)) {
              updatedGroups[sourceGroupIndex] = {
                ...sourceGroup,
                dayIds: [...sourceGroup.dayIds, currentDayId],
              };
            }
            currentDayId++;
          });
        }
      }

      // Update plan with new groups
      if (updatedGroups.length > 0) {
        setPlan((prevPlan) => ({
          ...prevPlan,
          dayGroups: updatedGroups,
        }));
      }

      setTotalDays(newTotalDays);
      return new Map(updatedWorkouts);
    });

    setShowDuplicateForm(false);
    setDuplicateFormData({
      selectedWeekDays: [],
      startWeek: 1,
      endWeek: weeksLength,
      repeatCount: 1,
      overwriteExisting: false,
      autoProgress: true,
    });
    setSelectedDays([]);
  }, [
    selectedDays,
    setSelectedDays,
    duplicateFormData,
    setDuplicateFormData,
    totalDays,
    setTotalDays,
    weeksLength,
    userLiftsData,
    setWorkouts,
    setShowDuplicateForm,
    plan.dayGroups,
    setPlan,
  ]);

  const handleCopy = useCallback(
    (dayIds) => {
      const daysToCopy = Array.isArray(dayIds) ? dayIds : [dayIds];
      const copiedData = daysToCopy.map((dayId) => ({
        dayId,
        workouts: Array.from(workouts.values()).filter(
          (w) => w.dayId === dayId
        ),
      }));
      setClipboard(copiedData);
      setSelectedDays([]);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    },
    [workouts, setClipboard, setSelectedDays, setShowCopiedMessage]
  );

  const handlePaste = useCallback(
    (startDayId) => {
      setWorkouts((prevWorkouts) => {
        const updatedWorkouts = new Map(prevWorkouts);
        let newTotalDays = totalDays;
        const userLiftsMap = new Map(
          userLiftsData.map((data) => [data.base_lift_id, data])
        );
        const generateUniqueId = () => uuidv4();

        const maxTargetDayId = startDayId + clipboard.length - 1;
        if (maxTargetDayId >= newTotalDays) {
          newTotalDays = Math.ceil((maxTargetDayId + 1) / 7) * 7;
        }

        clipboard.forEach((clip, index) => {
          const targetDayId = startDayId + index;

          clip.workouts.forEach((workout) => {
            const newLifts = workout.lifts.map((lift) => ({
              ...progressionAlgorithm.applyProgressionRule(
                lift,
                index,
                userLiftsMap.get(lift.base_lift_id)
              ),
              id: generateUniqueId(),
              progressionRule: lift.progressionRule || "none",
            }));
            const newWorkout = {
              ...workout,
              id: generateUniqueId(),
              dayId: targetDayId,
              lifts: newLifts,
            };
            updatedWorkouts.set(newWorkout.id, newWorkout);
          });
        });

        setTotalDays(newTotalDays);
        return new Map(updatedWorkouts);
      });

      setClipboard([]);
      setContextMenu(null);
    },
    [
      clipboard,
      totalDays,
      userLiftsData,
      setWorkouts,
      setTotalDays,
      setClipboard,
      setContextMenu,
    ]
  );

  const handleSave = useCallback(async () => {
    const dayMap = Array.from({ length: totalDays }, () => []);

    workoutsRef.current.forEach((workout) => {
      if (workout.dayId < totalDays) {
        dayMap[workout.dayId].push(workout);
      }
    });

    const weeks = chunk(dayMap, 7);

    let current_workout_id = null;

    const weeksData = weeks.map((weekDays, weekIndex) => ({
      week_number: weekIndex + 1,
      id: plan.weeks[weekIndex]?.id,
      days: weekDays.map((dayWorkouts, dayIndex) => {
        const sortedWorkouts = dayWorkouts.sort(
          (a, b) => (a.order || 0) - (b.order || 0)
        );

        // Set the first workout ID if we haven't already
        if (!current_workout_id && sortedWorkouts.length > 0) {
          current_workout_id = sortedWorkouts[0].id;
        }

        // Get the existing day ID from the plan if it exists
        const existingDay = plan.weeks[weekIndex]?.days[dayIndex];

        return {
          id: existingDay?.id,
          day_of_week: dayIndex,
          workouts: sortedWorkouts.map((w) => ({
            id: w.id,
            name: w.name,
            lifts: w.lifts.map((lift) => ({
              id: lift.id,
              name: lift.name,
              sets: lift.sets,
              reps: lift.reps,
              weight: lift.weight,
              rpe: lift.rpe,
              rest: lift.rest,
              base_lift_id: lift.base_lift_id,
              progression_rule: lift.progressionRule,
            })),
          })),
        };
      }),
    }));

    const rebuiltPlan = {
      ...plan,
      weeks: weeksData,
      current_workout_id,
    };

    setPlan(rebuiltPlan);
    await savePlan(rebuiltPlan);
  }, [plan, totalDays, workoutsRef, setPlan]);

  const handleGroupConfirm = useCallback(() => {
    const newGroup = {
      id: Date.now(),
      name: groupName.trim(),
      dayIds: selectedDays,
      color: groupColor,
    };
    const updatedPlan = {
      ...plan,
      dayGroups: [...(plan.dayGroups || []), newGroup],
    };
    setPlan(updatedPlan);
    setShowGroupForm(false);
    setGroupName("");
    setGroupColor("#4f46e5");
    setSelectedDays([]);
  }, [
    groupName,
    groupColor,
    selectedDays,
    plan,
    setPlan,
    setShowGroupForm,
    setGroupName,
    setGroupColor,
    setSelectedDays,
  ]);

  const saveEditedWorkouts = useCallback(
    (newWorkouts) => {
      setWorkouts((prevWorkouts) => {
        const updatedWorkouts = new Map(prevWorkouts);
        // Remove old workouts for this day
        prevWorkouts.forEach((workout) => {
          if (workout.dayId === editingDay.dayId) {
            updatedWorkouts.delete(workout.id);
          }
        });
        // Add new workouts with preserved RPE and Rest arrays, and handle temp IDs
        newWorkouts.forEach((workout) => {
          const workoutId = String(workout.id)?.startsWith("temp_")
            ? undefined
            : workout.id;
          const workoutWithPreservedData = {
            ...workout,
            id: workoutId || `${Date.now()}_${Math.random()}`, // Generate new ID if temp
            dayId: editingDay.dayId,
            lifts:
              workout.lifts?.map((lift) => ({
                ...lift,
                id: String(lift.id)?.startsWith("temp_") ? undefined : lift.id,
                rpe: lift.rpe || [],
                rest: lift.rest || [],
                // Keep showRPE true if we have RPE values
                showRPE: lift.showRPE || (lift.rpe && lift.rpe.length > 0),
                // Keep showRest true if we have Rest values
                showRest: lift.showRest || (lift.rest && lift.rest.length > 0),
              })) || [],
          };
          updatedWorkouts.set(
            workoutWithPreservedData.id,
            workoutWithPreservedData
          );
        });
        return new Map(updatedWorkouts);
      });
      setEditingDay(null);
    },
    [editingDay, setWorkouts, setEditingDay]
  );

  const handleDeleteWeek = useCallback(
    (weekIndex, e) => {
      e.stopPropagation();
      const deletedStart = weekIndex * 7;
      const deletedEnd = deletedStart + 6;

      setWorkouts((prevWorkouts) => {
        const updatedWorkouts = new Map(prevWorkouts);
        prevWorkouts.forEach((workout) => {
          if (workout.dayId < deletedStart || workout.dayId > deletedEnd) {
            if (workout.dayId > deletedEnd) {
              updatedWorkouts.set(workout.id, {
                ...workout,
                dayId: workout.dayId - 7,
              });
            } else {
              updatedWorkouts.set(workout.id, workout);
            }
          } else {
            updatedWorkouts.delete(workout.id);
          }
        });
        return new Map(updatedWorkouts);
      });

      setTotalDays((prev) => Math.max(0, prev - 7));
    },
    [setWorkouts, setTotalDays]
  );

  const handleEditWorkout = useCallback(
    (dayId) => {
      const dayWorkouts = Array.from(workoutsRef.current.values())
        .filter((workout) => workout.dayId === dayId)
        .map((workout) => ({
          ...workout,
          lifts:
            workout.lifts?.map((lift) => ({
              ...lift,
              rpe: lift.rpe || [],
              rest: lift.rest || [],
              // Set showRPE to true if either it was previously true or if there are RPE values
              showRPE: lift.showRPE || (lift.rpe && lift.rpe.length > 0),
              // Set showRest to true if either it was previously true or if there are Rest values
              showRest: lift.showRest || (lift.rest && lift.rest.length > 0),
            })) || [],
        }));

      console.log("Setting editingDay with workouts:", dayWorkouts);
      setEditingDay({
        dayId,
        workouts: dayWorkouts,
      });
    },
    [workoutsRef, setEditingDay]
  );

  const handleSubmit = useCallback(
    async (e, formInputs) => {
      e.preventDefault();
      const updatedPlan = {
        ...plan,
        name: formInputs.name,
        goal: formInputs.goal,
        categories: formInputs.categories,
        difficulty: formInputs.difficulty,
        description: formInputs.description,
      };
      try {
        await savePlan(stripIds(updatedPlan));
        setPlan(updatedPlan);

        setIsModalOpen(false);
      } catch (error) {
        console.error("savePlan failed:", error);
      }
    },
    [plan, setPlan, setIsModalOpen]
  );

  return {
    handleDuplicateConfirm,
    handleCopy,
    handlePaste,
    handleSave,
    handleGroupConfirm,
    saveEditedWorkouts,
    handleDeleteWeek,
    handleEditWorkout,
    handleSubmit,
  };
};
