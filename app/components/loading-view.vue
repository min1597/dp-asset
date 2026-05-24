<script setup lang='ts'>
const props = defineProps<{ status: boolean, content: string }>()

const data: {
    status: boolean,
    content: string,
    dot: string
} = reactive({
    status: props.status,
    content: props.content,
    dot: '...'
})

watch(() => props.status, () => {
    data.status = props.status
})
watch(() => props.content, () => {
    data.content = props.content
})

let _interval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
    _interval = setInterval(() => {
        data.dot += '.'
        if(data.dot.length == 5) data.dot = '.'
    }, 500)
})
onBeforeUnmount(() => {
    if(_interval !== null) clearInterval(_interval)
})
</script>

<template lang='pug'>
div
    transition(name='loading-view')
        div.loading-view(v-if='data.status')
            div.flex.flex-wrap.items-center.justify-center.h-full
                div.flex.flex-wrap.justify-center.items-center
                    div.lds-spinner
                        div(v-for='index in 12')
                    div(class='text-white')
                        h3.font-medium.text-md {{ data.content }}{{ data.dot }}
                        h3.font-extralight.text-xs 이 창이 오래 지속될 경우 고객센터로 문의해주세요.
</template>

<style lang='css'>
.loading-view {
    top:0;
    left:0;
    position:fixed;
    width:100%;
    height:100%;
    background-color:rgba(0,0,0,.5);
    -webkit-backdrop-filter:saturate(180%) blur(5px);
    backdrop-filter:saturate(180%) blur(5px);
    z-index:10000;
    transition:all .3s ease
}
.lds-spinner {
    display:inline-block;
    position:relative;
    width:80px;
    height:80px;
    transform:scale(.5)
}
.lds-spinner div {
    transform-origin:40px 40px;
    -webkit-animation:lds-spinner 1.2s linear infinite;
    animation:lds-spinner 1.2s linear infinite
}
.lds-spinner div:after {
    content:" ";
    display:block;
    position:absolute;
    top:3px;
    left:37px;
    width:6px;
    height:18px;
    border-radius:20%;
    background:#fff
}
.lds-spinner div:first-child {
    transform:rotate(0deg);
    -webkit-animation-delay:-1.1s;
    animation-delay:-1.1s
}
.lds-spinner div:nth-child(2) {
    transform:rotate(30deg);
    -webkit-animation-delay:-1s;
    animation-delay:-1s
}
.lds-spinner div:nth-child(3) {
    transform:rotate(60deg);
    -webkit-animation-delay:-.9s;
    animation-delay:-.9s
}
.lds-spinner div:nth-child(4) {
    transform:rotate(90deg);
    -webkit-animation-delay:-.8s;
    animation-delay:-.8s
}
.lds-spinner div:nth-child(5) {
    transform:rotate(120deg);
    -webkit-animation-delay:-.7s;
    animation-delay:-.7s
}
.lds-spinner div:nth-child(6) {
    transform:rotate(150deg);
    -webkit-animation-delay:-.6s;
    animation-delay:-.6s
}
.lds-spinner div:nth-child(7) {
    transform:rotate(180deg);
    -webkit-animation-delay:-.5s;
    animation-delay:-.5s
}
.lds-spinner div:nth-child(8) {
    transform:rotate(210deg);
    -webkit-animation-delay:-.4s;
    animation-delay:-.4s
}
.lds-spinner div:nth-child(9) {
    transform:rotate(240deg);
    -webkit-animation-delay:-.3s;
    animation-delay:-.3s
}
.lds-spinner div:nth-child(10) {
    transform:rotate(270deg);
    -webkit-animation-delay:-.2s;
    animation-delay:-.2s
}
.lds-spinner div:nth-child(11) {
    transform:rotate(300deg);
    -webkit-animation-delay:-.1s;
    animation-delay:-.1s
}
.lds-spinner div:nth-child(12) {
    transform:rotate(330deg);
    -webkit-animation-delay:0s;
    animation-delay:0s
}
@-webkit-keyframes lds-spinner {
    0% {
        opacity:1
    }
    to {
        opacity:0
    }
}
@keyframes lds-spinner {
    0% {
        opacity:1
    }
    to {
        opacity:0
    }
}
.loader {
    border:2px solid #d9d9d9;
    border-top-color:#000;
    border-radius:50%;
    width:16px;
    height:16px;
    -webkit-animation:spin-loader 2s linear infinite;
    animation:spin-loader 2s linear infinite;
}
@-webkit-keyframes spin-loader {
    0% {
        transform:rotate(0deg);
    }
    to {
        transform:rotate(1turn);
    }
}
@keyframes spin-loader {
    0% {
        transform:rotate(0deg);
    }
    to {
        transform:rotate(1turn);
    }
}
.loading-view-enter-active {
    animation: loading-view .3s;
}
.loading-view-leave-active {
    animation: loading-view .3s reverse;
}
@keyframes loading-view {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}
</style>