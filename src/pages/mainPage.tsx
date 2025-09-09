import { ComboboxDemo } from "@/components/combobox";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "@/components/searchBar";

export default function MainPage() {
    const navigate = useNavigate();

    const handleNavigation = () => {
    navigate("/") // Replace "/mainpage" with your actual route
  }
    return (
        // Two comboboxes side by side
        <>
        <div className="flex flex-1 items-center justify-center gap-10">
          <SearchBar onSelect={(value) => console.log(value)} />
        </div>
        <div className="fixed bottom-4 right-4">
          <Button onClick={handleNavigation}>Go Landing</Button>
        </div>
      </>
    );
}