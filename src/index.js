const childProcess = require('child_process')
const os = require('os');

const userName = childProcess.execSync(`git config user.name`, { encoding: 'utf-8' })
const isWin = os.type() === 'Windows_NT'

module.exports = function (code) {
  const id = this.resourcePath

  const findStr = isWin ? 'findstr' : 'grep'

  if (!id.includes('node_modules') && code.includes(`console.log(`)) {
    
    const rows = code.split('\n')

    const includesLines = rows
      .map((row, idx) => row.includes(`console.log(`) ? idx : undefined)
      .filter(n => n)

    const removeLine = includesLines.filter(line => {
      const authorInfo = childProcess.execSync(
        `git blame -L ${line+1},${line+1} --porcelain ${id} | ${findStr} "^author "`,
        { encoding: 'utf-8' }
      )

      const author = authorInfo
        .slice(authorInfo.indexOf(`author `) + 7)
        .split('\n')[0]
      
   
      return ![userName, `Not Committed Yet`].includes(author)
    })

    return rows.map((row, idx) => {
      if (removeLine.includes(idx)) {
        
        return row.replace(/console\.log\((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*\)[;\n]?/g, '')
      }
      return row
    }).join(`\n`)
  }
  return code
}