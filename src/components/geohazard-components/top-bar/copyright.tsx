import * as React from "react";

export const Copyright = ({ licenseUrl }: { licenseUrl: string }) => (
  <p style={{ fontSize: "0.8em" }}>
    <b>Copyright © {(new Date()).getFullYear()}</b>&nbsp;
    <a href="http://concord.org" target="_blank" rel="noreferrer">
      The Concord Consortium
    </a>. All rights reserved. The software is licensed under the&nbsp;
    <a href={licenseUrl} target="_blank" rel="noreferrer">
      MIT
    </a> license. The content is licensed under a&nbsp;
    <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
    Creative Commons Attribution 4.0 International License
    </a>. Please provide attribution to the Concord Consortium and the URL&nbsp;
    <a href="http://concord.org" rel="noreferrer" target="_blank">http://concord.org</a>.
  </p>
);
