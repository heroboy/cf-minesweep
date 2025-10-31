export async function fetchApi(path: string, body: any): Promise<{ success: false, reason: string; } | { success: true, [key: string]: any; }>
{
	try
	{
		const resp = await fetch(path, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: typeof body === 'string' ? body : JSON.stringify(body)
		});
		if (!resp.ok)
		{
			return { success: false, reason: '服务器异常，状态错误' + resp.statusText };
		}
		return await resp.json();
	}
	catch (e: any)
	{
		console.error(e);
		return { success: false, reason: '服务器异常' };
	}
}

export function connectWs(url: string): Promise<WebSocket | null>
{
	return new Promise(resolve =>
	{
		let ws: WebSocket;
		try
		{
			ws = new WebSocket(url);
		}
		catch (e)
		{
			console.error(e);
			resolve(null);
			return;
		}
		let clear = () =>
		{
			ws.onopen = null;
			ws.onclose = null;
			ws.onerror = null;
		};
		ws.onopen = () =>
		{
			clear();
			resolve(ws);
		};
		ws.onerror = (e) =>
		{
			console.error(e);
			clear();
			resolve(null);
		};

	});
}

//@ts-ignore
globalThis['fetchApi'] = fetchApi;