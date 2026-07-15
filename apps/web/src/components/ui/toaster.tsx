"use client"

import type { ComponentProps } from "react"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && (
                <ToastTitle>
                  {title as ComponentProps<typeof ToastTitle>["children"]}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription>
                  {description as ComponentProps<typeof ToastDescription>["children"]}
                </ToastDescription>
              )}
            </div>
            {action as ComponentProps<typeof Toast>["children"]}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}