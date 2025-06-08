import Input from "../../common/Input";
import Select from "../../common/Select";
import MultiSelect from "../../common/MultiSelect";
import TextArea from "../../common/TextArea";
import Button from "../../common/Button";
import { useTheme } from "../../../context/ThemeContext";

// Memoized form component
const PlanSettingsForm = ({
  formData,
  handleInputChange,
  handleSubmit,
  handleCategoriesChange,
}) => {
  const { screenSize } = useTheme();
  const containerClass = screenSize.isMobile ? "w-full" : "w-3/4";
  const buttonClass = screenSize.isMobile ? "w-full" : "w-1/2";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center gap-4 w-full px-4"
    >
      <Input
        label="Name"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        containerClass={containerClass}
      />
      <Input
        label="Goal"
        name="goal"
        value={formData.goal}
        onChange={handleInputChange}
        containerClass={containerClass}
        placeholder="e.g., Strength, Hypertrophy"
      />
      <div className={containerClass}>
        <label className="block text-sm font-normal text-[var(--text-secondary)] mb-1">
          Categories
        </label>
        <MultiSelect
          value={formData.categories || []}
          onChange={handleCategoriesChange}
          options={[
            { value: "Upper Body", label: "Upper Body" },
            { value: "Lower Body", label: "Lower Body" },
            { value: "Full Body", label: "Full Body" },
            { value: "Barbell", label: "Barbell" },
            { value: "Compound", label: "Compound" },
          ]}
        />
      </div>
      <Select
        label="Difficulty"
        name="difficulty"
        value={formData.difficulty}
        onChange={handleInputChange}
        containerClass={containerClass}
        options={[
          { value: "Beginner", label: "Beginner" },
          { value: "Intermediate", label: "Intermediate" },
          { value: "Advanced", label: "Advanced" },
        ]}
      />
      <TextArea
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        containerClass={containerClass}
      />
      <Button type="submit" variant="primary" size="md" className={buttonClass}>
        Save
      </Button>
    </form>
  );
};

export default PlanSettingsForm;
