import { DurableObject } from "cloudflare:workers";
import { decrypt } from "./encrypt";
import { CS_CMD, SC_CMD } from '../shared/cmd';
import MineSweepGame, { NORMAL_GAME_SETTING } from "../shared/MineSweepGame";
import ScenePartialUpdate from "../shared/ScenePartialUpdate";
interface IUserData
{
	username: string;
}

export default class MineSweepObject extends DurableObject
{
	sessions: Map<WebSocket, IUserData> = new Map();
	game: MineSweepGame = null!;
	constructor(ctx: DurableObjectState, env: Env)
	{
		super(ctx, env);
		this.ctx.getWebSockets().forEach(ws =>
		{
			this.sessions.set(ws, ws.deserializeAttachment());
		});
		log(`MineSweepObject init with ${this.sessions.size} sockets`);
		this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
		ctx.blockConcurrencyWhile(async () =>
		{
			const data = await this.ctx.storage.get('game');
			const g = MineSweepGame.fromStorageData(data);
			if (g)
			{
				this.game = g;
				log(`load game from storage, id=${this.game.id}, v=${this.game.v}`);
			}
			else
			{
				this.game = new MineSweepGame();
				this.game.generate(NORMAL_GAME_SETTING);
				log(`storage not ok, create game,id = ${this.game.id}, v=${this.game.v}`);
				log('data is ', data);
			}
		});
	}

	async fetch(request: Request): Promise<Response>
	{
		const url = new URL(request.url);
		const token = url.searchParams.get('token');
		if (!token)
		{
			log('Login failed:no token provided');
			return new Response('invalid request, no token', { status: 400 });
		}
		let username: string;
		try
		{
			username = await decrypt(token);
		}
		catch (e)
		{
			log('Login failed:invalid token');
			return new Response('invalid request, invalid token', { status: 400 });
		}
		if (!username || username.length > 16)
		{
			return new Response('invalid request, username too long');
		}
		//fix username
		let allnames = new Set(this.sessions.values().map(x => x.username));
		if (allnames.has(username))
		{
			for (let i = 1; ; ++i)
			{
				if (!allnames.has(username + i.toString()))
				{
					username = username + i.toString();
					break;
				}
			}
		}
		log(`user login ok, username=${username}`);

		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);
		this.ctx.acceptWebSocket(server);
		const session: IUserData = { username };
		server.serializeAttachment(session);
		this.sessions.set(server, session);

		send(server, { cmd: 'loginok', username });
		send(server, { cmd: 'listusers', usernames: Array.from(this.sessions.values().map(x => x.username)) });
		send(server, { cmd: 'updategame', game: this.game.toJSON(), op: 'init' });
		this.broadcast({ cmd: 'adduser', username }, server);
		return new Response(null, { status: 101, webSocket: client });
	}
	webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void | Promise<void> 
	{
		if (typeof message !== 'string')
		{
			return;
		}

		let msg: CS_CMD;
		try
		{
			msg = JSON.parse(message);
		}
		catch (e)
		{
			log(`failed parse client json: "${message}"`);
			return;
		}
		if (!msg || typeof msg !== 'object')
		{
			log(`failed parse client json(not object): "${message}"`);
			return;
		}
		const { game } = this;
		let username = this.sessions.get(ws)?.username || '';

		switch (msg.cmd)
		{
			case 'resetgame':
				this.game.generate(NORMAL_GAME_SETTING);
				this.broadcast({ cmd: 'updategame', game: this.game.toJSON(), op: msg.cmd, by: username });
				this.markGameDirty();
				log(`reset game, id=${this.game.id}`);
				break;
			case 'flag':
			case 'reveal':
			case 'revealaround':
				let score = 0;
				try
				{
					let pu = new ScenePartialUpdate();
					game.checkCmd(msg);
					switch (msg.cmd)
					{
						case 'flag':
							game.flag(msg.pos);
							break;
						case 'reveal':
							game.reveal(msg.pos, pu);
							break;
						case 'revealaround':
							game.revealAround(msg.pos, pu);
							break;
					}
					if (game.gameover === 0)
					{
						score = pu.size;
					}
				}
				catch (e: any)
				{
					sendOpError(ws, e.reason || '');
					return;
				}
				this.broadcast({ cmd: 'updategame', game: this.game.toJSON(), op: msg.cmd, pos: msg.pos, by: username, score });
				send(ws, { cmd: 'opresult', success: true });
				this.markGameDirty();
				break;
			default:
				//@ts-ignore
				log(`unknown client cmd: "${msg.cmd}"`);
				break;
		}
	}

	webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): void | Promise<void> 
	{
		let user = this.sessions.get(ws);
		if (user)
		{
			log(`user leave,username=${user.username}`);
			this.sessions.delete(ws);
			this.broadcast({ cmd: 'removeuser', username: user.username });
			ws.serializeAttachment({});
		}
		else
		{
			log(`user leave,username unknown`);
		}
		ws.close();
	}
	webSocketError(ws: WebSocket, error: unknown): void | Promise<void> 
	{
		let user = this.sessions.get(ws);
		if (user)
		{
			log(`user leave(error),username=${user.username}`);
			this.sessions.delete(ws);
			this.broadcast({ cmd: 'removeuser', username: user.username });
		}
		else
		{
			log(`user leave(error),username unknown`);
		}
		ws.close();
	}



	broadcast(body: SC_CMD, exceptWs?: WebSocket)
	{
		if (this.sessions.size > 0)
		{
			const str = JSON.stringify(body);
			for (const s of this.sessions.keys())
			{
				if (s !== exceptWs) s.send(str);
			}
		}
	}
	saveTick: any;
	markGameDirty()
	{
		if (this.saveTick)
		{
			clearTimeout(this.saveTick);
		}
		this.saveTick = setTimeout(() =>
		{
			this.saveTick = null;
			this.ctx.blockConcurrencyWhile(async () =>
			{
				await this.saveGame();
			});
		}, 30 * 1000);
	}

	async saveGame()
	{
		log(`开始保存, id=${this.game.id}, v=${this.game.v}`);
		await this.ctx.storage.put('game', this.game.toStorageData());
		log('保存完成');
	}
}



function log(...args: any[])
{
	console.log.apply(null, ['[Worker]', ...args]);
}

function send(ws: WebSocket, body: SC_CMD)
{
	const str = JSON.stringify(body);
	ws.send(str);
}
function sendOpError(ws: WebSocket, reason: string)
{
	send(ws, { cmd: 'opresult', success: false, reason });
}