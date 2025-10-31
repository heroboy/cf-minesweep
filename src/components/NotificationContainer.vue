<script setup lang="ts">
import { defineComponent, ref, type CSSProperties, type VNode } from 'vue';
interface ITip
{
	id: number;
	text: string | VNode;
	x: number;
	y: number;
	style: CSSProperties;
}
let seed = 0;
const tips = ref<ITip[]>([]);
interface IOption
{
	x?: number;
	y?: number;
	duration?: number;
	style?: CSSProperties;
}
function notify(text: string | VNode, opt?: IOption)
{
	if (!opt) opt = {};
	const id = seed++;
	let tip: ITip = {
		id, text,
		x: opt.x ?? 0,
		y: opt.y ?? 0,
		style: opt.style || {}
	};

	tips.value.push(tip);
	// 自动移除
	setTimeout(() =>
	{
		tips.value = tips.value.filter(t => t.id !== id);
	}, opt?.duration ?? 500);
}

const RenderVNode = defineComponent({
	props: ['vnode'],
	render()
	{
		return this.vnode;
	}
});

defineOptions({ inheritAttrs: true });
// 暴露给外部调用
defineExpose({ notify });
</script>



<template>
	<!-- fixed 居中容器 -->
	<div style="width: 100%;height: 100%;user-select: none;pointer-events: none;">
		<TransitionGroup name="fade-up">
			<div
				v-for="item in tips"
				:key="item.id"
				:style="{ position: 'absolute', left: item.x + 'px', top: item.y + 'px', ...item.style }">
				<div style="position: absolute;transform: translate(-50%,-50%);white-space: nowrap;">
					<RenderVNode :vnode="item.text" />
				</div>
			</div>
		</TransitionGroup>
	</div>
</template>

<style scoped>
.fade-up-enter-active,
.fade-up-leave-active {
	transition: all 0.5s ease;
}

.fade-up-enter-from {
	opacity: 0;
	transform: translateY(20px);
}

.fade-up-leave-to {
	opacity: 0;
	transform: translateY(-20px);
}

.fade-up-enter-to,
.fade-up-leave-from {
	opacity: 1;
	transform: translateY(0);
}
</style>