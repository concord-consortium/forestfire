import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStores } from "../models/stores";
import { Provider } from "mobx-react";
import { BottomBar } from "./bottom-bar";
import { Vector2 } from "three";
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
    const start = screen.getByTestId("start-button");
    expect(start).toBeDisabled();

    act(() => {
      stores.simulation.dataReady = true;
      // no sparks defined - this should still be false
      expect(stores.simulation.ready).toEqual(false);
      stores.simulation.sparks[0] = new Vector2(100, 100);
      expect(stores.simulation.ready).toEqual(true);
    });
    expect(start).not.toBeDisabled();
  });

  describe("restart button", () => {
    it("restarts simulation", async () => {
      jest.spyOn(stores.simulation, "restart");
      render(
        <Provider stores={stores}>
          <BottomBar />
        </Provider>
      );
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
