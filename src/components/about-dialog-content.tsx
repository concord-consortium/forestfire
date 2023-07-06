import * as React from "react";
import { Copyright } from "./geohazard-components/top-bar/copyright";

export const AboutDialogContent = () => (
  <div>
    <p>
      Scientists use models to help them understand the effects of wildfires on different ecosystems. As the climate
      changes, it is especially important to understand how more frequent forest fires in the same area influence forest
      succession. Use this model to investigate forest succession in a boreal forest environment.
    </p>
    <p>
      Click Fire Event to place sparks on the map. Run the model.
    </p>
    <p>
      Observe how the fire moves across the landscape under different wind conditions and over different types of
      vegetation at varying intensity.
    </p>
    <p>
      Click the Graph tab. Notice how the percentage of vegetation changes as fires burn and the forest regrows. How
      long does it take for coniferous trees to return to the landscape after a fire?
    </p>
    <p>
      Ignite as many Fire Events as you would like over the 240 years time period. Change the Map Type to Fire History
      to see the areas of the map that have experienced multiple burns. If the area experiences multiple fires, does
      the forest ever regrow completely?
    </p>
    <p>
      Boreal Forest Fire Explorer was created
      by <a href="https://github.com/pjanik" target="_blank" rel="noreferrer">Piotr Janik</a> from&nbsp;
      <a href="https://concord.org" target="_blank" rel="noreferrer">the Concord Consortium</a> and developed under
      two National Science Foundation grants:&nbsp;
      <a href="https://concord.org/our-work/research-projects/geohazard/" target="_blank" rel="noreferrer">
        GeoHazard: Modeling Natural Hazards and Assessing Risks
      </a> (DRL-1812362) and Collaborative Research: The Past, Present, and Future of Boreal Fire Feedbacks
      (ANS-2215118).
    </p>
    <Copyright licenseUrl="https://github.com/concord-consortium/forestfire/blob/master/LICENSE" />
  </div>
);
