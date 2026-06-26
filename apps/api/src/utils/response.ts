// Re-export from shared package — single source of truth
import { success as sharedSuccess, error as sharedError } from '@epowerfix/utils'
export { sharedSuccess as success, sharedError as error }
