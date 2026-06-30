import { apiPost } from '@/shared/api/client'

import type { CreateTransferPayload, Transfer } from '../model/types'

const TRANSFER_PATH = '/transfer'

export function createTransfer(
  payload: CreateTransferPayload,
): Promise<Transfer> {
  return apiPost<Transfer>(TRANSFER_PATH, payload)
}
