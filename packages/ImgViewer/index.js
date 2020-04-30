
// packages/ImgViewer/index.js

// 导入组件，组件必须声明 name
import ImgViewer from './src/Index.vue'

// 为组件添加 install 方法，用于按需引入
ImgViewer.install = function (Vue) {
  Vue.component(ImgViewer.name, ImgViewer)
}

export default ImgViewer
