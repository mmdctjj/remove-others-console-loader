## 🚀 remove-others-console-loader

去除其他开发者的console语句，仅保留自己的，让你的开发更清爽

Remove console statements from other developers and keep only your own, making your development more refreshing

### install
```
npm i remove-others-console-loader -D
```
### use

```js
module.exports = {
  module: {
    rules: [
      { test: /\.(js|ts|jsx|tsx|vue)$/, use: 'remove-others-console-loader' },
    ],
  },
};
```

### LICENSE
MIT