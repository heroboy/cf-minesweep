<script setup lang="tsx">
import { computed, customRef, markRaw, reactive, ref, shallowReactive, toRaw, triggerRef } from 'vue';
import { fetchApi, connectWs } from './util';
import { type CS_CMD, type SC_CMD } from '../shared/cmd';
import GameSession from './GameSession';
import GameBoard from './components/GameBoard.vue';
import { ClientSideSweepGame } from '../shared/MineSweepGame';
import SingleGame from './SingleGame.vue';
const inputUserName = ref(localStorage.getItem('username') || '');
const isConnecting = ref(false);
const connectErrorMsg = ref('');
const ws = ref<null | WebSocket>(null);
const session = reactive(new GameSession());
const game = computed(() => session.getPatchedGame());
const boardRef = ref<InstanceType<typeof GameBoard> | null>(null);
async function onClickConnect()
{
	if (isConnecting.value) return;
	if (ws.value) return;

	isConnecting.value = true;
	connectErrorMsg.value = '';
	localStorage.setItem('username', inputUserName.value);

	const tokenRet = await fetchApi('/api/login', { username: inputUserName.value });
	if (tokenRet.success)
	{
		const socket = await connectWs('/ws?token=' + encodeURIComponent(tokenRet.token));
		if (socket)
		{
			console.log('连接服务器成功');
			ws.value = socket;
			initWs(socket);
		}
		else
		{
			connectErrorMsg.value = '连接服务器失败';
		}
	}
	else
	{
		connectErrorMsg.value = '登录失败：' + tokenRet.reason;
	}

	isConnecting.value = false;
}

function initWs(_ws: WebSocket)
{
	session.reset();
	_ws.onmessage = function (e)
	{
		const msg = JSON.parse(e.data) as SC_CMD;
		processCmd(msg);
	};
	_ws.onerror = function (e)
	{
		console.error(e);
	};
	_ws.onclose = function ()
	{
		clearWs();
		connectErrorMsg.value = '已经和服务器断开连接';
		ws.value = null;
	};
	function clearWs()
	{
		session.clear();
		_ws.onmessage = null;
		_ws.onerror = null;
		_ws.onclose = null;
	}
}
function processCmd(msg: SC_CMD)
{
	console.log('recv:' + msg.cmd, msg);
	switch (msg.cmd)
	{
		case 'loginok':
			session.myUserName = msg.username;
			break;
		case 'updategame':
			session.inited = true;
			session.game = markRaw(ClientSideSweepGame.fromJSON(msg.game));
			if (msg.op === 'reveal' || msg.op === 'revealaround')
			{
				if (msg.by && msg.pos != null)
				{
					let score: string = '';
					if (msg.score != null && msg.score > 0)
					{
						score = '+' + msg.score.toString();
					}
					boardRef.value?.notify(msg.pos, <b>click:{msg.by} <span style="font-size:1.5em">{score}</span></b>, {});
				}
			}
			break;
		case 'opresult':
			if (session.waitFlagOps.length > 0)
			{
				//优先处理插旗操作结果
				session.waitFlagOps.shift()!;
				session.game = session.game!.clone();
			}
			else
			{
				session.operating = false;
			}

			if (!msg.success)
			{
				boardRef.value?.notify(msg.pos, msg.reason || '操作失败', { style: { color: 'red' } });
			}
			break;
		case 'listusers':
			session.userlist = msg.usernames;
			break;
		case 'adduser':
			session.userlist.push(msg.username);
			break;
		case 'removeuser':
			{
				let i = session.userlist.indexOf(msg.username);
				if (i !== -1) session.userlist.splice(i, 1);
			}
			break;
	}
}
function formatTime(t: number)
{
	let d = new Date(t);
	return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
}
function onClickBoard(op: 'reveal' | 'flag' | 'revealAround', pos: number)
{
	if (session.operating) return;
	if (!ws.value) return;
	const g = game.value;
	if (!g) return;

	const wrap = (fn: Function) =>
	{
		try
		{
			fn();
			return true;
		}
		catch
		{
			return false;
		}
	};

	switch (op)
	{
		case 'reveal':
			if (wrap(() => g.checkReveal(pos)))
			{
				session.operating = true;
				send({ cmd: 'reveal', pos: pos, v: g.v, id: g.id });
			}
			break;
		case 'revealAround':
			if (wrap(() => g.checkRevealAround(pos)))
			{
				session.operating = true;
				send({ cmd: 'revealaround', pos: pos, v: g.v, id: g.id });
			}
			break;
		case 'flag':
			if (wrap(() => g.checkFlag(pos)))
			{
				//session.operating = true;
				let oldVersion: number = g.v;
				let newValue: number;
				newValue = g.sceneData[pos] === -2 ? -1 : -2;
				session.waitFlagOps.push(markRaw({ pos, oldValue: g.sceneData[pos]!, oldVersion: oldVersion, newValue }));

				send({ cmd: 'flag', pos: pos, v: g.v, id: g.id });

				//g.sceneData[pos] = newValue;
				//++g.v;
				//session.game = session.game!.clone();
			}
			break;
	}
}

function send(msg: CS_CMD)
{
	ws.value?.send(JSON.stringify(msg));
}

function onClickRefresh()
{
	//triggerRef(game);
	session.game = session.game!.clone();
	console.log(toRaw(session));
}
</script>

<template>
	<div v-if="ws == null">
		<div><input v-model="inputUserName" /> <button :disabled="isConnecting || !inputUserName"
				@click="onClickConnect">连接</button>
			<span v-if="isConnecting">连接中...</span>
		</div>
		<div v-if="connectErrorMsg" style="color:red">{{ connectErrorMsg }}</div>
	</div>
	<div v-if="ws && game">
		<div>游戏id：{{ game.id }}-{{ game.v }}, 等待回复的插旗操作：{{ session.waitFlagOps.length }}</div>
		<div>游戏开始时间：{{ formatTime(game.timestamp) }}</div>
		<div>
			<button @click="send({ cmd: 'resetgame' })" :disabled="game.gameover === 0">重新开始</button>
			<button @click="ws.close()">close</button>
		</div>

		<GameBoard
			ref="boardRef"
			:width="game.width"
			:height="game.height"
			:scene-data="game.sceneData"
			:gameover="game.gameover"
			:mine-data="game.mineData"
			:loading="session.operating"
			@reveal="pos => onClickBoard('reveal', pos)"
			@reveal-around="pos => onClickBoard('revealAround', pos)"
			@flag="pos => onClickBoard('flag', pos)" />
		<div style="display: flex;">
			<span>用户列表：</span>
			<div v-for="name in session.userlist" style="margin: 0px 10px;">{{ name }}</div>
		</div>
	</div>
</template>
