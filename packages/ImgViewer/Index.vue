<template>
  <transition name="viewer-fade">
    <div v-if="visible" tabindex="-1" ref="viewer-wrapper" class="viewer-wrapper" :style="{ 'z-index': zIndex }">
      <!-- 蒙层 -->
      <div class="viewer-bg"></div>
      <!-- 关闭按钮 -->
      <span class="viewer-btn viewer-btn-close" @click="hide">
        <i class="iconfont icon-circle-close"></i>
      </span>
      <!-- arrow按钮 -->
      <template v-if="!isSingle">
        <span
          class="viewer-btn viewer-btn-prev"
          :class="{ 'is-disabled': !infinite && isFirst }"
          @click="prev">
          <i class="iconfont icon-arrow-left"></i>
        </span>
        <span
          class="viewer-btn viewer-btn-next"
          :class="{ 'is-disabled': !infinite && isLast }"
          @click="next">
          <i class="iconfont icon-arrow-right"></i>
        </span>
      </template>
      <!-- actions按钮组 -->
      <div class="viewer-btn viewer-btn-actions">
        <div class="viewer-btn-actions-inner">
          <i class="iconfont icon-zoom-out" @click="handleActions('zoomOut')"></i>
          <i class="iconfont icon-zoom-in" @click="handleActions('zoomIn')"></i>
          <i :class="mode.icon" @click="toggleMode"></i>
          <i class="iconfont icon-refresh-left" @click="handleActions('anticlocelise')"></i>
          <i class="iconfont icon-refresh-right" @click="handleActions('clocelise')"></i>
        </div>
      </div>
      <!-- canvas -->
      <div class="viewer-canvas">
        <img
          ref="img"
          :src="currentImg"
          :style="imgStyle"
          @load="handleImgLoad"
          @error="handleImgError"
          @mousedown="handleMouseDown"
          :key="index"
          alt="">
      </div>
    </div>
  </transition>
</template>

