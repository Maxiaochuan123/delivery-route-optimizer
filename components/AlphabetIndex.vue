<template>
  <div class="alphabet-index">
    <div
      v-for="letter in letters"
      :key="letter"
      :class="['letter-item', { active: letter === activeLetter }]"
      @click="handleLetterClick(letter)"
    >
      {{ letter }}
    </div>
  </div>
</template>

<script setup lang="ts">
// Props 定义
interface Props {
  letters: string[] // 可用的字母列表
  activeLetter?: string // 当前激活的字母
}

withDefaults(defineProps<Props>(), {
  activeLetter: undefined,
})

// Emits 定义
interface Emits {
  (e: 'letterClick', letter: string): void
}

const emit = defineEmits<Emits>()

// 处理字母点击事件
const handleLetterClick = (letter: string) => {
  emit('letterClick', letter)
}
</script>

<style scoped>
.alphabet-index {
  position: fixed;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 10;
}

.letter-item {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.letter-item:hover {
  color: #1976d2;
  transform: scale(1.2);
}

.letter-item.active {
  color: #1976d2;
  font-weight: 700;
  transform: scale(1.3);
}
</style>
