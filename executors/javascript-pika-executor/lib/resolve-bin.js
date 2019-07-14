module.exports = name => require.resolve(`.bin/${name}`, { paths: [__dirname] })
