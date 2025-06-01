import Input from "../../common/Input";
import Select from "../../common/Select";
import MultiSelect from "../../common/MultiSelect";
import TextArea from "../../common/TextArea";
import Button from "../../common/Button";

// Memoized form component
const PlanSettingsForm = ({
  formData,
  handleInputChange,
  handleSubmit,
  handleCategoriesChange,
}) => {
  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
      <Input
        label="Name"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        containerClass="w-3/4"
      />
      <Input
        label="Goal"
        name="goal"
        value={formData.goal}
        onChange={handleInputChange}
        containerClass="w-3/4"
        placeholder="e.g., Strength, Hypertrophy"
      />
      <div className="w-3/4">
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
        containerClass="w-3/4"
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
        containerClass="w-3/4"
      />
      <Button type="submit" variant="primary" size="md" className="w-1/2">
        Save
      </Button>
    </form>
  );
};

export default PlanSettingsForm;
