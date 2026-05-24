<script setup lang='ts'>
const props = withDefaults(defineProps<{
    color?: 'red' | 'yellow' | 'blue' | 'zinc' | 'primary'
}>(), {
    color: 'primary'
})

const colorClasses = computed(() => {
    const colors = {
        red: 'text-white bg-red-500 hover:bg-red-600 disabled:bg-red-600 outline-red-500/50',
        yellow: 'text-white bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-600 outline-yellow-500/50',
        blue: 'text-white bg-blue-500 hover:bg-blue-600 disabled:bg-blue-600 outline-blue-500/50',
        green: 'text-white bg-green-500 hover:bg-green-600 disabled:bg-green-600 outline-green-500/50',
        zinc: 'text-white bg-zinc-500 hover:bg-zinc-600 disabled:bg-zinc-600 outline-zinc-500/50',
        primary: 'text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-700 outline-primary-600/50 '
    }
    return colors[props.color]
})
</script>

<template lang='pug'>
button.transition-all.cursor-pointer.relative.px-4.py-2.rounded-md.font-semibold.flex.items-center.transition-colors.duration-200.ease-in-out(
    :class='colorClasses'
    class='disabled:cursor-wait'
    ref='button'
    @click="$refs.button.setAttribute('loading', 'true'); $refs.button.setAttribute('disabled', 'true')"
)
  loader.transition-all.w-4.h-4.absolute.left-3.mr-1.opacity-0
  slot
</template>

<style>


button[loading='true'] {
    padding-left: 2.5rem;
    -moz-transition: padding-left .1s ease-in;
    -o-transition: padding-left .1s ease-in;
    -webkit-transition: padding-left .1s ease-in;
    transition: padding-left .1s ease-in;
}
button[loading='true'] > svg {
    display: block;
    opacity: 1;
}
</style>
