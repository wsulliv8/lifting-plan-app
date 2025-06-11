import { useMemo } from "react";
import { useLoaderData } from "react-router-dom";
import PlanGrid from "../../components/plans/editor/PlanGrid";
import PlanToolbar from "../../components/plans/editor/PlanToolbar";
import PlanContextMenu from "../../components/plans/editor/PlanContextMenu";
import PlanSettingsModal from "../../components/plans/modals/PlanSettingsModal";
import WorkoutEditorModal from "../../components/plans/modals/WorkoutEditorModal";
import DuplicateForm from "../../components/plans/forms/DuplicateForm";
import GroupForm from "../../components/plans/forms/GroupForm";
import Toast from "../../components/common/Toast";
import {
  computeWorkoutsByDay,
  stripIds,
  computeWeeks,
} from "../../utils/planUtils";
import { usePlanData } from "../../hooks/usePlanData";
import { usePlanUIState } from "../../hooks/usePlanUIState";
import { usePlanDragAndDrop } from "../../hooks/usePlanDragAndDrop";
import { usePlanActions } from "../../hooks/usePlanActions";
import { useTheme } from "../../context/ThemeContext";

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

  const { screenSize } = useTheme();
  const weeks = useMemo(() => computeWeeks(totalDays), [totalDays]);

  const uiState = usePlanUIState(weeks.length, plan);
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
    setMessage: uiState.setMessage,
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
    setIsModalOpen: uiState.setIsModalOpen,
  });

  const workoutsByDay = useMemo(
    () => computeWorkoutsByDay(workouts),
    [workouts]
  );

  return (
    <div className={`w-full h-full ${screenSize.isMobile ? "pb-24" : ""}`}>
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
        handleSubmit={actions.handleSubmit}
      />
      <PlanGrid
        workouts={workoutsByDay}
        totalDays={totalDays}
        collapsedWeeks={uiState.collapsedWeeks}
        collapsedDays={uiState.collapsedDays}
        lastUncollapsedIndex={uiState.lastUncollapsedIndex}
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
        onContextMenu={uiState.handleContextMenu}
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
        selectedDays={uiState.selectedDays}
      />
      <Toast message={uiState.message} visible={uiState.message} />
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
