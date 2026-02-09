import { render, screen } from "@testing-library/svelte";
import App from "./App.svelte";

describe("App", () => {
  it("renders landing title", () => {
    render(App);
    expect(screen.getByRole("heading", { name: /menu maker/i })).toBeInTheDocument();
  });
});
