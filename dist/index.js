const { parse } = require('@babel/parser');
const generate = require('@babel/generator').default;
const t = require('@babel/types');
const traverse = require('@babel/traverse').default;
const childProcess = require('child_process');

const userName = childProcess.execSync(`git config user.name`, { encoding: 'utf-8' }).trim();

function removeOthersConsoleLoader(source) {
  const callback = this.async();
  const id = this.resourcePath;
  // 排除 node_modules
  if (id.includes('node_modules')) {
    return callback(null, source);
  }

  let result;

  // 如果当前文件没有当前作者，就全局替换，无需使用 ast
  const authorList = childProcess.execSync(`git log --pretty="%an" -- ${id}`, {
    encoding: 'utf-8',
  });
  if (!authorList.includes(userName)) {
    const newCode = source.replace(
      /console\.log\((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*\)[;\n]?/g,
      '{}\n',
    );
    result = {
      code: newCode,
      map: null,
    };
    return callback(null, newCode, null);
  }
  // 初始化 ast
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript', 'classProperties'],
  });

  const consoleLogLines = [];

  const visitor = {
    CallExpression(path) {
      if (
        t.isMemberExpression(path.node.callee) &&
        t.isIdentifier(path.node.callee.object, { name: 'console' }) &&
        t.isIdentifier(path.node.callee.property, { name: 'log' })
      ) {
        const line = path.node.loc.start.line;
        consoleLogLines.push(line);
      }
    },
  };

  traverse(ast, visitor);

  const removeLines = consoleLogLines.filter((line) => {
    const authorInfo = childProcess.execSync(`git blame -L ${line},${line} --porcelain ${id}`, {
      encoding: 'utf-8',
    });
    const authorMatch = authorInfo.match(/^author (.*)$/m);
    const author = authorMatch ? authorMatch[1].trim() : '';
    if (author !== userName && author !== 'Not Committed Yet') {
      return true;
    }
    return false;
  });

   // 遍历AST并替换console.log
   traverse(ast, {
    CallExpression(path) {
      if (removeLines.includes(path.node.loc.start.line)) {
        const emptyObjectExpression = t.objectExpression([]);
        // 设置空对象的 trailingComments 来保留换行效果
        emptyObjectExpression.trailingComments = [{ type: "CommentLine", value: "" }];
        path.replaceWith(emptyObjectExpression);
      }
    },
  });

  result = generate(ast).code;
  return callback(null, result, null);
}

module.exports = removeOthersConsoleLoader;
