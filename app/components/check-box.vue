<script setup lang="ts">
const modelValue = defineModel<boolean>({ default: false })
const emit = defineEmits<{ 
  update: [ payload: boolean ]
}>()

function onClick() {
  modelValue.value = !modelValue.value

  emit('update', modelValue.value)
}
</script>
<template lang="pug">
div#checkbox.w-4.h-4.rounded.border.shadow-lg.cursor-pointer(
  class='focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black'
  :class=`{
    'bg-primary dark:bg-primary border-primary-500 dark:border-primary-500 indigo-shadow active': modelValue === true,
    'border-gray-300 dark:border-gray-700 dark:bg-black bg-white': modelValue !== true
  }`
  @click='onClick'
  tabindex='0'
  @keydown.enter='onClick'
)
  i#checkbox
</template>
<style lang='css' scoped>
    .indigo-shadow {
        box-shadow: 0 0 15px rgb(99 102 241/var(--tw-bg-opacity));
    }
    .red-shadow {
        box-shadow: 0 0 15px rgb(239 68 68/var(--tw-bg-opacity));
    }
    .opacity-enter-active {
        animation: opacity-in .1s;
    }
    .opacity-leave-active {
        animation: opacity-in .1s reverse;
    }
    @keyframes opacity-in {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }
    #checkbox {
        position: relative;
        display: inline-block;
    }
    #checkbox i  {
        display: block;
        position: relative;
        width: 14px;
        height: 14px;
        margin-left: 5.83px;
        margin-top: 4.14px;
        transform: rotate(-45deg) translateX(0%) translateY(0%) scale(0.8);
        transform-origin: center left;
    }
    #checkbox i:before  {
        content: '';
        display: block;
        height: 0;
        top: 50%;
        left: 0;
        width: 2.1px;
    }
    #checkbox i:after  {
        content: '';
        display: block;
        width: 0;
        bottom: 0;
        left: 0;
        height: 2.1px;
    }
    #checkbox.active i:before  {
        height: 35%;
        border-radius: 4px 4px 0 0;
        transition: height 300ms cubic-bezier(0.895, 0.03, 0.685, 0.22);
        background: #FFFFFF;
        margin-bottom: -0.1px;
    }
    #checkbox.active i:after  {
        width: 80%;
        border-radius: 0 4px 4px 0;
        transition: width 300ms 300ms cubic-bezier(0.165, 0.84, 0.44, 1);
        background: #FFFFFF;
    }

    #checkbox.active i:before  {
        height: 35%;
        transition: height 300ms cubic-bezier(0.895, 0.03, 0.685, 0.22);
        background: #FFFFFF;
    }
    #checkbox.active i:after  {
        width: 80%;
        transition: width 300ms 300ms cubic-bezier(0.165, 0.84, 0.44, 1);
        background: #FFFFFF;
    }

    .fade-enter-active,
    .fade-leave-active {
        transition: opacity 0.2s ease;
    }

    .fade-enter-from,
    .fade-leave-to {
        opacity: 0;
    }
</style>