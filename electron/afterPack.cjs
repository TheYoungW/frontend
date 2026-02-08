const fs = require('fs')
const path = require('path')

module.exports = async (context) => {
  const resourcesPath = context.appOutDir
  const backendPath = path.join(
    resourcesPath,
    `${context.packager.appInfo.productFilename}.app`,
    'Contents',
    'Resources',
    'synria_backend',
    'synria_backend'
  )

  if (fs.existsSync(backendPath)) {
    fs.chmodSync(backendPath, 0o755)
  }
}
