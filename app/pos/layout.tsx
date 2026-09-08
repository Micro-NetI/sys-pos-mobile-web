import type {
  ReactNode,
} from "react";

import PosLayoutClient from "./PosLayoutClient";


interface PosLayoutProps {
  children: ReactNode;
}

export default function PosLayout({
  children,
}: PosLayoutProps) {
  return (
    <>
      <PosLayoutClient>
        {children}
      </PosLayoutClient>

      {/* <POSMobileToastProvider /> */}
    </>
  );
}