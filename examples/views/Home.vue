<template>
  <div class="home">
    <button @click="visible = true">图片预览</button>
    <img-viewer :visible.sync="visible" :url-list="urlList"/>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data () {
    return {
      visible: false,
      urlList: [
        require('../assets/img/bg1.jpg'),
        require('../assets/img/bg2.jpg'),
        require('../assets/img/bg3.jpg'),
        require('../assets/img/bg4.jpg'),
        require('../assets/img/bg5.jpg'),
        require('../assets/img/bg6.jpg'),
        require('../assets/img/bg7.jpg')
      ]
    }
  }
}
</script>
