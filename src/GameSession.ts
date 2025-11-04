import { ClientSideSweepGame } from "../shared/MineSweepGame";

interface IWaitFlagOpResult
{
	pos: number;
	newValue:number;
	oldValue: number;
	oldVersion: number;
}

export default class GameSession
{
	inited = false;
	game: ClientSideSweepGame | null = null;
	userlist: string[] = [];
	myUserName: string = '';
	operating = false;
	//lastOpPos = -1;
	//对于插旗，不等待服务器返回，直接修改界面。不锁定盘面，玩家可以立即继续其它操作。
	//插旗操作不设置operating=true。当收到服务器opResult指令后，优先处理waitFlag中的内容
	waitFlagOps: IWaitFlagOpResult[] = [];
	clear()
	{
		this.inited = false;
		this.userlist.length = 0;
		this.myUserName = '';
		this.operating = false;
		this.waitFlagOps.length = 0;
	}
	reset()
	{
		this.clear();
		this.game = null;
		//this.lastOpPos = -1;
	}

	getPatchedGame(): ClientSideSweepGame | null
	{
		if (!this.game) return null;
		const g = this.game.clone();
		// if (this.waitFlagOps.length === 2)
		// {
		// 	console.warn('getPatchedGame: waitFlagOps length==2');
		// 	console.warn(`start version=${g.v}`);
		// 	for (const op of this.waitFlagOps)
		// 	{
		// 		console.warn(`op: pos=${op.pos}, oldVersion=${op.oldVersion}, newValue=${op.newValue}`);
		// 	}
		// }
		for (const op of this.waitFlagOps)
		{
			if (g.v === op.oldVersion)
			{
				g.v = op.oldVersion + 1;
				g.sceneData[op.pos] = op.newValue;
			}
			else
			{
				console.warn(`getPatchedGame: ignore waitFlagOp, oldVersion==${op.oldVersion},currentVersion==${g.v}`);
			}
		}
		return g;
	}
}