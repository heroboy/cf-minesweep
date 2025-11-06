<script lang="ts" setup>
import { computed, provide, reactive, ref, toRef, type CSSProperties, type VNode } from 'vue';
import NotificationContainer from './NotificationContainer.vue';
import Cell from './Cell.vue';

interface IProps
{
	width: number;
	height: number;
	sceneData: number[];
	mineData?: number[];
	loading?: boolean;
	gameover?: number;
	activeCell?: number | null;
}
const props = defineProps<IProps>();
const emit = defineEmits<{
	(e: 'reveal', pos: number): void,
	(e: 'flag', pos: number): void,
	(e: 'reveal-around', pos: number): void,
}>();
const BOARD_ROWS = computed(() =>
{
	const rows: number[][] = Array.from({ length: props.height });
	let k = 0;
	for (let y = 0; y < props.height; ++y)
	{
		const line = rows[y] = Array.from({ length: props.width });
		for (let x = 0; x < props.width; ++x)
		{
			line[x] = k++;
		}
	}
	return rows;
});
provide('boardsize', { get width() { return props.width; }, get height() { return props.height; } });
provide('activeCell', toRef(props, 'activeCell'));
const showMask = computed(() =>
{
	return props.loading || props.gameover;
});
const notifyer = ref<InstanceType<typeof NotificationContainer> | null>(null);

function getCellClass(pos: number)
{
	let n: any = {};
	let v: number = props.sceneData[pos]!;
	n['cell'] = true;
	if (v >= 0)
	{
		n['revealed'] = true;
		n['color-' + v] = true;
		if (v >= 1)
		{
			n['can-reveal-around'] = true;
		}
	}
	else
	{
		n['clickable'] = true;
	}
	if (v === -2)
	{
		n['flagged'] = true;
	}

	if (props.loading || props.gameover)
	{
		delete n['clickable'];
		delete n['can-reveal-around'];
	}
	if (props.gameover && props.mineData)
	{
		if (props.mineData![pos] === -1)
			n['mine'] = true;
	}

	return n;
}

function onClickCell(pos: number)
{
	// if (notifyer.value)
	// {
	// 	notifyer.value.notify('hello', { ...getCellCenter(pos) });
	// }
	if (props.loading) return;
	if (props.sceneData[pos]! < 0)
	{
		emit('reveal', pos);
	}
}
function onFlagCell(pos: number)
{
	if (props.loading) return;
	if (props.sceneData[pos]! < 0)
	{
		emit('flag', pos);
	}
}
function onRevealAround(pos: number)
{
	if (props.loading) return;
	if (props.sceneData[pos]! > 0)
	{
		emit('reveal-around', pos);
	}
}

function getCellCenter(pos: number)
{
	let xx = pos % props.width;
	let yy = Math.floor(pos / props.width);
	return { x: xx * 30 + 15, y: yy * 30 + 15 };
}
//todo: 上一个玩家点击的格子
function isActiveCell(pos: number)
{
	return pos === props.activeCell;
}

defineExpose({
	notify(pos: number | 'center', text: string | VNode, opt?: {
		style?: CSSProperties,
		duration?: number;
	})
	{
		let x: number, y: number;
		if (typeof pos === 'number')
		{
			const tmp = getCellCenter(pos);
			x = tmp.x;
			y = tmp.y;
		}
		else
		{
			x = props.width * 30 / 2;
			y = props.height * 30 / 2;
		}
		notifyer.value?.notify(text, { x, y, ...opt });
	}
});

</script>
<template>
	<div :class="{ 'game-board': true, loading: loading, win: props.gameover === 2 }">
		<div class="row" v-for="row in BOARD_ROWS">
			<!-- <div :class="getCellClass(pos)" v-for="pos in row" @click="onClickCell(pos)"
				@mouseup.middle="onRevealAround(pos)"
				@contextmenu.prevent="onFlagCell(pos)">
			</div> -->
			<Cell v-for="pos in row" :pos="pos" :data="sceneData[pos]!" :mine="mineData && mineData[pos]"
				:gameover="gameover || 0" :loading="loading!"
				@reveal-around="onRevealAround"
				@reveal="onClickCell"
				@flag="onFlagCell" />
		</div>
		<transition name="mask">
			<div class="game-board-mask" v-if="showMask" @contextmenu.prevent="">
				<div v-if="!!gameover" class="win-lose-mask">
					{{ gameover === 1 ? 'Lose' : gameover === 2 ? 'Win' : '' }}
				</div>
			</div>
		</transition>
		<NotificationContainer ref="notifyer" style="position: absolute;left: 0;top: 0;" />
	</div>
</template>
<style scoped>
.game-board {
	display: inline-block;
	border: 2px solid #333;
	margin-left: 0;
	user-select: none;
	position: relative;
}

.mask-enter-active {
	transition: all 200ms ease;
	transition-delay: 100ms;
}

.mask-leave-active {
	transition: all 200ms ease;
}

.mask-enter-from,
.mask-leave-to {
	opacity: 0;
}

.game-board-mask {
	position: absolute;
	background-color: rgba(0, 0, 0, 0.2);
	width: 100%;
	height: 100%;
	z-index: 1;
	left: 0;
	top: 0;
}

.win-lose-mask {
	font-size: 80px;
	font-weight: bold;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	position: absolute;
	left: 0;
	top: 0;
}

.loading {
	cursor: wait;
}

.row {
	display: flex;
	height: 30px;
	margin: 0;
	padding: 0;
}
</style>