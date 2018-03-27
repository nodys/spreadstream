const miss = require('mississippi')

/**
 * Create a classic json output stream (write a json array)
 * @return {stream.Passthrough}
 */
exports.classicJsonOutputStream = function classicJsonOutputStream (replacer = null, space = 2) {
  let first = true
  return miss.through.obj(function (data, enc, next) {
    let chunk = ''
    if (first) {
      chunk = '[\n'
    }
    if (!first) {
      chunk += ',\n'
    }
    chunk += JSON.stringify(data, replacer, space).split('\n').map(r => `  ${r}`).join('\n')
    if (first) {
      first = false
    }
    this.push(chunk)
    next()
  }, function (done) {
    this.push('\n]\n')
    done()
  })
}

/**
 * Create a classic json input stream (read a json array)
 * @return {stream.Passthrough}
 */
exports.classicJsonInputStream = function classicJsonInputStream () {
  let buffer = []
  return miss.through.obj(function (chunk, enc, next) {
    buffer.push(chunk.toString())
    next()
  }, function (done) {
    let data
    try {
      data = JSON.parse(buffer.join(''))
    } catch (error) {
      return done(new Error(`Invalid input type: unable to parse (original message: ${error.message})`))
    }
    if (!Array.isArray(data)) {
      return done(new Error('Invalid input type: array expected with classic json stream'))
    }
    for (let row of data) {
      this.push(row)
    }
    done()
  })
}
