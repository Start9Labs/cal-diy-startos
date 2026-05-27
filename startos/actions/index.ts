import { sdk } from '../sdk'
import { manageSmtp } from './manageSmtp'
import { resetPassword } from './resetPassword'
import { setPrimaryUrl } from './setPrimaryUrl'
import { toggleSignup } from './toggleSignup'

export const actions = sdk.Actions.of()
  .addAction(setPrimaryUrl)
  .addAction(manageSmtp)
  .addAction(toggleSignup)
  .addAction(resetPassword)
