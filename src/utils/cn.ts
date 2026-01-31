export type ClassValue = string | number | null | false | undefined

export function cn(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(' ')
}
