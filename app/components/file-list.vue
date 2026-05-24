<template lang='pug'>
div.w-full.grid.gap-2
    div.group.w-full.relative.rounded-lg.overflow-hidden.border.border-zinc-200.h-24.flex.items-center.justify-center.bg-zinc-50(class='dark:border-zinc-700' v-for='(file, index) in data.files' :key='index')
        img.w-full.h-full.object-cover(v-if='file.data.startsWith("data:image/")' :src='file.data' :alt='`Uploaded file ${ index + 1 }`')
        div.w-full.h-full.flex.flex-col.items-center.justify-center(v-else)
            i.text-3xl.text-zinc-400(:class='getFileIconByType(file.data)')
            p.text-xs.text-zinc-500.mt-1 문서 파일
        button.absolute.top-1.right-1.w-5.h-5.bg-red-500.text-white.rounded-full.flex.items-center.justify-center.text-xs.transition-all.opacity-0(class='group-hover:opacity-100 hover:bg-red-600')
            Icon(name='material-symbols:close-rounded')
        div.transition-all.absolute.bottom-0.left-0.right-0.text-white.text-xs.px-2.py-1.opacity-0(class='bg-black/50 group-hover:opacity-100')
            p.truncate {{ file.name }}
</template>

<script setup lang='ts'>
function getFileIconByType(_fileType: string) {
    if (_fileType.startsWith('image/')) {
        return 'far fa-image'
    } else if (_fileType === 'application/pdf') {
        return 'far fa-file-pdf'
    } else if (_fileType === 'application/msword' || _fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return 'far fa-file-word'
    } else if (_fileType === 'application/x-hwp' || _fileType === 'application/haansofthwp' || _fileType === 'application/vnd.hancom.hwp') {
        return 'far fa-file-alt'
    }
    return 'far fa-file'
}

const props = defineProps<{
    files: Array<{
        name: string,
        type: string,
        size: string,
        data: string
    }>
}>()

const data: {
    files: Array<{
        name: string,
        type: string,
        size: string,
        data: string
    }>
} = reactive({
    files: props.files
})

watch(() => props.files, function () {
    data.files = props.files
})
</script>