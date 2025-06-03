import { useState, useCallback, useRef } from "react";

export const usePlanUIState = (weeksLength) => {
  const [collapsedWeeks, setCollapsedWeeks] = useState(new Set());
  const [collapsedDays, setCollapsedDays] = useState(Array(7).fill(false));
  const [selectedDays, setSelectedDays] = useState([]);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupColor, setGroupColor] = useState("#4f46e5");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDuplicateForm, setShowDuplicateForm] = useState(false);
  const [duplicateFormData, setDuplicateFormData] = useState({
    selectedWeekDays: [],
    startWeek: 1,
    endWeek: weeksLength,
    repeatCount: 1,
    overwriteExisting: false,
    autoProgress: true,
  });
  const [clipboard, setClipboard] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [editingDay, setEditingDay] = useState(null);

  const contextMenuRef = useRef(null);

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

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleContextMenu = useCallback(
    (e, id) => {
      e.preventDefault();
      if (id === undefined) {
        console.warn("No day ID provided for context menu");
        return;
      }
      const { clientX, clientY } = e;
      const menuWidth = 120;
      const menuHeight = clipboard.length > 0 ? 80 : 40;
      const x =
        clientX + menuWidth > window.innerWidth ? clientX - menuWidth : clientX;
      const y =
        clientY + menuHeight > window.innerHeight
          ? clientY - menuHeight
          : clientY;
      console.log("Setting context menu for dayId:", id);
      setContextMenu({ x, y, dayId: id });
    },
    [clipboard, setContextMenu]
  );

  return {
    collapsedWeeks,
    collapsedDays,
    selectedDays,
    setSelectedDays,
    showGroupForm,
    setShowGroupForm,
    groupName,
    setGroupName,
    groupColor,
    setGroupColor,
    isModalOpen,
    setIsModalOpen,
    showDuplicateForm,
    setShowDuplicateForm,
    duplicateFormData,
    setDuplicateFormData,
    clipboard,
    setClipboard,
    contextMenu,
    setContextMenu,
    showCopiedMessage,
    setShowCopiedMessage,
    editingDay,
    setEditingDay,
    contextMenuRef,
    toggleWeekCollapse,
    toggleDayCollapse,
    selectDay,
    handleDuplicateFormChange,
    handleWeekDayToggle,
    closeContextMenu,
    handleContextMenu,
  };
};
