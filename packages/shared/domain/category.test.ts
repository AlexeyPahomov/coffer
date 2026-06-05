import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  carryOverPolicyFromCheckbox,
  defaultCarryOverPolicy,
  isCarryOverEnabled,
  resolveCarryOverPolicy,
} from './category.js'

describe('carry over policy helpers', () => {
  it('defaults expense categories to CARRY', () => {
    assert.equal(defaultCarryOverPolicy('expense'), 'CARRY')
    assert.equal(defaultCarryOverPolicy('income'), 'RESET')
    assert.equal(defaultCarryOverPolicy('savings'), 'RESET')
  })

  it('resolves explicit policy or falls back to type default', () => {
    assert.equal(resolveCarryOverPolicy('expense', 'RESET'), 'RESET')
    assert.equal(resolveCarryOverPolicy('expense', undefined), 'CARRY')
  })

  it('maps checkbox state to policy', () => {
    assert.equal(isCarryOverEnabled('CARRY'), true)
    assert.equal(isCarryOverEnabled('RESET'), false)
    assert.equal(carryOverPolicyFromCheckbox(true), 'CARRY')
    assert.equal(carryOverPolicyFromCheckbox(false), 'RESET')
  })
})
