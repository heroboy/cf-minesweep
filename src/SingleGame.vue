<script setup lang="ts">
import MineSweepGame, { NORMAL_GAME_SETTING, EASY_GAME_SETTING } from '../shared/MineSweepGame';
import { reactive } from 'vue';
import GameBoard from './components/GameBoard.vue';



const game = reactive(new MineSweepGame());
game.generate(NORMAL_GAME_SETTING);
//@ts-ignore
globalThis.game = game;
function onRevealCell(pos: number)
{
	try
	{
		game.reveal(pos);
	}
	catch (e: any)
	{
		if (e.message === 'ignore')
		{
			console.log('ignore');
		}
		else
		{
			console.error(e);
		}
	}
}
function onRevealCellAround(pos: number)
{
	try
	{
		game.revealAround(pos);
	}
	catch (e: any)
	{
		if (e.message === 'ignore')
		{
			console.log('ignore');
		}
		else
		{
			console.error(e);
		}
	}
}

function onFlagCell(pos: number)
{
	try
	{
		game.flag(pos);
	}
	catch (e: any)
	{
		if (e.message === 'ignore')
		{
			console.log('ignore');
		}
		else
		{
			console.error(e);
		}
	}
}

</script>

<template>
	<div>hello <button @click="game.generate(NORMAL_GAME_SETTING)">Reset</button></div>
	<GameBoard :width="game.width" :height="game.height" :scene-data="game.sceneData"
		@reveal="onRevealCell"
		@flag="onFlagCell"
		@reveal-around="onRevealCellAround"
		:gameover="game.gameover"
		:mine-data="game.gameover ? game.mineData : undefined" />
</template>
