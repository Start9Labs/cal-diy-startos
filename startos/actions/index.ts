import { sdk } from '../sdk'
import { manageSmtp } from './manageSmtp'
import { resetPassword } from './resetPassword'
import { setPrimaryUrl } from './setPrimaryUrl'
import { setupJitsi } from './setupJitsi'
import { toggleSignup } from './toggleSignup'

export const actions = sdk.Actions.of()
  .addAction(setPrimaryUrl)
  .addAction(manageSmtp)
  .addAction(setupJitsi)
  .addAction(toggleSignup)
  .addAction(resetPassword)
