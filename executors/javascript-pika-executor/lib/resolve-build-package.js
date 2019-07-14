module.exports = id =>
  require.resolve(id, {
    paths: [__dirname]
  })
