<template>
  <div class="flex flex-col justify-center justify-items-center align-middle"
  style="align-items: center">
    <div class="random-text-banner relative overflow-hidden bg-transparent rounded-lg">
      <div
          v-if="activeText"
          class="absolute w-full text-center transition-all duration-1000 ease-in-out"
          :class="textClasses"
          :style="{
        transform: `translateY(${textPosition}px)`,
        opacity: textOpacity
      }"
      >
        {{ activeText }}
      </div>
    </div>
    <div class="bg-white rounded-2xl overflow-hidden transition-all w-40 duration-300">

      <video
          autoplay
          loop
          ref="videoPlayer2"
          id="videoPlayer2"
          class="w-full z-99"
          muted
      >
      </video>
    </div>
  </div>

</template>

<script setup>

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {little_knowledges} from '@/store'
const props = defineProps({
  texts: {
    type: Array,
    default: () => little_knowledges
  },
  interval: {
    type: Number,
    default: 3500
  },
  textSize: {
    type: String,
    default: 'text-3xl'
  },
  fontStyle: {
    type: String,
    default: 'font-bold'
  },
  animationDuration: {
    type: Number,
    default: 200
  },
  startPosition: {
    type: Number,
    default: 20
  },
  endPosition: {
    type: Number,
    default: 20
  },
  showDebug: {
    type: Boolean,
    default: false
  },
  gray: {
    type: Boolean,
    default: false
  }
})



// 响应式数据
const activeIndex = ref(-1)
const textPosition = ref(props.startPosition)
const textOpacity = ref(0)
const containerHeight = ref(0)
const containerWidth = ref(0)
const animationRunning = ref(false)

// 计算当前显示的文本
const activeText = computed(() => {
  return props.texts[activeIndex.value] || ''
})

// 文本样式
const textClasses = computed(() => {
  return [
    props.textSize,
    props.fontStyle,
    'text-white drop-shadow-lg'
  ]
})

// 轮播动画
const animateText = () => {
  if (animationRunning.value) return
  if (props.texts.length === 0) return

  animationRunning.value = true

  // 获取下一个不重复的随机索引
  let newIndex
  do {
    newIndex = Math.floor(Math.random() * props.texts.length)
  } while (props.texts.length > 1 && newIndex === activeIndex.value)

  activeIndex.value = newIndex

  // 开始动画
  textPosition.value = props.startPosition
  textOpacity.value = 0

  // 淡入动画
  setTimeout(() => {
    textPosition.value = 0
    textOpacity.value = 1
  }, 100)

  // 在轮播间隔后触发淡出
  setTimeout(() => {
    textPosition.value = props.endPosition
    textOpacity.value = 0
    // 准备下一次轮播
    setTimeout(() => {
      animationRunning.value = false
    }, props.animationDuration)
  }, props.interval - props.animationDuration)
}

// 开始轮播
const startCarousel = () => {
  if (props.texts.length === 0) return
  activeIndex.value = Math.floor(Math.random() * props.texts.length)

  setInterval(() => {
    animateText()
  }, props.interval)
}

// 响应容器尺寸变化
const updateDimensions = () => {
  const banner = document.querySelector('.random-text-banner')
  if (banner) {
    containerHeight.value = banner.clientHeight
    containerWidth.value = banner.clientWidth
  }
}
var videoPlayer2=ref(null);
import videoUrl2 from '@/assets/gen_animation2.mp4';

// 生命周期钩子
onMounted(() => {
  updateDimensions()
  startCarousel()
  videoPlayer2.value=document.getElementById("videoPlayer2")
  videoPlayer2.value.src=videoUrl2
  // 监听窗口大小变化
  window.addEventListener('resize', updateDimensions)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateDimensions)
})

// 观察texts变化
watch(() => props.texts, (newTexts) => {
  if (newTexts.length > 0) {
    updateDimensions()
  }
})
</script>

<style scoped>
.random-text-banner {
  height: 150px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent !important;
  position: relative;
}

/* 响应式调整高度 */
@media (min-width: 768px) {
  .random-text-banner {
    height: 200px;
  }
}

@media (min-width: 1024px) {
  .random-text-banner {
    height: 200px;
  }
}

@keyframes gradientAnimation {
  0% { background-position: 0% 50% }
  50% { background-position: 100% 50% }
  100% { background-position: 0% 50% }
}



video::-webkit-media-controls-play-button,
video::-webkit-media-controls-volume-slider {
  filter: invert(20%);
}
</style>