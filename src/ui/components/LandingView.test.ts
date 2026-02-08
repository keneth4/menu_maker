import { fireEvent, render, screen } from "@testing-library/svelte";
import LandingView from "./LandingView.svelte";

describe("LandingView", () => {
  it("emits language and action events", async () => {
    const { component } = render(LandingView, {
      props: {
        uiLang: "es",
        t: (key: string) => key
      }
    });

    const switchLang = vi.fn();
    const createProject = vi.fn();
    const openProject = vi.fn();
    const startWizard = vi.fn();

    component.$on("switchLang", (event) => switchLang(event.detail));
    component.$on("createProject", createProject);
    component.$on("openProject", openProject);
    component.$on("startWizard", startWizard);

    await fireEvent.click(screen.getByRole("button", { name: "EN" }));
    await fireEvent.click(screen.getByRole("button", { name: "landingCreate" }));
    await fireEvent.click(screen.getByRole("button", { name: "landingOpen" }));
    await fireEvent.click(screen.getByRole("button", { name: "landingWizard" }));

    expect(switchLang).toHaveBeenCalledWith("en");
    expect(createProject).toHaveBeenCalledTimes(1);
    expect(openProject).toHaveBeenCalledTimes(1);
    expect(startWizard).toHaveBeenCalledTimes(1);
  });
});
