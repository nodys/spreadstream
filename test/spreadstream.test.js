/* eslint-env mocha */
/* eslint-disable no-unused-expressions */ /* for chai */

// Tip: Hey, u need a konami code to switch to level 3 ? try `npx mocha --inspect-brk`

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Chai promise support
chai.use(chaiAsPromised)

const { expect } = chai // eslint-disable-line no-unused-vars

describe('spreadstream', function () {
  it.skip('todo')
})
