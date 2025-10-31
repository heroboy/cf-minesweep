import { ClientSideSweepGame } from "../shared/MineSweepGame";

export default class GameSession
{
	inited = false;
	game: ClientSideSweepGame | null = null;
	userlist: string[] = [];
	myUserName: string = '';
	operating = false;
	lastOpPos = -1;
	clear()
	{
		this.inited = false;
		this.userlist.length = 0;
		this.myUserName = '';
		this.operating = false;
	}
	reset()
	{
		this.clear();
		this.game = null;
		this.lastOpPos = -1;
	}
}