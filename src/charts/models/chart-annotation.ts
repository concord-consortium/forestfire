import { observable, makeObservable } from "mobx";

/**
 * This model tries to reduce the number of options that need to be specified when defining an
 * annotation, by making lots of decisions in `formatted`. See tests.
 *
 * If we end up needing to add every little option, then we should make the model just look identical
 * to the annotation def.
 *
 * See https://github.com/chartjs/chartjs-plugin-annotation
 */
export interface IChartAnnotation{
  type: string;
  // x value for vertical line, y value for horizontal
  value?: number;
  // line styling
  color?: string;
  thickness?: number;
  dashArray?: number[];
  // text label. Note: only available for line annotations.
  label?: string;
  labelColor?: string;
  labelBackgroundColor?: string;
  labelXOffset?: number;
  labelYOffset?: number;
  labelPosition?: string;
  // if present, will add mouse rollover and click handlers
  expandLabel?: string;
  // additional offset for rollovers of different lenghts
  expandOffset?: number;
  // bounds for box labels. Infinity is permitted
  xMin?: number;
  xMax?: number;
  yMax?: number;
  yMin?: number;
  fontFamily?: string;
  fontSize?: number;
}
export class Annotation implements IChartAnnotation {
  public type: string;
  @observable public value?: number;
  @observable public color?: string = "#797979";
  public thickness?: number = 2;
  public dashArray?: number[] = [5, 5];
  @observable public label?: string;
  public labelColor?: string = "black";
  public labelBackgroundColor?: string;
  public labelXOffset?: number = 0;
  public labelYOffset?: number = 0;
  public labelPosition?: string = "top";
  public expandLabel?: string;
  public expandOffset?: number = 0;
  public xMin?: number;
  public xMax?: number;
  public yMax?: number;
  public yMin?: number;
  public showingExpandLabel?: boolean = false;
  public fontFamily?: string;
  public fontSize?: number;

  constructor(props: IChartAnnotation) {
    makeObservable(this);
    Object.assign(this, props);
  }

  public setShowingExpandLabel(val: boolean) {
    this.showingExpandLabel = val;
  }

  public get formatted() {
    let formatted: any = {
      borderColor: this.color,
      borderWidth: this.thickness
    };

    if (this.type === "horizontalLine") {
      formatted = {
        type: "line",
        mode: "horizontal",
        scaleID: "y-axis-0",
        value: this.value,
        label: {
          position: "right"
        },
        ...formatted
      };
    } else if (this.type === "verticalLine") {
      formatted = {
        type: "line",
        mode: "vertical",
        scaleID: "x-axis-0",
        value: this.value,
        label: {
          position: this.labelPosition ? this.labelPosition : "top",
          fontFamily: this.fontFamily ? this.fontFamily : undefined,
          fontSize: this.fontSize ? this.fontSize : 20,
          cornerRadius: 20,
          labelHeight: 16,
          yPadding: 2,
          xPadding: 2,
          content: this.value
          // Future release of chartjs-plugin-annotation will support rotating labels
          // - the code is in their master branch, not yet released.
          // rotation: 90
        },
        ...formatted
      };
    } else if (this.type === "box") {
      const { xMin, xMax, yMin, yMax } = this;
      formatted = {
        type: "box",
        drawTime: "beforeDatasetsDraw",
        xScaleID: "x-axis-0",
        yScaleID: "y-axis-0",
        backgroundColor: this.color,
        xMin, xMax, yMin, yMax,
        ...formatted
      };
    }

    if (this.label) {
      const content = this.showingExpandLabel ? this.expandLabel : this.label;
      const xAdjust = this.showingExpandLabel ? this.expandOffset : this.labelXOffset;

      formatted.label = {
        ...formatted.label,
        enabled: true,
        content,
        xAdjust,
        yAdjust: this.labelYOffset,
        fontColor: this.labelColor,
        backgroundColor: this.labelBackgroundColor
      };
    }

    if (this.dashArray && this.dashArray.length) {
      formatted.borderDash = this.dashArray;
    }

    if (this.expandLabel) {
      const expand = (val: boolean) => () => {
        this.setShowingExpandLabel(val);
        // this.chartInstance.update();
      };
      formatted.onMouseenter = () => this.setShowingExpandLabel(true);
      formatted.onMouseleave = () => this.setShowingExpandLabel(false);
      formatted.onClick = () => this.setShowingExpandLabel(!this.showingExpandLabel);
    }
    return formatted;
  }

  public setValue(value: number) {
    this.value = value;
  }

  public setBounds(bounds: { xMin?: number, xMax?: number, yMin?: number, yMax?: number }) {
    if (bounds.xMin) this.xMin = bounds.xMin;
    if (bounds.xMax) this.xMax = bounds.xMax;
    if (bounds.yMin) this.yMin = bounds.yMin;
    if (bounds.yMax) this.yMax = bounds.yMax;
  }
}
