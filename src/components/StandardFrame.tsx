import React, { PropsWithChildren } from "react";

const StandardFrame: React.FC<PropsWithChildren> = ({ children }) => (
  <div className="grow px-3 lg:px-9 pb-12 pt-3 bg-[aliceblue]">{children}</div>
);

export default StandardFrame;
