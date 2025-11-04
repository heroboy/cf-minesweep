import { ClientSideSweepGame } from "../shared/MineSweepGame";

interface IWaitFlagOpResult
{
	pos: number;
	oldValue: number;
}

export default class GameSession
{
	inited = false;
	game: ClientSideSweepGame | null = null;
	userlist: string[] = [];
	myUserName: string = '';
	operating = false;
	lastOpPos = -1;
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
		this.lastOpPos = -1;
	}
}