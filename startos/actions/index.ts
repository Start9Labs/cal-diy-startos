import { sdk } from '../sdk'
import { manageSmtp } from './manageSmtp'
import { setPrimaryUrl } from './setPrimaryUrl'

export const actions = sdk.Actions.of()
  .addAction(setPrimaryUrl)
  .addAction(manageSmtp)
