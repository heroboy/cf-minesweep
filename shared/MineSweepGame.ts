
import ScenePartialUpdate from './ScenePartialUpdate';
export const HARD_GAME_SETTING = {
	width: 30,
	height: 16,
	mine: 99
};
export const NORMAL_GAME_SETTING = {
	width: 16,
	height: 16,
	mine: 40
};
export const EASY_GAME_SETTING = {
	width: 9,
	height: 9,
	mine: 10
};
const STORAGE_VERSION = 0;

export class ClientSideSweepGame
{
	id: string = '';
	width: number = 24;
	height: number = 18;
	//-1 bomb, else adjsant mine count
	mineData?: number[];
	//0 reveal with 0, -1 unknown, -2: flag, 1-8: reveal
	sceneData: number[] = [];
	v = 0;
	//0 playing, 1 lose, 2 win
	gameover = 0;

	timestamp = 0;

	//isBomb = (pos: number) => this.mineData[pos] === -1;
	isRevealed = (pos: number) => this.sceneData[pos]! >= 0;
	isFlaged = (pos: number) => this.sceneData[pos] === -2;
	static fromJSON(obj: any): ClientSideSweepGame
	{
		const g = new ClientSideSweepGame();
		g.id = obj.id;
		g.width = obj.width;
		g.height = obj.height;
		g.mineData = obj.mineData;
		g.sceneData = obj.sceneData;
		g.v = obj.v;
		g.gameover = obj.gameover;
		g.timestamp = obj.timestamp;
		return g;
	}
	clone()
	{
		const g = new ClientSideSweepGame();
		g.id = this.id;
		g.width = this.width;
		g.height = this.height;
		g.mineData = this.mineData ? this.mineData.slice() : undefined;
		g.sceneData = this.sceneData.slice();
		g.v = this.v;
		g.gameover = this.gameover;
		g.timestamp = this.timestamp;
		return g;
	}
	checkFlag(pos: number)
	{
		if (this.gameover)
			throw new Ignore('游戏已经结束');
		if (pos < 0 || pos >= this.width * this.height)
			throw new Ignore('位置参数非法');
		if (this.isRevealed(pos))
			throw new Ignore('非法位置');
	}
	checkReveal(pos: number)
	{
		if (this.gameover)
			throw new Ignore('游戏已经结束');
		if (pos < 0 || pos >= this.width * this.height)
			throw new Ignore('位置参数非法');
		if (this.isRevealed(pos) || this.isFlaged(pos))
			throw new Ignore('非法位置');
	}
	checkRevealAround(pos: number)
	{
		if (this.gameover)
			throw new Ignore('游戏已经结束');
		if (pos < 0 || pos >= this.width * this.height)
			throw new Ignore('位置参数非法');
		if (this.sceneData[pos]! <= 0)
			throw new Ignore('非法位置');

		let cc = this.countAround(pos);
		if (cc.flag !== this.sceneData[pos])
			throw new Ignore('非法位置:旗帜数量错误');

		if (cc.unrevealed.length === 0)
			throw new Ignore('非法位置:无可打开位置');
		return cc;
	}

	private countAround(pos: number)
	{
		let count = 0;
		let flag = 0;
		let revealed = 0;
		let unrevealed: number[] = [];
		for (const next of this.adjancent8(pos))
		{
			++count;
			if (this.isFlaged(next)) ++flag;
			if (this.isRevealed(next)) ++revealed;
			if (!this.isRevealed(next) && !this.isFlaged(next))
				unrevealed.push(next);
		}
		return { count, flag, revealed, unrevealed };
	}

	*adjancent8(pos: number)
	{
		const { width, height } = this;
		var x = pos % width;
		var y = (pos / width) | 0;
		if (x > 0)
		{
			yield y * width + x - 1;
			if (y > 0)
				yield (y - 1) * width + x - 1;
			if (y < height - 1)
				yield (y + 1) * width + x - 1;
		}
		if (x < width - 1)
		{
			yield y * width + x + 1;
			if (y > 0)
				yield (y - 1) * width + x + 1;
			if (y < height - 1)
				yield (y + 1) * width + x + 1;
		}
		if (y > 0)
			yield (y - 1) * width + x;
		if (y < height - 1)
			yield (y + 1) * width + x;
	}
}


export default class MineSweepGame extends ClientSideSweepGame
{
	id: string = '';
	width: number = 24;
	height: number = 18;
	//-1 bomb, else adjsant mine count
	mineData: number[] = [];
	//0 reveal with 0, -1 unknown, -2: flag, 1-8: reveal
	sceneData: number[] = [];
	v = 0;
	//0 playing, 1 lose, 2 win
	gameover = 0;
	constructor()
	{
		super();
	}
	toJSON()
	{
		return {
			id: this.id,
			width: this.width,
			height: this.height,
			mineData: this.gameover ? this.mineData : undefined,
			sceneData: this.sceneData,
			v: this.v,
			gameover: this.gameover,
			timestamp: this.timestamp,
		};
	}
	toStorageData()
	{
		return {
			id: this.id,
			width: this.width,
			height: this.height,
			mineData: this.mineData,
			sceneData: this.sceneData,
			v: this.v,
			gameover: this.gameover,
			timestamp: this.timestamp,
			vv: STORAGE_VERSION,

		};
	}

