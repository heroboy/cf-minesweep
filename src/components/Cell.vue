<script lang="tsx" setup>
import { computed, inject, watch, type Ref } from 'vue';

const props = defineProps<{
	pos: number;
	data: number;
	mine?: number;
	loading: boolean;
	gameover: number;
}>();
const emit = defineEmits<{
	(e: 'reveal', pos: number): void;
	(e: 'flag', pos: number): void;
	(e: 'reveal-around', pos: number): void;
}>();

const boardsize = inject<{ width: number, height: number; }>('boardsize');
const activeCell = inject<any>('activeCell', null);
const distFromActive = computed<number | null>(() =>
{
	if (activeCell == null || activeCell.value == null)
	{
		return 0;
	}
	const { width, height } = boardsize!;
	const ax = activeCell.value % width;
	const ay = Math.floor(activeCell.value / width);
	const cx = props.pos % width;
	const cy = Math.floor(props.pos / width);
	const dx = Math.abs(ax - cx);
	const dy = Math.abs(ay - cy);
	return Math.sqrt(dx * dx + dy * dy);
});
const clickable = computed<boolean>(() =>
{
	return !(props.loading || props.gameover) && props.data < 0;
});
const hasFlag = computed<boolean>(() =>
{
	return props.data === -2;
});
const hasMine = computed<boolean>(() =>
{
	return props.mine === -1 && props.gameover > 0;
});
const backgroundColor = computed<string>(() =>
{

	if (hasMine.value && props.gameover !== 2)
	{
		return '#ff6666';
	}
	if (hasMine.value && props.gameover === 2)
	{
		return 'aquamarine';
	}
	if (hasFlag.value)
	{
		return '#ffcc00';
	}
	if (props.data >= 0)
	{
		//return '#f0f0f0';
	}
	return '#ddd';
});
</script>
<template>
	<div :class="{
		cell: true,
		clickable: clickable,
		'can-reveal-around': data > 0 && !(loading || gameover)
	}"
		:style="{ backgroundColor: backgroundColor }"
		@click="emit('reveal', pos)"
		@contextmenu.prevent="emit('flag', pos)"
		@mouseup.middle="emit('reveal-around', pos)">

		<transition name="open-card">
			<div :class="{ ['color-' + data]: true, revealed: true }"
				:style="{ transitionDelay: `${Math.floor((distFromActive || 0) * 30)}ms` }" v-if="data >= 0">
				{{ data > 0 ? data : '' }}
			</div>
		</transition>

		<div :class="{ 'both-flag-mine': hasFlag && hasMine, mine: true }" v-if="hasMine"><span>💣</span></div>
		<transition name="flag-transition">
			<div :class="{ 'both-flag-mine': hasFlag && hasMine, flagged: true }" v-if="hasFlag">
				<span>🚩</span>
			</div>
		</transition>
	</div>
</template>
<style>
.cell {
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
	padding: 0;
}

.flagged,
.mine,
.revealed {
	position: absolute;
	left: 0px;
	right: 0px;
	top: 0px;
	bottom: 0px;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: center;
}

.revealed {
	background-color: #f0f0f0;
}

.flagged {
	/* background-color: #ffcc00; */
}

.clickable {
	cursor: pointer;
}

.can-reveal-around {
	cursor: alias;
}

.mine {
	/* background-color: #ff6666; */
}

.both-flag-mine.flagged {
	/* background-color: transparent; */
}

.both-flag-mine.mine span {
	position: relative;
	font-size: 10px;
	left: 5px;
	top: 5px;

}

.win .mine {
	/* background-color: aquamarine; */
}


.color-1 {
	color: blue;
}

.color-2 {
	color: green;
}

.color-3 {
	color: red;
}

.color-4 {
	color: darkblue;
}

.color-5 {
	color: brown;
}

.color-6 {
	color: teal;
}

.color-7 {
	color: black;
}

.color-8 {
	color: gray;
}

.flag-transition-enter-active,
.flag-transition-leave-active {
	transition-property: all;
	transition-duration: 100ms;
	transition-timing-function: cubic-bezier(0.265, 0.980, 1.000, 1.650);
}

.flag-transition-enter-from,
.flag-transition-leave-to {
	transform: translateY(-10px) scale(0.3, 2.4);
}


.open-card-enter-active {
	transition-property: all;
	transition-duration: 200ms;
	transform-origin: center center;
	perspective: 300px;
	backface-visibility: hidden;
}

.open-card-leave-active {
	transition-property: none;
	transition-duration: 0ms;
	transition-delay: 0;
}

.open-card-leave-from,
.open-card-leave-to {
	transform: rotateY(0deg);
}

.open-card-enter-from {
	transform: rotateY(180deg);

}
</style>