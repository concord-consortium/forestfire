import React from "react";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { createStores } from "../models/stores";
import { Provider } from "mobx-react";
import { BottomBar } from "./bottom-bar";
import { act } from "react-dom/test-utils";

describe("BottomBar component", () => {
  let stores = createStores();
  beforeEach(() => {
    stores = createStores();
  });

  it("renders basic components", () => {
    render(
      <Provider stores={stores}>
        <BottomBar />
      </Provider>
    );
    expect(screen.queryAllByRole("button").length).toBeGreaterThan(0);
  });

  it("start button is disabled until model is ready", () => {
    // simulation will not be ready until at least one spark is defined
    stores.simulation.sparks = [];
    stores.simulation.dataReady = false;
    expect(stores.simulation.ready).toEqual(false);
    render(
      <Provider stores={stores}>
        <BottomBar />
      </Provider>
    );
    const start = screen.getByTestId("start-stop-button");
    expect(start).toBeDisabled();

    act(() => {
      stores.simulation.dataReady = true;
      expect(stores.simulation.ready).toEqual(true);
    });
    expect(start).not.toBeDisabled();
  });

  // Restart button was replaced by reload button in UI
  // eslint-disable-next-line jest/no-disabled-tests
  describe.skip("restart button", () => {
    it("restarts simulation", async () => {
      jest.spyOn(stores.simulation, "restart");
      render(
        <Provider stores={stores}>
          <BottomBar />
        </Provider>
      );
      expect(screen.getByTestId("restart-button")).toBeDisabled();
      act(() => {
        stores.simulation.simulationStarted = true;
      });
      expect(screen.getByTestId("restart-button")).not.toBeDisabled();
      await userEvent.click(screen.getByTestId("restart-button"));
      expect(stores.simulation.restart).toHaveBeenCalled();
    });
  });

  describe("reload button", () => {
    it("resets simulation and resets view", async () => {
      jest.spyOn(stores.simulation, "reload");
      render(
        <Provider stores={stores}>
          <BottomBar />
        </Provider>
      );

      const reloadButton = screen.queryByTestId("reload-button");
      if (!reloadButton) {
        // Note that reloadButton might be hidden as long as it's not useful for the app.
        return;
      }

      expect(screen.getByTestId("reload-button")).toBeDisabled();
      act(() => {
        stores.simulation.simulationStarted = true;
      });
      expect(screen.getByTestId("reload-button")).not.toBeDisabled();
      await userEvent.click(screen.getByTestId("reload-button"));
      expect(stores.simulation.reload).toHaveBeenCalled();
    });
  });

  describe("controls are disabled when running", () => {
    it("is disabled while running", () => {
      render(
        <Provider stores={stores}>
          <BottomBar />
        </Provider>
      );
      act(() => {
        stores.simulation.simulationStarted = true;
      });

      const spark = screen.getByTestId("spark-button");
      expect(spark).toBeDisabled();
    });
  });
});
