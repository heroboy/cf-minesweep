import { encrypt } from "./encrypt";
import MineSweepObject from "./MineSweepObject";
//export { default as MineSweepObject } from './MineSweepObject';
export { MineSweepObject };
interface Env
{
	MINE_SWEEP_OBJECT: DurableObjectNamespace<MineSweepObject>;
}
export default {
	fetch(request, env, ctx)
	{
		const url = new URL(request.url);

		if (request.method === 'POST' && url.pathname.startsWith("/api/"))
		{
			return handleApi(request, url.pathname, env);
		}
		if (url.pathname === '/ws')
		{
			return handleWs(request, env, ctx);
		}
		return new Response(null, { status: 404 });
	},
} satisfies ExportedHandler<Env>;


async function handleApi(request: Request, path: string, env: Env)
{
	if (path === '/api/login')
	{
		const body = await request.json<any>();
		if (!body || !body.username)
			return error('invalid body');

		if (body.username.length <= 0 || body.username.length > 16)
			return error('username length invalid');

		const token = await encrypt(body.username);
		return Response.json({ success: true, token });
	}
	else if (path === '/api/test')
	{
		return Response.json({ success: true });
	}
	return new Response(null, { status: 404 });
	function error(reason: string)
	{
		return Response.json({ success: false, reason });
	}
}

function handleWs(request: Request, env: Env, ctx: ExecutionContext)
{
	const upgradeHeader = request.headers.get('Upgrade');
	if (!upgradeHeader || upgradeHeader !== 'websocket')
	{
		return new Response('Worker expected Upgrade: websocket', {
			status: 426,
		});
	}
	if (request.method !== 'GET')
	{
		return new Response('Worker expected GET method', {
			status: 400,
		});
	}
	const stub = env.MINE_SWEEP_OBJECT.getByName('current');
	return stub.fetch(request);
}

