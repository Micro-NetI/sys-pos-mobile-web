"use client";

import {
  Toast,
} from "@heroui/react";

export default function POSMobileToastProvider() {
  return (
    <Toast.Provider
      placement="top end"
      maxVisibleToasts={3}
      width={440}
    />
  );
}