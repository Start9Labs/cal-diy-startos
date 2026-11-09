import { primaryUrl } from '../primaryUrl'
import { sdk } from '../sdk'
import { chooseApps } from './chooseApps'
import { inviteOrganizerDomains } from './inviteOrganizerDomains'
import { manageSmtp } from './manageSmtp'
import { manageStripe } from './manageStripe'
import { resetPassword } from './resetPassword'
import { toggleSignup } from './toggleSignup'

export const actions = sdk.Actions.of()
  .addAction(primaryUrl.action)
  .addAction(manageSmtp)
  .addAction(manageStripe)
  .addAction(chooseApps)
  .addAction(inviteOrganizerDomains)
  .addAction(toggleSignup)
  .addAction(resetPassword)
