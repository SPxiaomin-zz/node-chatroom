# node(express) + socket.io 聊天室

## 制作总结

### 页面样式处理总结

- `div.wrapper` 部分

    - 设置 `::before ::after` 伪元素 `display: table` 产生 `bfc` 进而防止 `.banner` 中的 `h1` 的边距与其进行合并
    - 通过设置 `width` 并借助与 `margin: 0 auto` 进行水平居中
    
- `div.historyMsg` 部分

    - 通过设置 `webkit` 内核浏览器特有的滚动条样式进行样式处理
    
- `div.controls` 部分

    - `div#emojiWrapper` 通过设置 `position: absolute` 定位脱离文档流，并通过 `margin` 进行位置移动
    - `textarea` 由于其基线位于其底部，与右边的按钮中的文字默认是基线对齐的，通过设置 `vertical-align: bottom` 进行底部对齐

### 页面逻辑交互总结

- <http://www.cnblogs.com/Wayou/p/hichat_built_with_nodejs_socket.html>
