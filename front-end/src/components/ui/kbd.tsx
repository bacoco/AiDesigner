import { cn } from "@/lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "bg-zinc-100 text-zinc-500 pointer-events-none inline-flex h-5 w-fit min-w-5 select-none items-center justify-center gap-1 rounded-sm px-1 font-sans text-xs font-medium dark:bg-zinc-800 dark:text-zinc-400",
        "[&_svg:not([class*='size-'])]:size-3",
        "[[data-slot=tooltip-content]_&]:bg-white/20 [[data-slot=tooltip-content]_&]:text-white dark:[[data-slot=tooltip-content]_&]:bg-white/10 dark:[[data-slot=tooltip-content]_&]:bg-zinc-950/20 dark:[[data-slot=tooltip-content]_&]:text-zinc-950 dark:dark:[[data-slot=tooltip-content]_&]:bg-zinc-950/10",
        className
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
