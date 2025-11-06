<script setup lang="tsx">
import { provide, reactive, readonly, ref } from 'vue';
import Cell from './Cell.vue';
const data = ref(0);
const mine = ref<undefined | number>(undefined);
function toggleOpen()
{
	mine.value = undefined;
	if (data.value < 0)
	{
		data.value = 3;
	}
	else
	{
		data.value = -1;
	}
}
const width = ref(10);
const height = ref(10);
provide('boardsize', readonly({ get width() { return width.value; }, get height() { return height.value; } }));
</script>
<template>
	<div>
		<div class="split-button">
			<button class="button">aaaaa</button>
			<button class="dropdown">&#9660;</button>
		</div>

	</div>
	<div>
		<label>data: <input v-model.number="data" /></label>
		<label>mine: <input v-model.number="mine" /></label>
		<button @click="toggleOpen">toggle open</button>
		<button @click="++width">width+1</button>
	</div>
	<Cell :pos="0" :gameover="mine != null ? 1 : 0" :data="data" :mine="mine" :loading="false" />
</template>

<style scoped>
.split-button
{
	
}
.split-button .button{
	border-top-right-radius: 0;
	border-bottom-right-radius: 0;
}
.split-button .dropdown {
	border-top-left-radius: 0;
	border-bottom-left-radius: 0;
}
.box {
	width: 30px;
	height: 30px;
	border: 1px solid #999;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: bold;
	background-color: #ddd;
	box-sizing: border-box;
	font-size: 14px;
	margin: 0;
	padding: 0;
	position: relative;
}

.drop-down-enter-active,
.drop-down-leave-active {
	transition: all 0.1s ease;
	transition-timing-function: cubic-bezier(0.225, 0.895, 0.515, 1.650);
	transform-origin: center center;
}

.drop-down-enter-from,
.drop-down-leave-to {
	transform: translate(0, -20px) scale(0.1);
}
</style>