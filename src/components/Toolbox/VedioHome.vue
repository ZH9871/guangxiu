<template>
  <div class="video-container">
    <video id="videoPlayer" :src="videoUrl" autoplay></video>
  </div>
</template>
<script setup>
import {ref,computed,onMounted} from "vue";
const videoPlayer = ref(null);
import videoUrl1 from '@/assets/h1.mp4';
import videoUrl2 from '@/assets/h2.mp4';
import videoUrl3 from '@/assets/h3.mp4';
import videoUrl4 from '@/assets/h4.mp4';
import videoUrl5 from '@/assets/h5.mp4';
import videoUrl6 from '@/assets/h6.mp4';
import videoUrl7 from '@/assets/h7.mp4';
import videoUrl8 from '@/assets/h8.mp4';
import videoUrl9 from '@/assets/h9.mp4';
import videoUrl10 from '@/assets/h10.mp4';
const videoList = [
  {
    url: videoUrl1
  },
  {
    url: videoUrl3
  },
  {
    url: videoUrl4
  },
  {
    url: videoUrl2
  },
  {
    url: videoUrl10
  },
  {
    url: videoUrl8
  },
  {
    url: videoUrl6
  },
  {
    url: videoUrl7
  },
  {
    url: videoUrl9
  },
];

const currentIndex = ref(0);
const loopCount = ref(0);

// 当前播放的视频
const currentVideo = computed(() => {
  return videoList[currentIndex.value];
});

// 视频总数
const videoCount = computed(() => {
  return videoList.length;
});

// 切换到下一个视频
const nextVideo = () => {
  console.log(66)
  currentIndex.value = (currentIndex.value + 1) % videoList.length;
  if(currentIndex.value === 0) {
    loopCount.value++;
  }
  // 更新视频源
  if(videoPlayer.value) {
    videoPlayer.value.src = currentVideo.value.url;

    // iOS 设备需要显式调用 play()
    videoPlayer.value.load();
    const playPromise = videoPlayer.value.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // 自动播放被阻止时静音播放
        videoPlayer.value.muted = true;
        videoPlayer.value.play();
      });
    }
  }
};

// 初始化视频播放器
const initVideo = () => {
  videoPlayer.value=document.getElementById("videoPlayer")
  if(!videoPlayer.value) return;

  // 初始化播放第一个视频
  videoPlayer.value.src = currentVideo.value.url;
  console.log(videoPlayer.value.src)
  // 监听视频播放结束事件
  videoPlayer.value.addEventListener('ended', nextVideo);

  // 禁用右键菜单
  videoPlayer.value.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // 确保自动播放和静音处理
  videoPlayer.value.muted = true;
  videoPlayer.value.setAttribute('playsinline', '');
  videoPlayer.value.setAttribute('autoplay', '');

  // 尝试播放
  videoPlayer.value.play().catch(() => {
    // 自动播放被阻止时静音播放
    videoPlayer.value.muted = true;
    videoPlayer.value.play();
  });
};

// 组件挂载后初始化
onMounted(initVideo);

</script>
<style>
.video-container {
  position: fixed;
  top:10dvh;
  left: 0;
  width: 100vw;
  height: 90vh;
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center;     /* 垂直居中 */
  background-color: whitesmoke; /* 如果有黑边，背景设为黑色 */
}
.video-container video {
  height: 100%;
  object-fit: cover;
}
</style>