<template lang='pug'>
svg.loading(viewBox='10 10 20 20')
    circle(stroke-width='10.416666666666668%' r='8.958333333333334' cx='100%' cy='100%')
    circle(stroke-width='10.416666666666668%' r='8.958333333333334' cx='100%' cy='100%')
</template>

<style lang='css' scoped>
svg.loading {
    animation: 1.4s linear 0s infinite normal none running loading-svg;
    display: block;
}

svg.loading > circle:first-child {
    fill: none;
    stroke: rgba(171, 171, 171, 0.4);
}

svg.loading > circle:last-child {
    fill: none;
    stroke-dasharray: 14.0717px, 56.2869px;
    stroke-dashoffset: 0px;
    stroke: currentcolor;
    animation: 1.4s ease-in-out 0s infinite normal none running loading-circle;
}

@keyframes loading-circle {
    0% {
        stroke-dasharray: 1px, 89.5833px;
        stroke-dashoffset: 0px;
    }
    50% {
        stroke-dasharray: 44.7917px, 89.5833px;
        stroke-dashoffset: -6.71875px;
    }
    100% {
        stroke-dasharray: 44.7917px, 89.5833px;
        stroke-dashoffset: -55.9896px;
    }
}

@keyframes loading-svg {
    0% {
        transform: rotate(0deg);
        transform-origin: 50% 50%;
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>