import { ComboboxDemo } from "@/components/combobox";

export default function MainPage() {
    return (
        // Two comboboxes side by side
        <div className="flex flex-1 items-center justify-center gap-10">
          <ComboboxDemo />
          <ComboboxDemo />
        </div>
    );
}