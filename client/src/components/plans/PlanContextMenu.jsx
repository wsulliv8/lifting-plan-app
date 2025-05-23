import { useEffect } from "react";

const PlanContextMenu = ({
  contextMenu,
  contextMenuRef,
  closeContextMenu,
  handleCopy,
  handlePaste,
  clipboard,
}) => {
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
    document.addEventListener("click", handleClickOutside, true);
    return () =>
      document.removeEventListener("click", handleClickOutside, true);
  }, [contextMenu, closeContextMenu, contextMenuRef]);

  if (!contextMenu) return null;

  return (
    <div
      ref={contextMenuRef}
      className="fixed bg-white shadow-md rounded p-2 z-50 text-sm"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={(e) => e.stopPropagation()}
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
  );
};

export default PlanContextMenu;
