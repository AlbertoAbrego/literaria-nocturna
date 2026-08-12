import type { PropsWithChildren } from "react";

function PageContainer({ children }: PropsWithChildren) {
  return <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6">{children}</div>;
}

export default PageContainer;
