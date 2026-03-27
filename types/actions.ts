// types/actions.ts
// Type de retour uniforme pour toutes les Server Actions

export type ActionSuccess<T = void> = T extends void
    ? { success: true; message?: string }
    : { success: true; data: T; message?: string }

export type ActionError = { success: false; error: string }

export type ActionResult<T = void> = ActionSuccess<T> | ActionError
