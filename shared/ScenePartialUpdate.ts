export default class ScenePartialUpdate
{
	zeros: Set<number> | null = null;
	map: Map<number, number> = new Map();

	constructor()
	{

	}
	get size()
	{
		return this.map.size + (this.zeros?.size || 0);
	}
	set(pos: number, value: number)
	{
		if (value === 0)
		{
			if (!this.zeros) this.zeros = new Set();
			this.zeros.add(pos);
			if (this.map.has(pos))
			{
				this.map.delete(pos);
			}
		}
		else
		{
			if (this.zeros?.has(pos))
			{
				this.zeros.delete(pos);
			}
			this.map.set(pos, value);
		}
	}

	toJSON()
	{
		return {
			zeros: this.zeros ? [...this.zeros] : null,
			map: [...this.map]
		};
	}

	static fromJSON(obj: any): ScenePartialUpdate
	{
		const g = new ScenePartialUpdate();
		if (obj.zeros)
		{
			g.zeros = new Set(obj.zeros);
		}
		if (obj.map)
		{
			g.map = new Map(obj.map);
		}
		return g;
	}
}