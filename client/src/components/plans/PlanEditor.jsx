import { useCallback, useMemo } from "react";
import { useLoaderData } from "react-router-dom";
import PlanGrid from "./PlanGrid";
import PlanToolbar from "./PlanToolbar";
import PlanContextMenu from "./PlanContextMenu";
import PlanSettingsModal from "./PlanSettingsModal";
import WorkoutEditorModal from "./WorkoutEditorModal";
import DuplicateForm from "./DuplicateForm";
import GroupForm from "./GroupForm";
import Toast from "./Toast";
import { savePlan } from "../../services/plans";
import {
  computeWorkoutsByDay,
  stripIds,
  computeWeeks,
} from "../../utils/planUtils";
import { usePlanData } from "../../hooks/usePlanData";
import { usePlanUIState } from "../../hooks/usePlanUIState";
import { usePlanDragAndDrop } from "../../hooks/usePlanDragAndDrop";
import { usePlanActions } from "../../hooks/usePlanActions";

const PlanEditor = () => {
  const {
    plan,
    setPlan,
    workouts,
    setWorkouts,
    totalDays,
    setTotalDays,
    workoutsRef,
    baseLifts,
    userLiftsData,
    currentUser,
  } = usePlanData(useLoaderData());

  const weeks = useMemo(() => computeWeeks(totalDays), [totalDays]);

  const uiState = usePlanUIState(weeks.length);
  const { activeWorkout, sensors, handleDragStart, handleDragEnd } =
    usePlanDragAndDrop(workoutsRef, setWorkouts);

  const actions = usePlanActions({
    plan,
    setPlan,
    workouts,
    setWorkouts,
    totalDays,
    setTotalDays,
    workoutsRef,
    selectedDays: uiState.selectedDays,
    setSelectedDays: uiState.setSelectedDays,
    duplicateFormData: uiState.duplicateFormData,
    setDuplicateFormData: uiState.setDuplicateFormData,
    setShowDuplicateForm: uiState.setShowDuplicateForm,
    clipboard: uiState.clipboard,
    setClipboard: uiState.setClipboard,
    setContextMenu: uiState.setContextMenu,
    setShowCopiedMessage: uiState.setShowCopiedMessage,
    setShowGroupForm: uiState.setShowGroupForm,
    setGroupName: uiState.setGroupName,
    setGroupColor: uiState.setGroupColor,
    groupName: uiState.groupName,
    groupColor: uiState.groupColor,
    userLiftsData,
    weeksLength: weeks.length,
    editingDay: uiState.editingDay,
    setEditingDay: uiState.setEditingDay,
    stripIds,
  });

  const workoutsByDay = useMemo(
    () => computeWorkoutsByDay(workouts),
    [workouts]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const updatedPlan = {
        ...plan,
        name: uiState.formInputs.name,
        goal: uiState.formInputs.goal,
        categories: uiState.formInputs.categories,
        difficulty: uiState.formInputs.difficulty,
        description: uiState.formInputs.description,
      };
      setPlan(updatedPlan);
      await savePlan(stripIds(updatedPlan));
      uiState.setIsModalOpen(false);
    },
    [plan, setPlan, uiState]
  );

  // Context Menu Logic
  const handleContextMenu = useCallback(
    (e, dayId) => {
      e.preventDefault();
      const { clientX, clientY } = e;
      // Adjust position to stay within viewport
      const menuWidth = 120; // Approximate width of context menu
      const menuHeight = uiState.clipboard.length > 0 ? 80 : 40; // Approximate height (2 or 1 item)
      const x =
        clientX + menuWidth > window.innerWidth ? clientX - menuWidth : clientX;
      const y =
        clientY + menuHeight > window.innerHeight
          ? clientY - menuHeight
          : clientY;

      uiState.setContextMenu({ x, y, dayId });
    },
    [uiState]
  );

  return (
    <div className="w-full h-full">
      <PlanToolbar
        plan={plan}
        setIsModalOpen={uiState.setIsModalOpen}
        handleSave={actions.handleSave}
        totalDays={totalDays}
        setTotalDays={setTotalDays}
        selectedDays={uiState.selectedDays}
        setShowGroupForm={uiState.setShowGroupForm}
        handleCopy={actions.handleCopy}
        setShowDuplicateForm={uiState.setShowDuplicateForm}
        setDuplicateFormData={uiState.setDuplicateFormData}
        setSelectedDays={uiState.setSelectedDays}
        setClipboard={uiState.setClipboard}
        setContextMenu={uiState.setContextMenu}
        weeksLength={weeks.length}
      />
      <PlanSettingsModal
        isOpen={uiState.isModalOpen}
        onClose={() => uiState.setIsModalOpen(false)}
        plan={plan}
        handleSubmit={handleSubmit}
      />
      <PlanGrid
        workouts={workoutsByDay}
        totalDays={totalDays}
        collapsedWeeks={uiState.collapsedWeeks}
        collapsedDays={uiState.collapsedDays}
        selectedDays={uiState.selectedDays}
        handleEditWorkout={actions.handleEditWorkout}
        handleClick={uiState.selectDay}
        plan={plan}
        toggleWeekCollapse={uiState.toggleWeekCollapse}
        handleDeleteWeek={actions.handleDeleteWeek}
        toggleDayCollapse={uiState.toggleDayCollapse}
        activeWorkout={activeWorkout}
        sensors={sensors}
        handleDragStart={handleDragStart}
        handleDragEnd={handleDragEnd}
        onContextMenu={handleContextMenu}
        setTotalDays={setTotalDays}
      />

      {uiState.showGroupForm && (
        <GroupForm
          groupName={uiState.groupName}
          setGroupName={uiState.setGroupName}
          groupColor={uiState.groupColor}
          setGroupColor={uiState.setGroupColor}
          handleGroupConfirm={actions.handleGroupConfirm}
          setShowGroupForm={uiState.setShowGroupForm}
        />
      )}

      {uiState.showDuplicateForm && (
        <DuplicateForm
          selectedDays={uiState.selectedDays}
          duplicateFormData={uiState.duplicateFormData}
          handleDuplicateFormChange={uiState.handleDuplicateFormChange}
          handleWeekDayToggle={uiState.handleWeekDayToggle}
          handleDuplicateConfirm={actions.handleDuplicateConfirm}
          setShowDuplicateForm={uiState.setShowDuplicateForm}
          weeksLength={weeks.length}
        />
      )}
      <PlanContextMenu
        contextMenu={uiState.contextMenu}
        contextMenuRef={uiState.contextMenuRef}
        closeContextMenu={uiState.closeContextMenu}
        handleCopy={actions.handleCopy}
        handlePaste={actions.handlePaste}
        clipboard={uiState.clipboard}
      />
      <Toast message="Copied!" visible={uiState.showCopiedMessage} />
      <WorkoutEditorModal
        editingDay={uiState.editingDay}
        onClose={() => uiState.setEditingDay(null)}
        workouts={uiState.editingDay?.workouts}
        baseLifts={baseLifts}
        onSave={actions.saveEditedWorkouts}
        dayId={uiState.editingDay?.dayId}
        userLiftsData={userLiftsData}
        experience={currentUser.experience}
      />
    </div>
  );
};

export default PlanEditor;
