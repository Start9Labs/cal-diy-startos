import { sdk } from '../sdk'
import { manageSmtp } from './manageSmtp'
import { manageStripe } from './manageStripe'
import { resetPassword } from './resetPassword'
import { setPrimaryUrl } from './setPrimaryUrl'
import { toggleSignup } from './toggleSignup'

export const actions = sdk.Actions.of()
  .addAction(setPrimaryUrl)
  .addAction(manageSmtp)
  .addAction(manageStripe)
  .addAction(toggleSignup)
  .addAction(resetPassword)
