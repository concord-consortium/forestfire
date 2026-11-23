import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { log } from "@concord-consortium/lara-interactive-api";
import { TopBar } from "./top-bar";

jest.mock("@concord-consortium/lara-interactive-api", () => ({ log: jest.fn() }));

type User = ReturnType<typeof userEvent.setup>;

describe("TopBar component", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    jest.mocked(log).mockClear();
  });

  afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, writable: true, value: originalLocation });
  });

  describe("Reload button", () => {
    it("reloads the model using window.location.reload", async () => {
      const reloadMock = jest.fn();
      Object.defineProperty(window, "location", {
        writable: true,
        value: { reload: reloadMock },
      });
      render(<TopBar projectName="Test" />);
      await userEvent.click(screen.getByTestId("reload"));
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(reloadMock).toHaveBeenCalled();
    });
  });

  describe("Reload button keyboard access", () => {
    it("is the first Tab stop, named Reload with a matching tooltip, and reloads on Enter", async () => {
      const user = userEvent.setup();
      const reloadMock = jest.fn();
      Object.defineProperty(window, "location", {
        writable: true,
        value: { reload: reloadMock },
      });
      render(<TopBar projectName="Test" />);
      const reload = screen.getByRole("button", { name: "Reload" });
      expect(reload).toHaveAttribute("type", "button");
      // A title alone would also give the button its accessible name, so assert aria-label directly.
      expect(reload).toHaveAttribute("aria-label", "Reload");
      expect(reload).toHaveAttribute("title", "Reload");
      await user.tab();
      expect(reload).toHaveFocus();
      await user.keyboard("{Enter}");
      await waitFor(() => expect(reloadMock).toHaveBeenCalled());
    });
  });

  describe("Share button", () => {
    it("opens share dialog", async () => {
      render(<TopBar projectName="Test" />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      await userEvent.click(screen.getByTestId("share"));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("About button", () => {
    it("opens about dialog", async () => {
      render(<TopBar projectName="Test" />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      await userEvent.click(screen.getByTestId("about"));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe.each([
    { name: "Share", tabs: 2 },
    { name: "About", tabs: 3 }
  ])("$name button keyboard access", ({ name, tabs }) => {
    it("is a button reached by Tab that opens its dialog with Enter, focusing Close", async () => {
      const user = userEvent.setup();
      render(<TopBar projectName="Test" />);
      const button = screen.getByRole("button", { name });
      expect(button).toHaveAttribute("type", "button");
      for (let i = 0; i < tabs; i++) {
        await user.tab();
      }
      expect(button).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(await screen.findByRole("dialog")).toHaveAccessibleName(`${name}: Test`);
      expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    });

    // fireEvent.click does not move focus, like a click in macOS Safari and Firefox.
    it.each([
      { closeWith: "Esc", close: (user: User) => user.keyboard("{Escape}") },
      { closeWith: "Close", close: (user: User) => user.click(screen.getByRole("button", { name: "Close" })) }
    ])("gets focus back when $closeWith closes the dialog after a click that did not focus it", async ({ close }) => {
      const user = userEvent.setup();
      render(<TopBar projectName="Test" />);
      const button = screen.getByRole("button", { name });
      expect(document.body).toHaveFocus();
      fireEvent.click(button);
      await screen.findByRole("dialog");
      await close(user);
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(button).toHaveFocus();
    });

    it("focuses Close when reopened while the dialog is still closing", async () => {
      const user = userEvent.setup();
      render(<TopBar projectName="Test" />);
      const button = screen.getByRole("button", { name });
      await user.click(button);
      await user.keyboard("{Escape}");
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      await user.click(button);
      expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    });
  });

  it.each(["Share", "About"])("logs %sDialogOpened when its button opens the dialog", async (name) => {
    render(<TopBar projectName="Test" />);
    await userEvent.click(screen.getByRole("button", { name }));
    expect(log).toHaveBeenCalledWith(`${name}DialogOpened`);
  });
});
