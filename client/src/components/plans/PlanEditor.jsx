import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import { useLoaderData, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  DndContext,
  rectIntersection,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import Day from "./Day";
import Workout from "./Workout";
import Modal from "../common/Modal";
import WorkoutEditor from "./WorkoutEditor";
import Toast from "./Toast";
import Button from "../common/Button";
import PlanSettingsForm from "../forms/PlanSettingsForm";
import { savePlan } from "../../services/plans";
import { applyProgressionRule } from "../../utils/progressionAlgorithms";
import {
  PlusCircleIcon,
  TrashIcon,
  ArrowLeftIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/solid";
import chunk from "lodash/chunk";

const EMPTY_WORKOUTS = [];

const PlanEditor = () => {
  const {
    plan: initialPlan,
    baseLifts,
    userLiftsData,
    currentUser,
  } = useLoaderData();
  const [plan, setPlan] = useState({ ...initialPlan, dayGroups: [] });
  const [workouts, setWorkouts] = useState(() => {
    const initialWorkouts = new Map();
    initialPlan.weeks.forEach((week, weekIndex) => {
      week.days.forEach((day, dayIndex) => {
        day.workouts.forEach((workout) => {
          initialWorkouts.set(workout.id, {
            ...workout,
            dayId: weekIndex * 7 + dayIndex,
          });
        });
      });
    });
    return initialWorkouts;
  });

  const workoutsRef = useRef(workouts);
  useEffect(() => {
    workoutsRef.current = workouts;
  }, [workouts]);

  const [totalDays, setTotalDays] = useState(() => plan.weeks.length * 7);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [collapsedWeeks, setCollapsedWeeks] = useState(new Set());
  const [collapsedDays, setCollapsedDays] = useState(Array(7).fill(false));
  const [editingDay, setEditingDay] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupColor, setGroupColor] = useState("#4f46e5");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDuplicateForm, setShowDuplicateForm] = useState(false);
  const [duplicateFormData, setDuplicateFormData] = useState({
    selectedWeekDays: [],
    startWeek: 1,
    endWeek: 1,
    repeatCount: 1,
    overwriteExisting: false,
  });
  const [clipboard, setClipboard] = useState([]); // [{ dayId, workouts }]
  const [contextMenu, setContextMenu] = useState(null); // { x, y, dayId }
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const contextMenuRef = useRef(null); // Ref for context menu

  const navigate = useNavigate();
  const [formInputs, setFormInputs] = useState({
    name: plan.name ? plan.name : "New Plan",
    goal: plan.goal,
    categories: plan.categories || [],
    difficulty: plan.difficulty,
    description: plan.description,
  });

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 1 },
  });
  const sensors = useSensors(pointerSensor);

  const weeks = useMemo(() => {
    const days = Array.from({ length: totalDays }, (_, i) => i);
    return chunk(days, 7);
  }, [totalDays]);

  const workoutsByDay = useMemo(() => {
    const map = new Map();
    workouts.forEach((workout) => {
      const dayId = workout.dayId;
      if (!map.has(dayId)) {
        map.set(dayId, []);
      }
      map.get(dayId).push(workout);
    });
    return map;
  }, [workouts]);

  const gridStyle = useMemo(() => {
    return {
      gridTemplateColumns: `2rem ${Array(7)
        .fill()
        .map((_, i) => (collapsedDays[i] ? "2rem" : "minmax(6rem, 1fr)"))
        .join(" ")}`,
      gridTemplateRows: `2rem ${weeks
        .map((_, weekIndex) =>
          collapsedWeeks.has(weekIndex) ? "2rem" : "minmax(7rem, auto)"
        )
        .join(" ")}`,
    };
  }, [weeks, collapsedWeeks, collapsedDays]);

  useEffect(() => {
    if (isModalOpen) {
      setFormInputs({
        name: plan.name || "New Plan",
        goal: plan.goal || "",
        categories: plan.categories || [],
        difficulty: plan.difficulty || "",
        description: plan.description || "",
      });
    }
  }, [isModalOpen, plan]);

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
  }, [groupName, groupColor, selectedDays, plan]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleCategoriesChange = useCallback((selectedCategories) => {
    setFormInputs((prev) => ({
      ...prev,
      categories: selectedCategories,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const updatedPlan = {
        ...plan,
        name: formInputs.name,
        goal: formInputs.goal,
        categories: formInputs.categories,
        difficulty: formInputs.difficulty,
        description: formInputs.description,
      };
      setPlan(updatedPlan);
      await savePlan(stripIds(updatedPlan));
      setIsModalOpen(false);
    },
    [formInputs, plan]
  );

  const toggleWeekCollapse = useCallback((weekIndex) => {
    setCollapsedWeeks((prev) => {
      const newCollapsedWeeks = new Set(prev);
      if (newCollapsedWeeks.has(weekIndex)) {
        newCollapsedWeeks.delete(weekIndex);
      } else {
        newCollapsedWeeks.add(weekIndex);
      }
      return newCollapsedWeeks;
    });
  }, []);

  const toggleDayCollapse = useCallback((dayIndex) => {
    setCollapsedDays((prev) => {
      const newCollapsedDays = [...prev];
      newCollapsedDays[dayIndex] = !newCollapsedDays[dayIndex];
      return newCollapsedDays;
    });
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setActiveWorkout(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;
    const isActiveAWorkout = active.data.current?.type === "Workout";

    if (!isActiveAWorkout) {
      setActiveWorkout(null);
      return;
    }

    const currentWorkouts = new Map(workoutsRef.current);
    const activeWorkout = currentWorkouts.get(activeId);
    if (!activeWorkout) {
      setActiveWorkout(null);
      return;
    }

    if (over.data.current?.type === "Workout") {
      const overWorkout = currentWorkouts.get(overId);
      if (!overWorkout) {
        setActiveWorkout(null);
        return;
      }

      if (activeWorkout.dayId !== overWorkout.dayId) {
        currentWorkouts.set(activeId, {
          ...activeWorkout,
          dayId: overWorkout.dayId,
        });
        setWorkouts(new Map(currentWorkouts));
      }
    } else if (over.data.current?.type === "Day") {
      const targetDayId = overId;
      if (activeWorkout.dayId !== targetDayId) {
        currentWorkouts.set(activeId, {
          ...activeWorkout,
          dayId: targetDayId,
        });
        setWorkouts(new Map(currentWorkouts));
      }
    }
    setActiveWorkout(null);
  }, []);

  const handleEditWorkout = useCallback((dayId) => {
    setEditingDay({
      dayId,
      workouts: Array.from(workoutsRef.current.values()).filter(
        (workout) => workout.dayId === dayId
      ),
    });
  }, []);

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
    [editingDay]
  );

  const stripIds = useCallback((plan) => {
    return {
      ...plan,
      weeks: plan.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) => ({
          ...day,
          workouts: day.workouts.map((workout) => {
            const { id: _workoutId, ...workoutWithoutId } = workout;
            return {
              ...workoutWithoutId,
              lifts: workout.lifts.map((lift) => {
                const { id: _liftId, ...liftWithoutId } = lift;
                return {
                  ...liftWithoutId,
                  reps: liftWithoutId.reps.map((num) => num.toString()),
                };
              }),
            };
          }),
        })),
      })),
    };
  }, []);

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
              })),
            })),
        })),
      })),
    };

    setPlan(rebuiltPlan);
    await savePlan(stripIds(rebuiltPlan));
  }, [plan, totalDays, stripIds]);

  const handleDeleteWeek = useCallback((weekIndex, e) => {
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
  }, []);

  const headerDays = useMemo(() => {
    return Array(7)
      .fill()
      .map((_, dayIndex) => (
        <div
          key={`header-day-${dayIndex}`}
          className={`bg-gray-50 p-1 font-medium cursor-pointer hover:bg-gray-200 place-self-center w-full rounded text-center sticky -top-2 z-10 ${
            collapsedDays[dayIndex] ? "text-gray-400" : "text-gray-800"
          }`}
          onClick={() => toggleDayCollapse(dayIndex)}
        >
          {!collapsedDays[dayIndex] ? "Day" : ""} {dayIndex + 1}
        </div>
      ));
  }, [collapsedDays, toggleDayCollapse]);

  const handleDragStart = useCallback((event) => {
    if (event.active.data.current?.workout) {
      setActiveWorkout(event.active.data.current.workout);
    }
  }, []);

  const selectDay = useCallback((dayIds) => {
    setSelectedDays((prev) => {
      const current = new Set(prev);
      const idsToToggle = Array.isArray(dayIds) ? dayIds : [dayIds];
      idsToToggle.forEach((id) => {
        if (current.has(id)) {
          current.delete(id);
        } else {
          current.add(id);
        }
      });
      return Array.from(current);
    });
  }, []);

  // Duplication Logic
  const handleDuplicateConfirm = useCallback(() => {
    setWorkouts((prevWorkouts) => {
      const updatedWorkouts = new Map(prevWorkouts);
      let newTotalDays = totalDays;
      const userLiftsMap = new Map(
        userLiftsData.map((data) => [data.base_lift_id, data])
      );

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
              newTotalDays = targetDayId + 1;
            }
            sourceWorkouts.forEach((workout) => {
              const newLifts = workout.lifts.map((lift) => ({
                ...applyProgressionRule(
                  lift,
                  sessionIndex,
                  userLiftsMap.get(lift.base_lift_id)
                ),
                id: `${Date.now()}-${Math.random()}`,
              }));
              const newWorkout = {
                ...workout,
                id: Date.now() + Math.random(),
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

        for (let i = 0; i < repeatCount; i++) {
          selectedDays.forEach((sourceDayId, dayIndex) => {
            const sourceWorkouts = Array.from(prevWorkouts.values()).filter(
              (w) => w.dayId === sourceDayId
            );
            const targetDayId = newTotalDays;
            newTotalDays += 1;

            if (overwriteExisting) {
              prevWorkouts.forEach((workout) => {
                if (workout.dayId === targetDayId) {
                  updatedWorkouts.delete(workout.id);
                }
              });
            }

            sourceWorkouts.forEach((workout) => {
              const newLifts = workout.lifts.map((lift) => ({
                ...applyProgressionRule(
                  lift,
                  i * selectedDays.length + dayIndex,
                  userLiftsMap.get(lift.base_lift_id)
                ),
                id: `${Date.now()}-${Math.random()}`,
              }));
              const newWorkout = {
                ...workout,
                id: Date.now() + Math.random(),
                dayId: targetDayId,
                lifts: newLifts,
              };
              updatedWorkouts.set(newWorkout.id, newWorkout);
            });
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
      endWeek: weeks.length,
      repeatCount: 1,
      overwriteExisting: false,
    });
    setSelectedDays([]);
  }, [selectedDays, duplicateFormData, totalDays, weeks.length, userLiftsData]);

  const handleDuplicateFormChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setDuplicateFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : parseInt(value) || value,
    }));
  }, []);

  const handleWeekDayToggle = useCallback((dayIndex) => {
    setDuplicateFormData((prev) => {
      const selectedWeekDays = prev.selectedWeekDays.includes(dayIndex)
        ? prev.selectedWeekDays.filter((d) => d !== dayIndex)
        : [...prev.selectedWeekDays, dayIndex];
      return { ...prev, selectedWeekDays };
    });
  }, []);

  // Copy-Paste Logic
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
      setSelectedDays([]); // Clear selection after copy
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000); // Hide after 2 seconds
    },
    [workouts]
  );

  const handlePaste = useCallback(
    (startDayId) => {
      setWorkouts((prevWorkouts) => {
        const updatedWorkouts = new Map(prevWorkouts);
        let newTotalDays = totalDays;
        const userLiftsMap = new Map(
          userLiftsData.map((data) => [data.base_lift_id, data])
        );

        clipboard.forEach((clip, index) => {
          const targetDayId = startDayId + index;
          if (targetDayId >= newTotalDays) {
            newTotalDays = targetDayId + 1;
          }

          // Append workouts (no overwriting)
          clip.workouts.forEach((workout) => {
            const newLifts = workout.lifts.map((lift) => ({
              ...applyProgressionRule(
                lift,
                index,
                userLiftsMap.get(lift.base_lift_id)
              ),
              id: `${Date.now()}-${Math.random()}`,
            }));
            const newWorkout = {
              ...workout,
              id: Date.now() + Math.random(),
              dayId: targetDayId,
              lifts: newLifts,
            };
            updatedWorkouts.set(newWorkout.id, newWorkout);
          });
        });

        setTotalDays(newTotalDays);
        return new Map(updatedWorkouts);
      });

      setClipboard([]); // Clear clipboard after paste
      setContextMenu(null); // Close context menu
    },
    [clipboard, totalDays, userLiftsData]
  );

  // Context Menu Logic
  const handleContextMenu = useCallback(
    (e, dayId) => {
      e.preventDefault();
      const { clientX, clientY } = e;
      // Adjust position to stay within viewport
      const menuWidth = 120; // Approximate width of context menu
      const menuHeight = clipboard.length > 0 ? 80 : 40; // Approximate height (2 or 1 item)
      const x =
        clientX + menuWidth > window.innerWidth ? clientX - menuWidth : clientX;
      const y =
        clientY + menuHeight > window.innerHeight
          ? clientY - menuHeight
          : clientY;

      setContextMenu({ x, y, dayId });
    },
    [clipboard]
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        contextMenu &&
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target)
      ) {
        closeContextMenu();
        event.stopPropagation();
        event.preventDefault();
      }
    };

    // Use capture phase to catch clicks before they’re handled by other elements
    document.addEventListener("click", handleClickOutside, true);
    return () =>
      document.removeEventListener("click", handleClickOutside, true);
  }, [contextMenu, closeContextMenu]);

  const renderedWeeks = weeks.map((week, weekIndex) => (
    <div key={`week-${weekIndex}`} className="contents">
      <div
        className={`bg-gray-50 p-2 font-medium cursor-pointer hover:bg-gray-200 flex items-center justify-center writing-vertical-rl rotate-180 h-full whitespace-nowrap rounded relative group ${
          collapsedWeeks.has(weekIndex) ? "text-gray-400" : "text-gray-800"
        }`}
        onClick={() => toggleWeekCollapse(weekIndex)}
      >
        {!collapsedWeeks.has(weekIndex) ? "Week" : ""} {weekIndex + 1}
        <span>
          <TrashIcon
            className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 h-4 w-4 text-red-400 hover:text-red-600 rotate-90 opacity-0 ${
              collapsedWeeks.has(weekIndex)
                ? "opacity-0"
                : "group-hover:opacity-100"
            }`}
            onClick={(e) => handleDeleteWeek(weekIndex, e)}
          />
        </span>
      </div>
      {week.map((_, dayIndex) => {
        const actualDayId = weekIndex * 7 + dayIndex;
        const isSelected = selectedDays.includes(actualDayId);
        return (
          <Day
            key={actualDayId}
            id={actualDayId}
            isDayCollapsed={collapsedDays[dayIndex]}
            isWeekCollapsed={collapsedWeeks.has(weekIndex)}
            isDaySelected={isSelected}
            handleEditWorkout={handleEditWorkout}
            workouts={workoutsByDay.get(actualDayId) || EMPTY_WORKOUTS}
            handleClick={selectDay}
            group={
              plan.dayGroups?.find((group) =>
                group.dayIds.includes(actualDayId)
              ) || null
            }
            onContextMenu={handleContextMenu}
          />
        );
      })}
    </div>
  ));

  return (
    <DndContext
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="w-full h-full">
        <div className="flex justify-between mb-4">
          <span
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/plans/")}
          >
            <ArrowLeftIcon className="w-6 h-6" />
            <span>(To Plans)</span>
          </span>
          <span className="flex items-center gap-2">
            <h2 className="heading">{plan.name ? plan.name : "New Plan"}</h2>
            <AdjustmentsHorizontalIcon
              className="w-5 cursor-pointer"
              onClick={() => setIsModalOpen(!isModalOpen)}
            />
          </span>
          <Button onClick={handleSave} className="bg-green-600">
            Save
          </Button>
        </div>

        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title="Plan Settings"
            className="w-3/4"
          >
            <PlanSettingsForm
              formData={formInputs}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              handleCategoriesChange={handleCategoriesChange}
            />
          </Modal>
        )}

        <div className="grid gap-2 w-full" style={gridStyle}>
          <div></div>
          {headerDays}
          {renderedWeeks}
        </div>

        <div className="mt-4 flex justify-center">
          <PlusCircleIcon
            className="h-8 w-8 text-green-500 hover:text-green-600 cursor-pointer"
            onClick={() => setTotalDays((prev) => prev + 7)}
          />
        </div>

        {selectedDays.length > 0 && (
          <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white shadow-md p-3 rounded flex gap-2 z-50">
            <Button
              className="btn btn-primary"
              onClick={() => setShowGroupForm((prev) => !prev)}
            >
              Group
            </Button>
            {showGroupForm && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded shadow-lg border w-64 z-50">
                <h3 className="text-sm font-semibold mb-2">Create Group</h3>
                <div className="mb-2">
                  <label className="block text-xs text-gray-500 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    className="w-full border px-2 py-1 rounded text-sm"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">
                    Group Color
                  </label>
                  <input
                    type="color"
                    value={groupColor}
                    onChange={(e) => setGroupColor(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <button
                    className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600"
                    onClick={() => handleGroupConfirm()}
                  >
                    Confirm
                  </button>
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setShowGroupForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <Button
              className="btn btn-primary"
              onClick={() => handleCopy(selectedDays)}
              disabled={selectedDays.length === 0}
            >
              Copy
            </Button>
            <Button
              className="btn btn-primary"
              onClick={() => {
                setShowDuplicateForm(true);
                setDuplicateFormData({
                  selectedWeekDays: [],
                  startWeek: 1,
                  endWeek: weeks.length,
                  repeatCount: 1,
                  overwriteExisting: false,
                });
              }}
            >
              Duplicate
            </Button>
            {showDuplicateForm && selectedDays.length === 1 && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded shadow-lg border w-64 z-50">
                <h3 className="text-sm font-semibold mb-2">
                  Duplicate Day {(selectedDays[0] % 7) + 1}
                </h3>
                <div className="mb-2">
                  <label className="block text-xs text-gray-500 mb-1">
                    Days of the Week
                  </label>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day, index) => (
                      <label key={index} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={duplicateFormData.selectedWeekDays.includes(
                            index
                          )}
                          onChange={() => handleWeekDayToggle(index)}
                          className="mr-2"
                        />
                        {day}
                      </label>
                    )
                  )}
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-500 mb-1">
                    From Week
                  </label>
                  <input
                    type="number"
                    name="startWeek"
                    value={duplicateFormData.startWeek}
                    onChange={handleDuplicateFormChange}
                    className="w-full border px-2 py-1 rounded text-sm"
                    min="1"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">
                    To Week
                  </label>
                  <input
                    type="number"
                    name="endWeek"
                    value={duplicateFormData.endWeek}
                    onChange={handleDuplicateFormChange}
                    className="w-full border px-2 py-1 rounded text-sm"
                    min={duplicateFormData.startWeek}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <button
                    className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600"
                    onClick={handleDuplicateConfirm}
                    disabled={duplicateFormData.selectedWeekDays.length === 0}
                  >
                    Confirm
                  </button>
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setShowDuplicateForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {showDuplicateForm && selectedDays.length > 1 && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded shadow-lg border w-64 z-50">
                <h3 className="text-sm font-semibold mb-2">
                  Duplicate Selected Days
                </h3>
                <div className="mb-2">
                  <label className="block text-xs text-gray-500 mb-1">
                    Repeat Times
                  </label>
                  <input
                    type="number"
                    name="repeatCount"
                    value={duplicateFormData.repeatCount}
                    onChange={handleDuplicateFormChange}
                    className="w-full border px-2 py-1 rounded text-sm"
                    min="1"
                  />
                </div>
                <div className="mb-3">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      name="overwriteExisting"
                      checked={duplicateFormData.overwriteExisting}
                      onChange={handleDuplicateFormChange}
                      className="mr-2"
                    />
                    Overwrite existing workouts
                  </label>
                </div>
                <div className="flex justify-between text-sm">
                  <button
                    className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600"
                    onClick={handleDuplicateConfirm}
                    disabled={duplicateFormData.repeatCount < 1}
                  >
                    Confirm
                  </button>
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setShowDuplicateForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <Button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedDays([]);
                setShowDuplicateForm(false);
                setClipboard([]);
                setContextMenu(null);
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {contextMenu && (
          <div
            ref={contextMenuRef}
            className="fixed bg-white shadow-md rounded p-2 z-50 text-sm"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside menu from closing it
          >
            <div
              className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                handleCopy(contextMenu.dayId);
                closeContextMenu();
              }}
            >
              Copy
            </div>
            {clipboard.length > 0 && (
              <div
                className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                onClick={() => handlePaste(contextMenu.dayId)}
              >
                Paste
              </div>
            )}
          </div>
        )}
        <Toast message={"Copied!"} visible={showCopiedMessage} />
        <Modal
          isOpen={editingDay !== null}
          onClose={() => setEditingDay(null)}
          title={`Week ${
            editingDay ? Math.floor(editingDay.dayId / 7) + 1 : ""
          } Day ${editingDay ? (editingDay.dayId % 7) + 1 : ""}`}
          className="w-[95vw] h-[95vh]"
        >
          {editingDay && (
            <WorkoutEditor
              workouts={editingDay.workouts}
              baseLifts={baseLifts}
              onSave={saveEditedWorkouts}
              dayId={editingDay.dayId}
              userLiftsData={userLiftsData}
              experience={currentUser.experience}
            />
          )}
        </Modal>

        {createPortal(
          <DragOverlay>
            {activeWorkout && (
              <Workout id={activeWorkout.id} workout={activeWorkout} />
            )}
          </DragOverlay>,
          document.body
        )}
      </div>
    </DndContext>
  );
};

export default PlanEditor;