<script>
const Mode = {
  CONTAIN: {
    name: 'contain',
    icon: 'iconfont icon-full-screen'
  },
  ORIGINAL: {
    name: 'original',
    icon: 'iconfont icon-c-scale-to-original'
  }
}
const mousewheelEventName = window.navigator.userAgent.match(/firefox/i) ? 'DOMMouseScroll' : 'mousewheel'
export default {
  name: 'ImgViewer',
  data () {
    return {
      infinite: true,
      index: this.initialIndex,
      transform: {
        scale: 1,
        deg: 0,
        offsetX: 0,
        offsetY: 0,
        enableTransition: false
      },
      mode: Mode.CONTAIN,
      loading: false
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    urlList: {
      type: Array,
      default: () => []
    },
    zIndex: {
      type: Number,
      default: 2000
    },
    initialIndex: {
      type: Number,
      default: 0
    }
  },
  watch: {
    visible: {
      handler (val) {
        if (val) {
          this.$nextTick(_ => {
            this.deviceSupportInstall()
            this.$refs['viewer-wrapper'].focus()
          })
        }
      },
      immediate: true
    },
    index: {
      handler: function (val) {
        this.reset()
        this.$emit('switch', val)
      }
    },
    currentImg (val) {
      this.$nextTick(_ => {
        const $img = this.$refs.img
        if (!$img.complete) {
          this.loading = true
        }
      })
    }
  },
  computed: {
    isSingle () {
      return this.urlList.length <= 1
    },
    isFirst () {
      return this.index === 0
    },
    isLast () {
      return this.index === this.urlList.length - 1
    },
    imgStyle () {
      const { scale, deg, offsetX, offsetY, enableTransition } = this.transform
      const style = {
        transform: `scale(${scale}) rotate(${deg}deg)`,
        transition: enableTransition ? 'transform .3s' : '',
        'margin-left': `${offsetX}px`,
        'margin-top': `${offsetY}px`
      }
      if (this.mode === Mode.CONTAIN) {
        style.maxWidth = style.maxHeight = '100%'
      }
      return style
    },
    currentImg () {
      return this.urlList[this.index]
    }
  },
  methods: {
    hide () {
      this.deviceSupportUninstall()
      this.$emit('update:visible', false)
    },
    reset () {
      this.transform = {
        scale: 1,
        deg: 0,
        offsetX: 0,
        offsetY: 0,
        enableTransition: false
      }
    },
    prev () {
      if (this.isFirst && !this.infinite) return
      const len = this.urlList.length
      this.index = (this.index - 1 + len) % len
    },
    next () {
      if (this.isLast && !this.infinite) return
      const len = this.urlList.length
      this.index = (this.index + 1) % len
    },
    rafThrottle (fn) {
      let locked = false
      return function (...args) {
        if (locked) return
        locked = true
        window.requestAnimationFrame(_ => {
          fn.apply(this, args)
          locked = false
        })
      }
    },
    deviceSupportInstall () {
      this._keyDownHandler = this.rafThrottle(e => {
        const keyCode = e.keyCode
        switch (keyCode) {
          // ESC
          case 27:
            this.hide()
            break
          // SPACE
          case 32:
            this.toggleMode()
            break
          // LEFT_ARROW
          case 37:
            this.prev()
            break
          // UP_ARROW
          case 38:
            this.handleActions('zoomIn')
            break
          // RIGHT_ARROW
          case 39:
            this.next()
            break
          // DOWN_ARROW
          case 40:
            this.handleActions('zoomOut')
            break
        }
      })
      this._mouseWheelHandler = this.rafThrottle(e => {
        const delta = e.wheelDelta ? e.wheelDelta : -e.detail
        if (delta > 0) {
          this.handleActions('zoomIn', {
            zoomRate: 0.015,
            enableTransition: false
          })
        } else {
          this.handleActions('zoomOut', {
            zoomRate: 0.015,
            enableTransition: false
          })
        }
      })
      document.addEventListener('keydown', this._keyDownHandler, false)
      document.addEventListener(mousewheelEventName, this._mouseWheelHandler, false)
    },
    deviceSupportUninstall () {
      document.removeEventListener('keydown', this._keyDownHandler)
      document.removeEventListener(mousewheelEventName, this._mouseWheelHandler)
      this._keyDownHandler = null
      this._mouseWheelHandler = null
    },
    handleImgLoad (e) {
      this.loading = false
    },
    handleImgError (e) {
      this.loading = false
      e.target.alt = '加载失败'
    },
    handleMouseDown (e) {
      if (this.loading || e.button !== 0) return
      const { offsetX, offsetY } = this.transform
      const startX = e.pageX
      const startY = e.pageY
      this._dragHandler = this.rafThrottle(ev => {
        this.transform.offsetX = offsetX + ev.pageX - startX
        this.transform.offsetY = offsetY + ev.pageY - startY
      })
      document.addEventListener('mousemove', this._dragHandler, false)
      document.addEventListener('mouseup', _ => {
        document.removeEventListener('mousemove', this._dragHandler, false)
      })
      e.preventDefault()
    },
    toggleMode () {
      if (this.loading) return
      const modeNames = Object.keys(Mode)
      const modeValues = Object.values(Mode)
      const index = modeValues.indexOf(this.mode)
      const nextIndex = (index + 1) % modeNames.length
      this.mode = Mode[modeNames[nextIndex]]
      this.reset()
    },
    handleActions (action, options = {}) {
      if (this.loading) return
      const { zoomRate, rotateDeg, enableTransition } = {
        zoomRate: 0.2,
        rotateDeg: 90,
        enableTransition: true,
        ...options
      }
      const { transform } = this
      switch (action) {
        case 'zoomOut':
          if (transform.scale > 0.2) {
            transform.scale = parseFloat((transform.scale - zoomRate).toFixed(3))
          }
          break
        case 'zoomIn':
          transform.scale = parseFloat((transform.scale + zoomRate).toFixed(3))
          break
        case 'clocelise':
          transform.deg += rotateDeg
          break
        case 'anticlocelise':
          transform.deg -= rotateDeg
          break
      }
      transform.enableTransition = enableTransition
    }
  }
}
</script>

<style lang="scss" scoped>
  @import url('//at.alicdn.com/t/font_1791574_hcoijvl7xo8.css');
  .viewer-wrapper{
    position:fixed;
    top:0;right:0;
    bottom:0;
    left:0;
    .viewer-bg{
      position:absolute;
      width:100%;
      height:100%;
      top:0;
      left:0;
      opacity:.5;
      background:#000
    }
    .viewer-btn{
      position: absolute;
      z-index: 1;
      opacity: .8;
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
      justify-content: center;
      i{
        font-size: inherit;
      }
    }
    .viewer-btn-close{
      border-radius: 50%;
      color: #fff;
      background: rgba(0, 0, 0, 0.5);
      top: 40px;
      right: 40px;
      width: 40px;
      height: 40px;
      font-size: 40px;
      line-height: 40px;
    }
    .viewer-btn-prev{
      border-radius: 50%;
      color: #fff;
      background: rgba(0, 0, 0, 0.5);
      top: 50%;
      left: 40px;
      transform: translateY(-50%);
      width: 44px;
      height: 44px;
      font-size: 24px;
      border-color: #fff;
      line-height: 24px;
    }
    .viewer-btn-next{
      border-radius: 50%;
      color: #fff;
      background: rgba(0, 0, 0, 0.5);
      top: 50%;
      right: 40px;
      transform: translateY(-50%);
      width: 44px;
      height: 44px;
      font-size: 24px;
      border-color: #fff;
      line-height: 24px;
    }
    .viewer-btn-actions{
      color: #fff;
      border-color: #fff;
      left: 50%;
      bottom: 30px;
      transform: translateX(-50%);
      width: 282px;
      height: 44px;
      padding: 0 23px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 22px;
      cursor: default;
      .viewer-btn-actions-inner{
        width: 100%;
        height: 100%;
        text-align: justify;
        font-size: 23px;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: space-around;
        i{
          cursor: pointer;
        }
      }
    }
    .viewer-canvas{
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
  .viewer-fade-enter-active {
    animation: viewer-fade-in 0.3s;
  }
  .viewer-fade-leave-active {
    animation: viewer-fade-out 0.3s;
  }
  @-webkit-keyframes viewer-fade-in {
    0% {
      transform: translate3d(0, -20px, 0);
      opacity: 0;
    }
    100% {
      transform: translate3d(0, 0, 0);
      opacity: 1;
    }
  }
  @keyframes viewer-fade-in {
    0% {
      transform: translate3d(0, -20px, 0);
      opacity: 0;
    }
    100% {
      transform: translate3d(0, 0, 0);
      opacity: 1;
    }
  }
  @-webkit-keyframes viewer-fade-out {
    0% {
      transform: translate3d(0, 0, 0);
      opacity: 1;
    }
    100% {
      transform: translate3d(0, -20px, 0);
      opacity: 0;
    }
  }
  @keyframes viewer-fade-out {
    0% {
      transform: translate3d(0, 0, 0);
      opacity: 1;
    }
    100% {
      transform: translate3d(0, -20px, 0);
      opacity: 0;
    }
  }
</style>
