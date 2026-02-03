import { render, screen } from "@testing-library/svelte";
import App from "./App.svelte";

describe("App", () => {
  it("renders base copy", () => {
    render(App);
    expect(screen.getByText(/Menús interactivos/i)).toBeInTheDocument();
  });
});
