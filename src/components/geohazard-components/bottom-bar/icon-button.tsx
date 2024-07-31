import * as React from "react";
import Button from "@mui/material/Button";
import { clsx } from "clsx";
import css from "./icon-button.scss";

interface IProps {
  icon: JSX.Element;
  highlightIcon: JSX.Element;
  buttonText?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  selected?: boolean;
  disabled?: boolean;
  dataTest?: string;
  className?: string;
}

export const IconButton = ({ className, icon, highlightIcon, onClick, disabled, selected, buttonText, dataTest }: IProps) => (
  <Button
    onClick={onClick}
    className={clsx(css.iconButton, className, { [css.disabled]: disabled, [css.selected]: selected })}
    data-testid={dataTest ? dataTest : "icon-button"}
    disabled={disabled}
  >
    <span>
      <span className={clsx(css.icon, css.iconButtonHighlightSvg)}>{ highlightIcon }</span>
      <span className={css.icon}>{ icon }</span>
      <span className={css.iconButtonText}>{ buttonText }</span>
    </span>
  </Button>
);
