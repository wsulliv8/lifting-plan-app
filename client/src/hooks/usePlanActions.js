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

      if (selectedDays.length === 1) {
        const sourceDayId = selectedDays[0];
        const sourceWorkouts = Array.from(prevWorkouts.values()).filter(
          (w) => w.dayId === sourceDayId
        );
        const { selectedWeekDays, startWeek, endWeek } = duplicateFormData;

        if (
          selectedWeekDays.length === 0 ||
          startWeek < 1 ||
          endWeek < startWeek
        ) {
          console.warn("Invalid duplication parameters");
          return prevWorkouts;
        }

        let sessionIndex = 0;
        for (let week = startWeek - 1; week < endWeek; week++) {
          selectedWeekDays.forEach((dayIndex) => {
            const targetDayId = week * 7 + dayIndex;
            if (targetDayId >= newTotalDays) {
              newTotalDays = Math.ceil((targetDayId + 1) / 7) * 7;
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
                      i * selectedDays.length + dayIndex,
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
            currentDayId++;
          });
        }
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
    const rebuiltPlan = {
      ...plan,
      weeks: weeks.map((weekDays, weekIndex) => ({
        week_number: weekIndex + 1,
        days: weekDays.map((dayWorkouts, dayIndex) => ({
          day_of_week: dayIndex,
          workouts: dayWorkouts
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((w) => ({
              id: w.id,
              name: w.name,
              lifts: w.lifts.map((lift) => ({
                id: lift.id,
                name: lift.name,
                sets: lift.sets,
                reps: lift.reps,
                weight: lift.weight,
                base_lift_id: lift.base_lift_id,
                progression_rule: lift.progressionRule,
              })),
            })),
        })),
      })),
    };
    setPlan(rebuiltPlan);
    await savePlan(stripIds(rebuiltPlan));
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
        prevWorkouts.forEach((workout) => {
          if (workout.dayId === editingDay.dayId) {
            updatedWorkouts.delete(workout.id);
          }
        });
        newWorkouts.forEach((workout) => {
          updatedWorkouts.set(workout.id, workout);
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
      setEditingDay({
        dayId,
        workouts: Array.from(workoutsRef.current.values()).filter(
          (workout) => workout.dayId === dayId
        ),
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