	static fromStorageData(obj: any): MineSweepGame | null
	{
		if (!obj) return null;
		if (obj.vv !== STORAGE_VERSION)
			return null;
		const g = new MineSweepGame();
		g.id = obj.id;
		g.width = obj.width;
		g.height = obj.height;
		g.mineData = obj.mineData;
		g.sceneData = obj.sceneData;
		g.v = obj.v;
		g.gameover = obj.gameover;
		g.timestamp = obj.timestamp;
		return g;
	}

	isBomb = (pos: number) => this.mineData[pos] === -1;
	//isRevealed = (pos: number) => this.sceneData[pos] >= 0;
	//isFlaged = (pos: number) => this.sceneData[pos] === -2;

	generate(setting: { width: number, height: number, mine: number; })
	{
		this.timestamp = Date.now();
		this.id = genuuid();
		this.width = setting.width;
		this.height = setting.height;
		const length = this.width * this.height;
		this.mineData = Array.from({ length });
		this.mineData.fill(0);
		for (let i = 0; i < setting.mine; ++i)
		{
			do
			{
				let pos = Math.floor(Math.random() * length);
				if (this.mineData[pos] === 0)
				{
					this.mineData[pos] = -1;
					break;
				}
			} while (1);
		}
		
		this.calcMineData();

		this.sceneData = Array.from({ length });
		this.sceneData.fill(-1);
		this.v = 0;
		this.gameover = 0;
	}
	//不是雷的格子，计算周围雷数
	calcMineData()
	{
		const length = this.width * this.height;
		for (let i = 0; i < length; ++i)
		{
			if (this.mineData[i] !== -1)
				this.mineData[i] = 0;
		}
		for (let i = 0; i < length; ++i)
		{
			if (this.mineData[i] === -1)
			{
				for (let pos of this.adjancent8(i))
				{
					if (this.mineData![pos]! >= 0)
						++this.mineData[pos]!;
				}
			}
		}
	}

	floodReveal(pos: number, pu?: ScenePartialUpdate)
	{
		for (let next of this.adjancent8(pos))
		{
			if (this.isBomb(next) || this.isRevealed(next) || this.isFlaged(next))
				continue;
			if (this.mineData[next] === 0)
			{
				pu?.set(next, 0);
				this.sceneData[next] = 0;
				this.floodReveal(next, pu);
			}
			else
			{
				pu?.set(next, this.mineData[next]!);
				this.sceneData[next] = this.mineData[next]!;
			}
		}
	}

	flag(pos: number)
	{
		this.checkFlag(pos);
		this.sceneData[pos] = this.sceneData[pos] === -2 ? -1 : -2;
		this.v++;
	}

	reveal(pos: number, pu?: ScenePartialUpdate)
	{
		this.checkReveal(pos);
		//todo: 如果第一次点击是雷，重新生成地图，保证第一次点击安全
		if (this.isBomb(pos))
		{
			pu?.set(pos, 0);
			this.sceneData[pos] = 0;
			this.v++;
			this.gameover = 1;
			return;
		}
		pu?.set(pos, this.mineData[pos]!);
		this.sceneData[pos] = this.mineData[pos]!;
		this.floodReveal(pos, pu);
		this.v++;
		if (this.checkWin())
			this.gameover = 2;
	}
	revealAround(pos: number, pu?: ScenePartialUpdate)
	{
		const { unrevealed } = this.checkRevealAround(pos);
		const hasBomb = unrevealed.some(p => this.isBomb(p));
		if (hasBomb)
		{
			for (const p of unrevealed)
			{
				pu?.set(p, 0);
				this.sceneData[p] = 0;
			}

			this.gameover = 1;
			this.v++;
			return;
		}
		else
		{
			for (const p of unrevealed)
			{
				if (this.sceneData[p] === -1)
				{
					pu?.set(p, this.mineData[p]!);
					this.sceneData[p] = this.mineData[p]!;
					this.floodReveal(p, pu);
				}
			}
			this.v++;
			if (this.checkWin())
				this.gameover = 2;
		}
	}

	private checkWin()
	{
		for (let i = 0; i < this.width * this.height; ++i)
		{
			if (this.sceneData[i]! < 0 && this.mineData[i] !== -1)
			{
				return false;
			}
		}
		return true;
	}
	checkCmd({ id, v }: any)
	{
		if (this.id !== id)
		{
			console.log(`客户端操作id不一致，应该是${this.id}，客户端发送的是${id}`);
			throw new Ignore('id not match');
		}
		if (this.v !== v)
		{
			console.log(`客户端操作版本不一致，应该是${this.v}，客户端发送的是${v}`);
			throw new Ignore('version not match');
		}

	}
}

class Ignore extends Error
{
	reason: string;
	constructor(reason: string)
	{
		super('ignore');
		this.reason = reason || '';
	}
}

function genuuid()
{
	return crypto.randomUUID();
}