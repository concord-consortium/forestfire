import { observable, makeObservable } from "mobx";

export enum Interaction {
  PlaceSpark = "PlaceSpark",
  HoverOverDraggable = "HoverOverDraggable"
}

export class UIModel {
  @observable public maxSparks: number;
  @observable public interaction: Interaction | null = null;
  @observable public dragging = false;
  @observable public showChart = false;

  constructor() {
    makeObservable(this);
  }
}
