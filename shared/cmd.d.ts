
interface IGame
{
	sceneData: number[];
	mineData?: number[];
	gameover: number;
	v: number;
	id: string;
	timestamp: number;
}

interface CmdLoginOk
{
	cmd: 'loginok';
	username: string;
}

interface CmdListUsers
{
	cmd: 'listusers';
	usernames: string[];
}

interface CmdAddUser
{
	cmd: 'adduser';
	username: string;
}
interface CmdRemoveUser
{
	cmd: 'removeuser';
	username: string;
}

interface CmdUpdateGame
{
	cmd: 'updategame';
	game: IGame;
	by?: string;
	op?: string;
	pos?: number;
	score?: number;
}

interface CmdOpResult
{
	cmd: 'opresult';
	success: boolean;
	reason?: string;
	pos: number;
	//data?: number;
	//version?: number;
}

export type SC_CMD = CmdLoginOk | CmdListUsers | CmdAddUser | CmdRemoveUser | CmdUpdateGame | CmdOpResult;

interface CmdResetGame
{
	cmd: 'resetgame';
	mode?: 'easy' | 'normal' | 'hard';
}

interface CmdFlag
{
	cmd: 'flag';
	pos: number;
	id: string;
	v: number;
}

interface CmdReveal
{
	cmd: 'reveal';
	pos: number;
	id: string;
	v: number;
}

interface CmdRevealAround
{
	cmd: 'revealaround';
	pos: number;
	id: string;
	v: number;
}

export type CS_CMD = CmdResetGame | CmdFlag | CmdReveal | CmdRevealAround;

export type ALL_CMD = SC_CMD | CS_CMD;